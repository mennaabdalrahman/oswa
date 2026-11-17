// The alarm engine. One 1-second tick compares the clock with each enabled alarm — drift-free, and it recovers
// by itself when a phone wakes up, because it compares timestamps instead of trusting a long timer.
//
// What it does when an alarm is due: shows a notification, starts the sound + vibration, and opens the ring screen.
// What it needs: the page to be alive (open tab or installed web app). A web page cannot ring after it is closed.
import {
  KEYS, getAlarms, subscribeAlarms, anyEnabled, ringTime, sleepTime, addDays, getRuntime, patchRuntime,
  getRing, setRing, prayerName, fmtClock,
} from './alarms'
import { notifyAlarm, closeAlarmNotifications } from './notify'
import { A } from './alarmStrings'

const GRACE = 10 * 60 * 1000        // still ring if we only noticed the alarm a few minutes late
const MAX_RING = 10 * 60 * 1000     // silence an alarm nobody answered (the ring screen stays)
const AWAKE_WAIT = 2 * 60 * 1000    // how long "are you awake?" waits before the alarm rings again

let api = { getLoc: () => null, getLang: () => 'en', openRing: () => {} }
let sound = null, stopVib = null, audioToken = 0, autoTimer = null

/* ---------------------------------- sound ---------------------------------- */
function stopRingAudio() {
  audioToken++
  clearTimeout(autoTimer)
  if (sound) { sound.stop(); sound = null }
  if (stopVib) { stopVib(); stopVib = null }
}

async function startRingAudio(cfg, kind) {
  stopRingAudio()
  const token = audioToken
  try {
    const m = await import('./sounds')
    if (token !== audioToken) return                       // finished while the audio code was loading
    const id = kind === 'sleep' ? cfg.sleep.sound : cfg.sound
    sound = m.playSound(id, { volume: kind === 'sleep' ? 0.7 : cfg.sysVol ? 1 : cfg.vol, gentle: kind === 'alarm' && cfg.gentle })
    if (kind !== 'sleep') stopVib = m.startVibrate()
    if (kind !== 'alarm') autoTimer = setTimeout(stopRingAudio, 25000)   // reminders are short; the alarm keeps going
  } catch { /* audio unavailable — the notification and the screen still work */ }
}

/* ---------------------------------- ringing ---------------------------------- */
function ring(key, kind, id) {
  const cfg = getAlarms().items[key]
  patchRuntime((r) => ({ ...r, fired: { ...r.fired, [id]: Date.now() } }))
  setRing({ key, kind, id, at: Date.now() })

  const lang = api.getLang(), x = A(lang), name = prayerName(key, lang)
  const title = kind === 'alarm' ? x.ringTitle(name) : kind === 'awake' ? x.awakeTitle : x.sleepTitle
  const body = kind === 'alarm' ? `${fmtClock(new Date(), lang)} · ${x.notifBody}` : kind === 'awake' ? x.awakeNotif : x.sleepNotif
  notifyAlarm({ title, body, tag: 'alarm-' + key, key, kind })
  startRingAudio(cfg, kind)
  api.openRing(key, kind)
}

/** the user completed the challenge (or confirmed) */
export function finishRing() {
  const r = getRing()
  if (!r) return
  stopRingAudio()
  closeAlarmNotifications('alarm-' + r.key)
  const cfg = getAlarms().items[r.key]
  patchRuntime((rt) => {
    const snooze = { ...rt.snooze }, awake = { ...rt.awake }
    delete snooze[r.key]
    if (r.kind === 'awake') delete awake[r.key]
    if (r.kind === 'alarm' && cfg.awake.on) awake[r.key] = { at: Date.now() + cfg.awake.mins * 60000 }   // check on them later
    return { ...rt, snooze, awake }
  })
  setRing(null)
}

