// "Monthly times" — a month table of prayer times (Gregorian + Hijri), tap a day for details, share, add to calendar.
import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { prayerTimes, METHODS, getMethodId } from '../lib/prayerTimes'
import { toHijri, HIJRI_MONTHS } from '../lib/events'
import { getPosition } from '../lib/location'
import { setMethod, useAlarms } from '../lib/alarms'
import { A } from '../lib/alarmStrings'
import './timetable.css'

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const labKey = { fajr: 'ttFajr', sunrise: 'ttSunrise', dhuhr: 'ttDhuhr', asr: 'ttAsr', maghrib: 'ttMaghrib', isha: 'ttIsha' }
const LOC = (l) => (l === 'ar' ? 'ar-EG' : l === 'ja' ? 'ja-JP' : l === 'de' ? 'de-DE' : l === 'fr' ? 'fr-FR' : l === 'es' ? 'es-ES' : 'en-GB')
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

function Icon({ d, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
}

export default function Timetable() {
  const { lang, loc, setLoc, t } = useApp()
  const x = A(lang)
  const { method } = useAlarms()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sel, setSel] = useState(now)
  const [hijriFirst, setHijriFirst] = useState(false)
  const [msg, setMsg] = useState('')
  const todayRef = useRef(null)
  const ar = lang === 'ar'
  const num = (n) => (ar ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n))
  const clock = (d) => {
    if (!d) return '—'
    const h = d.getHours() % 12 || 12
    return `${num(h)}:${ar ? num(String(d.getMinutes()).padStart(2, '0')) : String(d.getMinutes()).padStart(2, '0')}`
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => {
    if (!loc) return []
    const n = new Date(ym.y, ym.m + 1, 0).getDate()
    return Array.from({ length: n }, (_, i) => {
      const day = new Date(ym.y, ym.m, i + 1, 12)
      const p = Object.fromEntries(prayerTimes(loc.lat, loc.lng, day).map((q) => [q.key, q.date]))
      return { day, p, h: toHijri(day) }
    })
  }, [loc, ym, method])

  useEffect(() => {      // centre today inside the table only — never scroll the page itself
    const el = todayRef.current, box = el && el.parentElement
    if (box) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2
  }, [rows.length, ym.m])

  const mName = new Date(ym.y, ym.m, 1).toLocaleDateString(LOC(lang), { month: 'long', year: 'numeric' })
  const hs = rows.length ? [rows[0].h, rows[rows.length - 1].h] : null
  const hMonths = HIJRI_MONTHS[ar ? 'ar' : 'en']
  const hRange = hs && (hs[0].m === hs[1].m
    ? `${hMonths[hs[0].m - 1]} ${num(hs[0].y)}`
    : `${hMonths[hs[0].m - 1]} – ${hMonths[hs[1].m - 1]} ${num(hs[1].y)}`)
  const step = (n) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  const selRow = rows.find((r) => sameDay(r.day, sel)) || rows[0]
  const selDate = selRow && selRow.day.toLocaleDateString(LOC(lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const selHijri = selRow && `${num(selRow.h.d)} ${hMonths[selRow.h.m - 1]} ${num(selRow.h.y)}${ar ? ' هـ' : ' AH'}`

  async function share() {
    if (!selRow) return
    const lines = COLS.map((k) => `${x[labKey[k]]}: ${clock(selRow.p[k])}`).join('\n')
    const text = x.ttShareText(selDate, selHijri, lines)
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setMsg(x.ttCopied) }
    } catch { /* cancelled */ }
    setTimeout(() => setMsg(''), 2200)
  }

  function addToCalendar() {
    const z = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const ev = []
    rows.forEach((r) => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((k) => {
      if (!r.p[k]) return
      ev.push(['BEGIN:VEVENT', `UID:${k}-${+r.p[k]}@muslim-companion`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(r.p[k])}`,
        `DTEND:${z(new Date(+r.p[k] + 20 * 60000))}`, `SUMMARY:${x[labKey[k]]}`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${x[labKey[k]]}`, 'TRIGGER:PT0S', 'END:VALARM', 'END:VEVENT'].join('\r\n'))
    }))
    const blob = new Blob([['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Muslim Companion//Prayer times//EN', ...ev, 'END:VCALENDAR'].join('\r\n')], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `prayer-times-${ym.y}-${String(ym.m + 1).padStart(2, '0')}.ics`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  async function askLoc() {
    try { setLoc(await getPosition({ timeout: 10000 })) } catch { setMsg(x.locDenied); setTimeout(() => setMsg(''), 3000) }
  }

  if (!loc) {
    return (
      <div className="tt-wrap">
        <div className="tt-empty"><p>{x.ttNeedLoc}</p><button className="btn block" onClick={askLoc}>{x.needLocBtn}</button>{msg && <div className="tt-msg">{msg}</div>}</div>
      </div>
    )
  }

  return (
    <div className="tt-wrap">
      <div className="tt-nav">
        <button className="tt-circ" onClick={() => step(ar ? 1 : -1)} aria-label={x.ttPrev}><Icon d="M15 18l-6-6 6-6" /></button>
        <div className="tt-title">
          <div className="tt-month">{hijriFirst ? hRange : mName}</div>
          <button className="tt-pill" onClick={() => setHijriFirst((v) => !v)}>
            <Icon size={15} d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3" /><span>{hijriFirst ? mName : hRange}</span>
          </button>
        </div>
        <button className="tt-circ" onClick={() => step(ar ? -1 : 1)} aria-label={x.ttNext}><Icon d="M9 18l6-6-6-6" /></button>
      </div>

      <button className="tt-cal" onClick={addToCalendar}>
        <span className="tt-cal-ic" aria-hidden="true">🗓️</span><span className="tt-cal-t">{x.ttAddCal}</span><Icon size={16} d={ar ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </button>

      <div className="tt-card">
        <div className="tt-row tt-head">
          <span>{x.ttMiladi}</span><span>{x.ttDay}</span>
          {COLS.map((k) => <span key={k}>{x[labKey[k]]}</span>)}
          <span>{x.ttHijri}</span>
        </div>
        <div className="tt-scroll">
          {rows.map((r) => {
            const isToday = sameDay(r.day, now), isSel = sameDay(r.day, selRow.day), fri = r.day.getDay() === 5
            return (
              <button key={+r.day} ref={isToday ? todayRef : null} onClick={() => setSel(r.day)}
                className={`tt-row tt-day${isToday ? ' today' : ''}${isSel ? ' sel' : ''}${fri ? ' fri' : ''}`}>
                <span className="tt-d">{num(r.day.getDate())}</span>
                <span className="tt-wd">{r.day.toLocaleDateString(LOC(lang), { weekday: ar ? 'long' : 'short' })}</span>
                {COLS.map((k) => <span key={k} className="tt-t">{clock(r.p[k])}</span>)}
                <span className="tt-h">{num(r.h.d)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="tt-card tt-sel">
        <div className="tt-sel-top">
          <div>
            <div className="tt-sel-date">{selDate}</div>
            <div className="tt-sel-h">{selHijri}{sameDay(selRow.day, now) && <span className="tt-badge">{x.ttToday}</span>}</div>
          </div>
          <button className="tt-share" onClick={share}><Icon size={16} d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />{x.ttShare}</button>
        </div>
        <div className="tt-chips">
          {COLS.map((k) => <div key={k} className="tt-chip"><span>{x[labKey[k]]}</span><b>{clock(selRow.p[k])}</b></div>)}
        </div>
        {msg && <div className="tt-msg">{msg}</div>}
      </div>

      <label className="tt-method">
        <span>{x.ttMethod}</span>
        <select value={method || getMethodId()} onChange={(e) => setMethod(e.target.value)}>
          {Object.entries(METHODS).map(([id, m]) => <option key={id} value={id}>{ar ? m.ar : m.en}</option>)}
        </select>
      </label>
    </div>
  )
}
