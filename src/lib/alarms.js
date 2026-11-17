// Prayer alarms — data model, persistence, and "when does this ring" maths. No UI here.
// Settings live in one small localStorage blob; the engine (alarmEngine.js) reads them and rings.
import { useSyncExternalStore } from 'react'
import { store } from './storage'
import { prayerTimes, setMethodId, getMethodId } from './prayerTimes'

export const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
export const NAME = {
  fajr: { ar: 'الفجر', en: 'Fajr' }, dhuhr: { ar: 'الظهر', en: 'Dhuhr' }, asr: { ar: 'العصر', en: 'Asr' },
  maghrib: { ar: 'المغرب', en: 'Maghrib' }, isha: { ar: 'العشاء', en: 'Isha' },
}
export const ICON = { fajr: '🌅', dhuhr: '🕌', asr: '🌤️', maghrib: '🌇', isha: '🌙' }
export const CHALLENGES = ['none', 'questions', 'shake', 'math', 'memory', 'qr', 'type', 'random']
export const prayerName = (key, lang) => (lang === 'ar' ? NAME[key].ar : NAME[key].en)

const KEY = 'mc_alarms_v1'
const RT_KEY = 'mc_alarm_rt_v1'
const DEFAULT_AT = { fajr: 5 * 60, dhuhr: 13 * 60, asr: 16 * 60, maghrib: 18 * 60, isha: 20 * 60 }   // minutes after midnight (fixed mode)

export const defaultAlarm = (key) => ({
  on: false,
  mode: 'prayer',            // 'prayer' = relative to the prayer time · 'fixed' = a clock time
  anchor: key,               // Fajr's alarm can anchor to 'sunrise' instead
  dir: 'before',             // 'before' | 'after'
  mins: 0,                   // 0–120
  at: DEFAULT_AT[key],
  sound: 'bell',
  sysVol: true,              // true = follow the phone's volume; false = use `vol`
  vol: 0.8,
  gentle: false,             // start quiet and rise
  challenge: 'none',
  qr: '',                    // the saved QR text (QR challenge)
  snooze: 0,                 // minutes, 0 = off
  awake: { on: false, mins: 3 },
  sleep: { on: false, mode: 'prayer', hrs: 8, min: 0, at: 22 * 60, sound: 'soft' },   // Fajr only
})

function merge(key, saved) {
  const d = defaultAlarm(key), s = saved || {}
  return { ...d, ...s, awake: { ...d.awake, ...(s.awake || {}) }, sleep: { ...d.sleep, ...(s.sleep || {}) } }
}

function load() {
  const s = store.get(KEY, null) || {}
  const items = {}
  for (const k of KEYS) items[k] = merge(k, s.items && s.items[k])
  const method = typeof s.method === 'string' ? s.method : 'egypt'
  setMethodId(method)
  return { method: getMethodId(), sounds: Array.isArray(s.sounds) ? s.sounds : [], items }
}

let state = load()
const subs = new Set()
const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn) }
export const subscribeAlarms = subscribe
export const getAlarms = () => state
export const useAlarms = () => useSyncExternalStore(subscribe, getAlarms)

function commit(next) {
  state = next
  store.set(KEY, state)
  subs.forEach((f) => f())
}
export const setAlarm = (key, patch) => commit({ ...state, items: { ...state.items, [key]: { ...state.items[key], ...patch } } })
export const setMethod = (id) => { setMethodId(id); commit({ ...state, method: getMethodId() }) }
export const addSoundMeta = (m) => commit({ ...state, sounds: [...state.sounds, m] })
export const removeSoundMeta = (id) => commit({
  ...state, sounds: state.sounds.filter((s) => s.id !== id),
  items: Object.fromEntries(KEYS.map((k) => [k, { ...state.items[k], sound: state.items[k].sound === id ? 'bell' : state.items[k].sound,
    sleep: { ...state.items[k].sleep, sound: state.items[k].sleep.sound === id ? 'soft' : state.items[k].sleep.sound } }])),
})
export const anyEnabled = (s = state) => KEYS.some((k) => s.items[k].on)

/* ------------------------------ when does it ring ------------------------------ */

const noonOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)

/** the moment this alarm rings on the local day of `day` (null when a location is needed and missing) */
export function ringTime(key, cfg, loc, day = new Date()) {
  if (cfg.mode === 'fixed') {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    d.setHours(0, cfg.at, 0, 0)            // minutes roll over into hours, so 0–1439 is fine
    return d
  }
  if (!loc) return null
  const want = key === 'fajr' && cfg.anchor === 'sunrise' ? 'sunrise' : key
  const p = prayerTimes(loc.lat, loc.lng, noonOf(day)).find((x) => x.key === want)
  if (!p || !p.date) return null
  return new Date(p.date.getTime() + (cfg.dir === 'before' ? -1 : 1) * cfg.mins * 60000)
}

/** the next time it will ring (today if still ahead, otherwise tomorrow) */
export function nextRing(key, cfg, loc, now = new Date()) {
  const t = ringTime(key, cfg, loc, now)
  if (t && t > now) return t
  return ringTime(key, cfg, loc, addDays(now, 1))
}

/** sleep-reminder moments around a day — relative to that day's Fajr alarm, or a fixed clock time */
export function sleepTime(cfg, loc, day) {
  const sl = cfg.sleep
  if (sl.mode === 'fixed') {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    d.setHours(0, sl.at, 0, 0)
    return d
  }
  const fajr = ringTime('fajr', cfg, loc, day)
  return fajr ? new Date(fajr.getTime() - (sl.hrs * 60 + sl.min) * 60000) : null
}
export function nextSleep(cfg, loc, now = new Date()) {
  for (const off of [0, 1, 2]) {
    const t = sleepTime(cfg, loc, addDays(now, off))
    if (t && t > now) return t
  }
  return null
}

/* ------------------------------ runtime (what already rang) ------------------------------ */

const DAY = 864e5
let rt = (() => {
  const s = store.get(RT_KEY, null) || {}
  const cut = Date.now() - 3 * DAY
  const fired = {}
  for (const [id, at] of Object.entries(s.fired || {})) if (at > cut) fired[id] = at
  return { fired, snooze: s.snooze || {}, awake: s.awake || {} }
})()
export const getRuntime = () => rt
export function patchRuntime(fn) { rt = fn(rt); store.set(RT_KEY, rt) }

// the alarm that is ringing right now (memory only — a reload silences it, which is the safe default)
let ring = null
const ringSubs = new Set()
export const getRing = () => ring
export function setRing(r) { ring = r; ringSubs.forEach((f) => f()) }
export const useRing = () => useSyncExternalStore((fn) => { ringSubs.add(fn); return () => ringSubs.delete(fn) }, getRing)

/* ------------------------------ formatting ------------------------------ */

export function fmtClock(date, lang = 'en') {
  if (!date) return '—'
  const locale = lang === 'ar' ? 'ar-EG' : lang === 'ja' ? 'ja-JP' : 'en-US'
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}
export function fmtMinutesOfDay(min, lang = 'en') {
  return fmtClock(new Date(2026, 0, 1, Math.floor(min / 60), min % 60), lang)
}
export function fmtIn(ms, lang = 'en') {
  const total = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(total / 60), m = total % 60
  const num = (n) => (lang === 'ar' ? n.toLocaleString('ar-EG') : String(n))
  if (lang === 'ar') return h ? `${num(h)} س ${num(m)} د` : `${num(m)} د`
  return h ? `${h}h ${m}m` : `${m}m`
}