/** "snooze": quiet now, ring again after the chosen minutes */
export function snoozeRing() {
  const r = getRing()
  if (!r || r.kind !== 'alarm') return
  const cfg = getAlarms().items[r.key]
  if (!cfg.snooze) return
  stopRingAudio()
  closeAlarmNotifications('alarm-' + r.key)
  patchRuntime((rt) => ({ ...rt, snooze: { ...rt.snooze, [r.key]: Date.now() + cfg.snooze * 60000 } }))
  setRing(null)
}

/* ---------------------------------- the tick ---------------------------------- */
const due = (t, id, rt, now) => t && now >= +t && now - +t < GRACE && !rt.fired[id]

function tick() {
  const now = Date.now()
  const r = getRing()
  if (r) {
    if (r.kind === 'alarm' && now - r.at > MAX_RING && sound) stopRingAudio()
    if (r.kind === 'awake' && now - r.at > AWAKE_WAIT) {             // nobody confirmed → ring again, for real
      stopRingAudio(); setRing(null); ring(r.key, 'alarm', `${r.id}!${now}`)
    }
    return                                                           // never start a second alarm on top of one
  }
  const st = getAlarms(), rt = getRuntime(), loc = api.getLoc(), today = new Date(now)

  for (const key of KEYS) {
    const cfg = st.items[key]

    const sn = rt.snooze[key]
    if (sn && now >= sn) {
      patchRuntime((x) => { const s = { ...x.snooze }; delete s[key]; return { ...x, snooze: s } })
      if (now - sn < GRACE) { ring(key, 'alarm', `${key}@snooze${sn}`); return }
    }
    const aw = rt.awake[key]
    if (aw && now >= aw.at) {
      patchRuntime((x) => { const s = { ...x.awake }; delete s[key]; return { ...x, awake: s } })
      if (now - aw.at < 30 * 60000) { ring(key, 'awake', `${key}@awake${aw.at}`); return }
    }

    if (!cfg.on) continue
    for (const off of [-1, 0]) {                                      // yesterday too: "90 min after Isha" can cross midnight
      const t = ringTime(key, cfg, loc, addDays(today, off))
      const id = `${key}@${t && +t}`
      if (due(t, id, rt, now)) { ring(key, 'alarm', id); return }
    }
    if (key === 'fajr' && cfg.sleep.on) {
      for (const off of [-1, 0, 1]) {
        const t = sleepTime(cfg, loc, addDays(today, off))
        const id = `sleep@${t && +t}`
        if (due(t, id, rt, now)) { ring('fajr', 'sleep', id); return }
      }
    }
  }
}

/* ------------------------- keep the screen on, unlock audio ------------------------- */
let wake = null
async function syncWakeLock() {
  const want = anyEnabled() && document.visibilityState === 'visible'
  try {
    if (want && !wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request('screen')
      wake.addEventListener('release', () => { wake = null })
    } else if (!want && wake) { await wake.release(); wake = null }
  } catch { /* not allowed right now */ }
}

let unlocked = false
function onGesture() {
  if (unlocked || !anyEnabled()) return
  import('./sounds').then((m) => { m.unlockAudio(); unlocked = true }).catch(() => {})
}

/**
 * Start the engine. `getLoc`/`getLang` are read on every tick, so it always sees the current values.
 * `openRing(key, kind)` should navigate to the ring screen. Returns a stop function.
 */
export function startAlarmEngine(options) {
  api = { ...api, ...options }
  const onInstall = (e) => { e.preventDefault(); window.__mcInstall = e }   // kept so the alarms screen can offer "Install"
  window.addEventListener('beforeinstallprompt', onInstall)
  const iv = setInterval(tick, 1000)
  const onVis = () => { tick(); syncWakeLock() }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('pointerdown', onGesture, true)
  window.addEventListener('keydown', onGesture, true)
  const unsub = subscribeAlarms(syncWakeLock)
  syncWakeLock(); tick()
  return () => {
    clearInterval(iv)
    window.removeEventListener('beforeinstallprompt', onInstall)
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pointerdown', onGesture, true)
    window.removeEventListener('keydown', onGesture, true)
    unsub()
  }
}
