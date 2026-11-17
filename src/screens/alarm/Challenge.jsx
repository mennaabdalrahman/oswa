// The wake-up challenges. <Challenge kind onDone/> renders one; <QrScanner/> is shared with the settings screen.
import { useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONS, PHRASES, EMOJI, pickRand, shuffle } from './alarmContent'

const nf = (lang) => (n) => (lang === 'ar' ? Number(n).toLocaleString('ar-EG', { useGrouping: false }) : String(n))
const strip = (s) => s.replace(/[ً-ٰٟ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

/* ---------- 3 questions ---------- */
function Questions({ x, lang, onDone, progress }) {
  const picks = useMemo(() => shuffle(QUESTIONS).slice(0, 3), [])
  const [i, setI] = useState(0), [bad, setBad] = useState(false)
  const q = picks[i], L = lang === 'ar' ? 'ar' : 'en'
  useEffect(() => { progress(i / 3) }, [i, progress])
  const answer = (k) => {
    if (k !== q.c) { setBad(true); return }
    setBad(false)
    if (i === 2) onDone(); else setI(i + 1)
  }
  return (
    <div className="ch-body">
      <div className="ch-sub">{x.qOf(i + 1, 3)}</div>
      <h2 className="ch-q">{q[L]}</h2>
      <div className="ch-opts">{q.a[L].map((t, k) => <button key={k} className="ch-opt" onClick={() => answer(k)}>{t}</button>)}</div>
      {bad && <div className="ch-bad" role="alert">{x.wrongAns}</div>}
    </div>
  )
}

/* ---------- 3 maths questions ---------- */
function MathQ({ x, lang, onDone, progress }) {
  const n = nf(lang)
  const make = () => { const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9), s = a + b
    const set = new Set([s]); while (set.size < 4) set.add(Math.max(1, s + Math.floor(Math.random() * 7) - 3))
    return { a, b, s, opts: shuffle([...set]) } }
  const [qs] = useState(() => [make(), make(), make()])
  const [i, setI] = useState(0), [bad, setBad] = useState(false)
  useEffect(() => { progress(i / 3) }, [i, progress])
  const q = qs[i]
  return (
    <div className="ch-body">
      <div className="ch-sub">{x.qOf(i + 1, 3)}</div>
      <h2 className="ch-q" dir="ltr" style={{ textAlign: 'center' }}>{n(q.a)} + {n(q.b)} = ?</h2>
      <div className="ch-grid2">{q.opts.map((o) => (
        <button key={o} className="ch-tile" onClick={() => { if (o === q.s) { setBad(false); i === 2 ? onDone() : setI(i + 1) } else setBad(true) }}>{n(o)}</button>))}</div>
      {bad && <div className="ch-bad" role="alert">{x.wrongAns}</div>}
    </div>
  )
}

/* ---------- memory cards ---------- */
function Memory({ x, onDone, progress }) {
  const [cards] = useState(() => shuffle(shuffle(EMOJI).slice(0, 4).flatMap((e, k) => [{ id: k * 2, e }, { id: k * 2 + 1, e }])))
  const [open, setOpen] = useState([]), [matched, setMatched] = useState([])
  const lock = useRef(false)
  useEffect(() => { progress(matched.length / cards.length) }, [matched, cards.length, progress])
  const flip = (c) => {
    if (lock.current || open.includes(c.id) || matched.includes(c.id)) return
    const next = [...open, c.id]
    setOpen(next)
    if (next.length === 2) {
      const [a, b] = next.map((id) => cards.find((k) => k.id === id))
      lock.current = true
      setTimeout(() => {
        if (a.e === b.e) {
          const m = [...matched, a.id, b.id]; setMatched(m)
          if (m.length === cards.length) onDone()
        }
        setOpen([]); lock.current = false
      }, 650)
    }
  }
  return (
    <div className="ch-body">
      <div className="ch-sub">{x.memoryHint}</div>
      <div className="ch-mem">{cards.map((c) => {
        const up = open.includes(c.id) || matched.includes(c.id)
        return <button key={c.id} className={'ch-card' + (up ? ' up' : '')} onClick={() => flip(c)} aria-label={up ? c.e : '?'}>{up ? c.e : '?'}</button>
      })}</div>
    </div>
  )
}

/* ---------- type the sentence ---------- */
function Type({ x, lang, onDone, progress }) {
  const ph = useMemo(() => pickRand(PHRASES), [])
  const text = lang === 'ar' ? ph.ar : ph.en
  const [v, setV] = useState(''), [bad, setBad] = useState(false)
  useEffect(() => { progress(Math.min(1, strip(v).length / Math.max(1, strip(text).length))) }, [v, text, progress])
  const check = () => { if (strip(v) === strip(text)) onDone(); else setBad(true) }
  return (
    <div className="ch-body">
      <div className="ch-sub">{x.typeHint}</div>
      <div className="ch-phrase" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{text}</div>
      <input className="name-input ch-input" value={v} placeholder={x.typePh} dir={lang === 'ar' ? 'rtl' : 'ltr'} autoComplete="off" autoCorrect="off" spellCheck={false}
        onChange={(e) => { setV(e.target.value); setBad(false) }} onKeyDown={(e) => e.key === 'Enter' && check()} />
      {bad && <div className="ch-bad" role="alert">{x.wrongAns}</div>}
      <button className="btn block" onClick={check}>{x.tapNext}</button>
    </div>
  )
}

/* ---------- shake ---------- */
const SHAKES = 12
function Shake({ x, lang, onDone, progress }) {
  const n = nf(lang)
  const [count, setCount] = useState(0), [state, setState] = useState('ready'), [seen, setSeen] = useState(false)
  const last = useRef(0), prev = useRef(null), cnt = useRef(0)
  useEffect(() => { progress(count / SHAKES) }, [count, progress])
  const listen = () => {
    const onMotion = (e) => {
      setSeen(true)
      const a = e.accelerationIncludingGravity || e.acceleration
      if (!a) return
      const m = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0)
      const d = prev.current == null ? 0 : Math.abs(m - prev.current); prev.current = m
      const t = Date.now()
      if (d > 18 && t - last.current > 250) {
        last.current = t; cnt.current += 1; setCount(cnt.current)
        try { navigator.vibrate && navigator.vibrate(40) } catch { /* ignore */ }
        if (cnt.current >= SHAKES) { window.removeEventListener('devicemotion', onMotion); onDone() }
      }
    }
    window.addEventListener('devicemotion', onMotion)
    setState('on')
    return () => window.removeEventListener('devicemotion', onMotion)
  }
  const stopRef = useRef(null)
  useEffect(() => {
    const needs = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'
    if (typeof DeviceMotionEvent === 'undefined') { setState('none'); return }
    if (!needs) stopRef.current = listen()
    return () => stopRef.current && stopRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [noSensor, setNoSensor] = useState(false)
  useEffect(() => { const id = setTimeout(() => { if (!seen) setNoSensor(true) }, 4000); return () => clearTimeout(id) }, [seen])
  const ask = async () => { try { const r = await DeviceMotionEvent.requestPermission(); if (r === 'granted') stopRef.current = listen(); else setState('none') } catch { setState('none') } }
  const iosAsk = state === 'ready' && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'
  const tap = () => { cnt.current += 1; setCount(cnt.current); if (cnt.current >= SHAKES) onDone() }
  return (
    <div className="ch-body" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="ch-shake" aria-hidden="true">📳</div>
      <h2 className="ch-q">{x.shakeHint(count, SHAKES)}</h2>
      {iosAsk && <button className="btn block" onClick={ask}>{x.shakeAsk}</button>}
      {(state === 'none' || noSensor) && <><div className="ch-sub">{x.shakeFallback}</div><button className="btn block" onClick={tap}>{n(count)} / {n(SHAKES)} — {x.tapNext}</button></>}
    </div>
  )
}

/* ---------- QR (camera + BarcodeDetector) ---------- */
export const qrSupported = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

export function QrScanner({ x, onResult, hint }) {
  const vid = useRef(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!qrSupported()) { setErr(x.qrUnsupported); return }
    let stream, alive = true, raf = 0
    const det = new window.BarcodeDetector({ formats: ['qr_code'] })
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
      if (!alive) { s.getTracks().forEach((t) => t.stop()); return }
      stream = s; vid.current.srcObject = s; vid.current.play().catch(() => {})
      const loop = async () => {
        if (!alive) return
        try { const r = await det.detect(vid.current); if (r && r[0] && r[0].rawValue) { onResult(r[0].rawValue); return } } catch { /* frame not ready */ }
        raf = setTimeout(loop, 250)
      }
      loop()
    }).catch(() => setErr(x.qrCamera))
    return () => { alive = false; clearTimeout(raf); stream && stream.getTracks().forEach((t) => t.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="ch-body" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="ch-sub">{hint}</div>
      {err ? <div className="ch-bad">{err}</div> : <video ref={vid} className="ch-video" playsInline muted />}
    </div>
  )
}

function Qr({ x, saved, onDone, progress }) {
  const [wrong, setWrong] = useState(false)
  useEffect(() => { progress(0) }, [progress])
  if (!saved) return <div className="ch-body"><div className="ch-bad">{x.qrNone}</div><button className="btn block" onClick={onDone}>{x.tapNext}</button></div>
  return (
    <>
      <QrScanner x={x} hint={x.qrScanning} onResult={(v) => { if (v === saved) onDone(); else { setWrong(true) } }} />
      {wrong && <div className="ch-bad" style={{ textAlign: 'center' }}>{x.qrWrong}</div>}
    </>
  )
}

/** The unsupported-QR case falls back to a plain confirmation so nobody is locked out. */
export function Challenge({ kind, x, lang, qr, onDone, progress }) {
  const k = kind === 'random' ? 'random' : kind
  const [picked] = useState(() => pickRand(['questions', 'shake', 'math', 'memory', 'type']))
  const real = k === 'random' ? picked : k
  const props = { x, lang, onDone, progress }
  if (real === 'questions') return <Questions {...props} />
  if (real === 'math') return <MathQ {...props} />
  if (real === 'memory') return <Memory {...props} />
  if (real === 'type') return <Type {...props} />
  if (real === 'shake') return <Shake {...props} />
  if (real === 'qr') return qrSupported() ? <Qr {...props} saved={qr} /> : <div className="ch-body"><div className="ch-bad">{x.qrUnsupported}</div><button className="btn block" onClick={onDone}>{x.tapNext}</button></div>
  return null
}
