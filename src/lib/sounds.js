// Alarm sounds. Built-in tones are synthesised with Web Audio (no files to download); the user can add their own
// audio files (an adhan, for example), which are kept on the device in IndexedDB.
// Loaded on demand — it is not part of the first bundle.
import { addSoundMeta, removeSoundMeta } from './alarms'

export const BUILTIN = [
  { id: 'bell', ar: 'جرس', en: 'Bell' },
  { id: 'chime', ar: 'نغمة متدرجة', en: 'Rising chime' },
  { id: 'soft', ar: 'ضوء', en: 'Soft glow' },
  { id: 'drop', ar: 'قطرة ماء', en: 'Water drop' },
  { id: 'beep', ar: 'إشعار بسيط', en: 'Simple beep' },
]

let ctx = null
/** Browsers only allow sound after a tap. Call this from any user gesture and later alarms can play freely. */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = ctx || new AC()
    if (ctx.state === 'suspended') ctx.resume()
  } catch { /* no audio */ }
}

/* ---- the tones: each schedules one cycle starting at time t on node `out` ---- */
function tone(freq, t, dur, type, peak, out) {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05)
}
const PATTERNS = {
  bell:  { period: 2.6, play: (t, out) => [1, 2.76, 5.4].forEach((r, i) => tone(660 * r, t, 2.2 / (i + 1), 'sine', 0.5 / (i + 1), out)) },
  chime: { period: 2.2, play: (t, out) => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.18, 0.7, 'sine', 0.45, out)) },
  soft:  { period: 2.6, play: (t, out) => { tone(440, t, 1.4, 'triangle', 0.4, out); tone(554.37, t + 0.3, 1.4, 'triangle', 0.3, out) } },
  drop:  { period: 1.3, play: (t, out) => {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.22)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4) } },
  beep:  { period: 1.0, play: (t, out) => { tone(880, t, 0.16, 'square', 0.16, out); tone(880, t + 0.26, 0.16, 'square', 0.16, out) } },
}

/* ---- user sounds in IndexedDB ---- */
const DB = 'mc_sounds'
const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1)
  r.onupgradeneeded = () => r.result.createObjectStore('blobs')
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
})
async function idb(mode, fn) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction('blobs', mode), req = fn(tx.objectStore('blobs'))
    tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error)
  })
}
export const MAX_SOUND_BYTES = 12 * 1024 * 1024

export async function addCustomSound(file) {
  if (!file || file.size > MAX_SOUND_BYTES) throw new Error('too-big')
  const id = 'c' + Date.now().toString(36)
  await idb('readwrite', (s) => s.put(file, id))
  addSoundMeta({ id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) })
  return id
}
export async function deleteCustomSound(id) {
  try { await idb('readwrite', (s) => s.delete(id)) } catch { /* already gone */ }
  removeSoundMeta(id)
}

/* ---- playback ---- */
/**
 * Plays a sound on loop until stop() is called.
 * @param {string} id          built-in id or a user sound id
 * @param {{volume?:number, gentle?:boolean}} o   volume 0–1; gentle = start very quiet and rise over ~30 s
 */
export function playSound(id, { volume = 1, gentle = false } = {}) {
  let stopped = false
  const cleanups = []
  const stop = () => { stopped = true; cleanups.splice(0).forEach((fn) => { try { fn() } catch { /* ignore */ } }) }
  const RISE = 30000

  if (PATTERNS[id]) {
    unlockAudio()
    if (!ctx) return { stop }
    const master = ctx.createGain()
    master.connect(ctx.destination)
    const now = ctx.currentTime
    master.gain.setValueAtTime(gentle ? 0.04 * volume : volume, now)
    if (gentle) master.gain.linearRampToValueAtTime(volume, now + RISE / 1000)
    const pat = PATTERNS[id]
    const cycle = () => { if (!stopped) pat.play(ctx.currentTime + 0.05, master) }
    cycle()
    const iv = setInterval(cycle, pat.period * 1000)
    cleanups.push(() => clearInterval(iv), () => { master.gain.cancelScheduledValues(ctx.currentTime); master.disconnect() })
    return { stop }
  }

  // a sound the user added
  idb('readonly', (s) => s.get(id)).then((blob) => {
    if (stopped) return
    if (!blob) { cleanups.push(playSound('bell', { volume, gentle }).stop); return }   // file missing → the default bell
    const url = URL.createObjectURL(blob)
    const a = new Audio(url)
    a.loop = true
    a.volume = gentle ? 0.04 * volume : volume
    a.play().catch(() => {})
    let iv = null
    if (gentle) {
      const t0 = Date.now()
      iv = setInterval(() => { a.volume = Math.min(volume, (0.04 + 0.96 * Math.min(1, (Date.now() - t0) / RISE)) * volume) }, 500)
    }
    cleanups.push(() => { clearInterval(iv); a.pause(); URL.revokeObjectURL(url) })
    if (stopped) stop()
  }).catch(() => {})
  return { stop }
}

/** repeating vibration (phones that allow it) */
export function startVibrate() {
  if (!('vibrate' in navigator)) return () => {}
  const buzz = () => { try { navigator.vibrate([600, 300, 600]) } catch { /* ignore */ } }
  buzz()
  const iv = setInterval(buzz, 2000)
  return () => { clearInterval(iv); try { navigator.vibrate(0) } catch { /* ignore */ } }
}
