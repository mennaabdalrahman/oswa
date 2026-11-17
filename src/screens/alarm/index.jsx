// Prayer alarms: list → settings (sound / challenge / sleep reminder / "are you awake") → ring screen.
// One lazy chunk; the engine that actually rings lives in lib/alarmEngine.js.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { Anim } from '../../components/Lottie'
import { A } from '../../lib/alarmStrings'
import {
  KEYS, ICON, CHALLENGES, prayerName, useAlarms, getAlarms, setAlarm, nextRing, ringTime, nextSleep, sleepTime,
  fmtClock, fmtMinutesOfDay, fmtIn, useRing,
} from '../../lib/alarms'
import { finishRing, snoozeRing } from '../../lib/alarmEngine'
import { notifyStatus, askNotifyPermission, notifySupported } from '../../lib/notify'
import { getPosition } from '../../lib/location'
import { Challenge, QrScanner, qrSupported } from './Challenge'
import { VERSES, pickRand } from './alarmContent'
import './alarm.css'

const sounds = () => import('../../lib/sounds')
const Back = ({ onClick }) => (
  <button className="back-ic" onClick={onClick} aria-label="back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  </button>
)
const Chev = () => <svg className="al-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
const Switch = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={'al-sw' + (on ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onChange(!on) }}><i /></button>
)
const Top = ({ h1, h2, tag, onBack }) => (
  <div className="feat-top"><Back onClick={onBack} /><div><div className="h1">{h1}</div><div className="h2">{h2}</div></div><span className="ar-tag">{tag}</span></div>
)
const nf = (lang) => (n) => (lang === 'ar' ? Number(n).toLocaleString('ar-EG', { useGrouping: false }) : String(n))

/** one-line description of when an alarm rings */
function relText(x, key, cfg, lang) {
  if (cfg.mode === 'fixed') return fmtMinutesOfDay(cfg.at, lang)
  const p = prayerName(key === 'fajr' && cfg.anchor === 'sunrise' ? 'fajr' : key, lang)
  const nm = key === 'fajr' && cfg.anchor === 'sunrise' ? x.anchorSunrise : p
  if (!cfg.mins) return `${x.atTime}: ${nm}`
  return cfg.dir === 'before' ? x.relBefore(cfg.mins, nm) : x.relAfter(cfg.mins, nm)
}

/* =============================== list =============================== */
export function AlarmList() {
  const { lang, loc, setLoc, back, go } = useApp()
  const x = A(lang), st = useAlarms()
  const [msg, setMsg] = useState('')
  const [perm, setPerm] = useState(notifyStatus())
  const [, tick] = useState(0)
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(id) }, [])
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500) }

  async function askLoc() {
    try { setLoc(await getPosition({ timeout: 10000 })) } catch { flash(x.locDenied) }
  }
  async function toggle(key, on) {
    const cfg = st.items[key]
    if (on && cfg.mode === 'prayer' && !loc) { flash(x.needLocSave); return }
    if (on) {
      sounds().then((m) => m.unlockAudio()).catch(() => {})
      if (notifyStatus() === 'default') setPerm(await askNotifyPermission())
    }
    setAlarm(key, { on })
  }
  async function askNotif() { setPerm(await askNotifyPermission()) }
  const install = window.__mcInstall
  async function doInstall() { try { install.prompt(); await install.userChoice } catch { /* ignore */ } window.__mcInstall = null; tick((n) => n + 1) }
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Top h1={x.listH1} h2={x.listH2} tag={x.listTag} onBack={back} />
      <div className="feat-body al-body">
        {!loc && (
          <div className="al-card al-note">
            <b>{x.needLocTitle}</b><p>{x.needLocLead}</p>
            <button className="btn block" onClick={askLoc}>{x.needLocBtn}</button>
          </div>
        )}
        {KEYS.map((key) => {
          const cfg = st.items[key]
          const nx = cfg.on ? nextRing(key, cfg, loc) : null
          const t = nx || ringTime(key, cfg, loc)
          return (
            <div key={key} className={'al-row' + (cfg.on ? ' on' : '')} role="button" tabIndex={0}
              onClick={() => go('alarm-edit', { key })} onKeyDown={(e) => e.key === 'Enter' && go('alarm-edit', { key })}>
              <span className="al-ic" aria-hidden="true">{ICON[key]}</span>
              <span className="al-main">
                <span className="al-name">{x.editH1(prayerName(key, lang))}</span>
                <span className="al-sub">{relText(x, key, cfg, lang)}</span>
                {cfg.on && nx && <span className="al-next">{x.ringsIn(fmtIn(nx - Date.now(), lang))}</span>}
              </span>
              <span className="al-time">{t ? fmtClock(t, lang) : '—'}</span>
              <Switch on={cfg.on} onChange={(v) => toggle(key, v)} label={prayerName(key, lang)} />
            </div>
          )
        })}
        {key_sleep(st, loc, x, lang)}

        <div className="al-card">
          <p>{x.notifLead}</p>
          {!notifySupported() ? <div className="al-dim">{x.notifUnsupported}</div>
            : perm === 'granted' ? <div className="al-ok">✓ {x.notifOn}</div>
            : perm === 'denied' ? <div className="al-dim">{x.notifBlocked}</div>
            : <button className="btn block" onClick={askNotif}>{x.notifAsk}</button>}
        </div>
        <div className="al-card">
          <p>{x.keepOpen}</p>
          {standalone ? <div className="al-ok">✓ {x.installed}</div> : install
            ? <button className="btn ghost block" onClick={doInstall}>{x.installBtn}</button>
            : <div className="al-dim">{x.installHow}</div>}
        </div>
        {msg && <div className="al-toast" role="status">{msg}</div>}
      </div>
    </div>
  )
}
function key_sleep(st, loc, x, lang) {
  const f = st.items.fajr
  if (!f.sleep.on) return null
  const t = nextSleep(f, loc)
  return <div className="al-card al-sleepline">🛏️ <b>{x.sleepRow}</b> — {t ? x.nextSleep(fmtClock(t, lang)) : '—'}</div>
}

/* =============================== sound picker =============================== */
function SoundPicker({ x, lang, value, onPick, onClose }) {
  const st = useAlarms()
  const [playing, setPlaying] = useState(null), [err, setErr] = useState('')
  const h = useRef(null), file = useRef(null)
  const stop = useCallback(() => { if (h.current) { h.current.stop(); h.current = null } setPlaying(null) }, [])
  useEffect(() => stop, [stop])
  async function play(id) {
    if (playing === id) { stop(); return }
    stop()
    const m = await sounds(); m.unlockAudio()
    h.current = m.playSound(id, { volume: 0.9 }); setPlaying(id)
  }
  async function add(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = ''
    if (!f) return
    try { const m = await sounds(); onPick(await m.addCustomSound(f)); setErr('') } catch { setErr(x.soundTooBig) }
  }
  async function remove(id) { stop(); const m = await sounds(); await m.deleteCustomSound(id) }
  const Item = ({ id, label, custom }) => (
    <div className={'al-snd' + (value === id ? ' sel' : '')}>
      <button className="al-snd-play" onClick={() => play(id)} aria-label={playing === id ? x.playing : x.play}>{playing === id ? '■' : '▶'}</button>
      <button className="al-snd-name" onClick={() => { stop(); onPick(id) }}>{label}</button>
      {custom && <button className="al-snd-del" onClick={() => remove(id)} aria-label={x.removeSound}>✕</button>}
      <span className="al-snd-chk" aria-hidden="true">{value === id ? '✓' : ''}</span>
    </div>
  )
  return (
    <div className="al-sub-view">
      <div className="al-card">
        <div className="al-cap">{x.yourSounds}</div>
        {st.sounds.map((s) => <Item key={s.id} id={s.id} label={s.name} custom />)}
        <button className="al-add" onClick={() => file.current.click()}>＋ {x.addSound}</button>
        <input ref={file} type="file" accept="audio/*" hidden onChange={add} />
        <div className="al-dim">{x.soundsNote}</div>
        {err && <div className="ch-bad">{err}</div>}
      </div>
      <div className="al-card">
        <div className="al-cap">{x.builtin}</div>
        <BuiltinList render={(b) => <Item key={b.id} id={b.id} label={lang === 'ar' ? b.ar : b.en} />} />
      </div>
      <button className="btn block" onClick={() => { stop(); onClose() }}>{x.back}</button>
    </div>
  )
}
const BUILTIN_IDS = [{ id: 'bell', ar: 'جرس', en: 'Bell' }, { id: 'chime', ar: 'نغمة متدرجة', en: 'Rising chime' }, { id: 'soft', ar: 'ضوء', en: 'Soft glow' },
  { id: 'drop', ar: 'قطرة ماء', en: 'Water drop' }, { id: 'beep', ar: 'إشعار بسيط', en: 'Simple beep' }]
const BuiltinList = ({ render }) => <>{BUILTIN_IDS.map(render)}</>
const soundLabel = (id, st, lang) => (BUILTIN_IDS.find((b) => b.id === id) ? (lang === 'ar' ? BUILTIN_IDS.find((b) => b.id === id).ar : BUILTIN_IDS.find((b) => b.id === id).en)
  : (st.sounds.find((s) => s.id === id) || {}).name || '—')

/* =============================== challenge picker =============================== */
const CH_ICON = { none: '🔔', questions: '❓', shake: '📳', math: '➗', memory: '🧠', qr: '▦', type: '⌨️', random: '🔷' }
function ChallengePicker({ x, value, onPick, onPreview }) {
  return (
    <div className="al-sub-view">
      <div className="al-card">
        {CHALLENGES.map((c) => (
          <button key={c} className={'al-ch' + (value === c ? ' sel' : '')} onClick={() => onPick(c)}>
            <span className="al-ch-ic" aria-hidden="true">{CH_ICON[c]}</span>
            <span className="al-ch-t"><b>{x.chName[c]}</b><small>{x.chDesc[c]}</small></span>
            <span className="al-snd-chk" aria-hidden="true">{value === c ? '✓' : ''}</span>
          </button>
        ))}
      </div>
      <button className="btn block" onClick={onPreview}>👁 {x.preview}</button>
    </div>
  )
}

/* QR challenge: save the code to scan later */
function QrSetup({ x, d, set }) {
  const [scan, setScan] = useState(false)
  if (d.challenge !== 'qr') return null
  if (!qrSupported()) return <div className="al-card al-dim">{x.qrUnsupported}</div>
  return (
    <div className="al-card">
      <div>{d.qr ? '✓ ' + x.qrSaved : x.qrNone}</div>
      {scan ? <QrScanner x={x} hint={x.qrSaveTitle} onResult={(v) => { set({ qr: v }); setScan(false) }} />
        : <button className="btn ghost block" onClick={() => setScan(true)}>{x.qrScanSave}</button>}
    </div>
  )
}

/* =============================== sleep reminder & awake =============================== */
function SleepView({ x, lang, d, set, loc, goSound }) {
  const sl = d.sleep, n = nf(lang)
  const patch = (p) => set({ sleep: { ...sl, ...p } })
  const when = sleepTime({ ...d, sleep: sl }, loc, new Date())
  const h12 = (m) => { const h = Math.floor(m / 60); return { h: h % 12 || 12, mi: m % 60, pm: h >= 12 } }
  const f = h12(sl.at)
  const setFixed = (o) => { const v = { ...f, ...o }; patch({ at: ((v.h % 12) + (v.pm ? 12 : 0)) * 60 + v.mi }) }
  return (
    <div className="al-sub-view">
      <p className="al-lead"><b>{x.sleepH2}</b><br />{x.sleepLead}</p>
      <div className="al-card al-line">
        <span>🛏️</span><span className="al-chip">{sl.mode === 'fixed' ? fmtMinutesOfDay(sl.at, lang) : (when ? fmtClock(when, lang) : '—')}</span>
        <Switch on={sl.on} onChange={(on) => patch({ on })} label={x.sleepRow} />
      </div>
      <div className="al-dim">{x.sleepAdjust}</div>
      <div className="al-tabs">
        <button className={sl.mode === 'fixed' ? 'on' : ''} onClick={() => patch({ mode: 'fixed' })}>{x.tabFixed}</button>
        <button className={sl.mode === 'prayer' ? 'on' : ''} onClick={() => patch({ mode: 'prayer' })}>{x.tabPrayer}</button>
      </div>
      <div className="al-card al-pick">
        {sl.mode === 'prayer' ? (<>
          <label>{x.hrsBefore}<select value={sl.hrs} onChange={(e) => patch({ hrs: +e.target.value })}>{Array.from({ length: 13 }, (_, i) => <option key={i} value={i}>{n(i)}</option>)}</select></label>
          <label>{x.minBefore}<select value={sl.min} onChange={(e) => patch({ min: +e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i * 5}>{n(i * 5)}</option>)}</select></label>
        </>) : (<>
          <label>{x.hour}<select value={f.h} onChange={(e) => setFixed({ h: +e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{n(i + 1)}</option>)}</select></label>
          <label>{x.minute}<select value={f.mi} onChange={(e) => setFixed({ mi: +e.target.value })}>{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{n(String(i).padStart(2, '0'))}</option>)}</select></label>
          <label>&nbsp;<select value={f.pm ? 1 : 0} onChange={(e) => setFixed({ pm: e.target.value === '1' })}>{x.ampm.map((a, i) => <option key={i} value={i}>{a}</option>)}</select></label>
        </>)}
      </div>
      <button className="al-link" onClick={goSound}><span>🔊 {x.sound}</span><span className="al-val">{soundLabel(sl.sound, getAlarms(), lang)}</span><Chev /></button>
    </div>
  )
}
function AwakeView({ x, lang, d, set }) {
  const aw = d.awake, n = nf(lang)
  const patch = (p) => set({ awake: { ...aw, ...p } })
  return (
    <div className="al-sub-view">
      <p className="al-lead"><b>{x.awakeH2}</b><br />{x.awakeLead}</p>
      <div className="al-card al-line"><span>✔</span><span className="al-grow">{x.awakeRow}</span><Switch on={aw.on} onChange={(on) => patch({ on })} label={x.awakeRow} /></div>
      <div className="al-dim">{x.awakeAfter}</div>
      <div className={'al-card al-step' + (aw.on ? '' : ' dis')}>
        <span className="al-grow">{x.awakeMin(aw.mins)}</span>
        <button disabled={!aw.on || aw.mins <= 1} onClick={() => patch({ mins: aw.mins - 1 })} aria-label="−">−</button>
        <button disabled={!aw.on || aw.mins >= 15} onClick={() => patch({ mins: aw.mins + 1 })} aria-label="+">+</button>
      </div>
      <div className="al-dim">{n(aw.mins)}</div>
    </div>
  )
}

/* =============================== settings =============================== */
export function AlarmEdit({ alarmKey }) {
  const { lang, loc, back, go, setLoc } = useApp()
  const x = A(lang), st = useAlarms()
  const key = KEYS.includes(alarmKey) ? alarmKey : 'fajr'
  const [d, setD] = useState(() => getAlarms().items[key])
  const [view, setView] = useState('main')           // main | sound | challenge | sleep | sleepSound | awake
  const [msg, setMsg] = useState('')
  const set = (p) => setD((o) => ({ ...o, ...p }))
  const n = nf(lang), name = prayerName(key, lang)
  const draft = { ...d }

  const at = (() => { const h = Math.floor(d.at / 60); return { h: h % 12 || 12, mi: d.at % 60, pm: h >= 12 } })()
  const setFixed = (o) => { const v = { ...at, ...o }; set({ at: ((v.h % 12) + (v.pm ? 12 : 0)) * 60 + v.mi }) }
  const nx = nextRing(key, draft, loc)
  const shown = d.mode === 'fixed' ? fmtMinutesOfDay(d.at, lang) : (nx ? fmtClock(nx, lang) : '—')

  async function save() {
    if (d.mode === 'prayer' && !loc) {
      try { setLoc(await getPosition({ timeout: 10000 })) } catch { setMsg(x.needLocSave); setTimeout(() => setMsg(''), 3500); return }
    }
    sounds().then((m) => m.unlockAudio()).catch(() => {})
    if (notifyStatus() === 'default') askNotifyPermission()
    setAlarm(key, { ...d, on: true })
    setMsg(x.saved)
    setTimeout(back, 350)
  }
  function preview() {
    setAlarm(key, { ...d })      // the preview reads the saved settings, so keep the draft (it does not switch the alarm on)
    go('alarm-ring', { key, kind: 'alarm', preview: true })
  }
  const onBack = () => (view === 'main' ? back() : view === 'sleepSound' ? setView('sleep') : setView('main'))

  const titles = {
    main: [x.editH1(name), x.editH2], sound: [x.soundH, name], challenge: [x.challenge, name],
    sleep: [x.sleepH1, x.sleepH2], sleepSound: [x.soundH, x.sleepH1], awake: [x.awakeH1, x.awakeH2],
  }[view]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Top h1={titles[0]} h2={titles[1]} tag={x.editTag} onBack={onBack} />
      <div className="feat-body al-body">
        {view === 'sound' && <SoundPicker x={x} lang={lang} value={d.sound} onPick={(id) => set({ sound: id })} onClose={() => setView('main')} />}
        {view === 'sleepSound' && <SoundPicker x={x} lang={lang} value={d.sleep.sound} onPick={(id) => set({ sleep: { ...d.sleep, sound: id } })} onClose={() => setView('sleep')} />}
        {view === 'challenge' && (<>
          <ChallengePicker x={x} value={d.challenge} onPick={(c) => set({ challenge: c })} onPreview={preview} />
          <QrSetup x={x} d={d} set={set} />
        </>)}
        {view === 'sleep' && <SleepView x={x} lang={lang} d={d} set={set} loc={loc} goSound={() => setView('sleepSound')} />}
        {view === 'awake' && <AwakeView x={x} lang={lang} d={d} set={set} />}

        {view === 'main' && (<>
          <div className="al-tabs">
            <button className={d.mode === 'fixed' ? 'on' : ''} onClick={() => set({ mode: 'fixed' })}>{x.tabFixed}</button>
            <button className={d.mode === 'prayer' ? 'on' : ''} onClick={() => set({ mode: 'prayer' })}>{x.tabPrayer}</button>
          </div>
          <div className="al-card al-pick">
            {d.mode === 'fixed' ? (<>
              <label>{x.hour}<select value={at.h} onChange={(e) => setFixed({ h: +e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{n(i + 1)}</option>)}</select></label>
              <label>{x.minute}<select value={at.mi} onChange={(e) => setFixed({ mi: +e.target.value })}>{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{n(String(i).padStart(2, '0'))}</option>)}</select></label>
              <label>&nbsp;<select value={at.pm ? 1 : 0} onChange={(e) => setFixed({ pm: e.target.value === '1' })}>{x.ampm.map((a, i) => <option key={i} value={i}>{a}</option>)}</select></label>
            </>) : (<>
              {key === 'fajr' && (
                <div className="al-tabs al-inner" style={{ gridColumn: '1 / -1' }}>
                  <button className={d.anchor !== 'sunrise' ? 'on' : ''} onClick={() => set({ anchor: 'fajr' })}>{x.anchorFajr}</button>
                  <button className={d.anchor === 'sunrise' ? 'on' : ''} onClick={() => set({ anchor: 'sunrise' })}>{x.anchorSunrise}</button>
                </div>)}
              <label>{x.minsLab}<select value={d.mins} onChange={(e) => set({ mins: +e.target.value })}>{Array.from({ length: 121 }, (_, i) => <option key={i} value={i}>{n(i)}</option>)}</select></label>
              <label>&nbsp;<select value={d.dir} onChange={(e) => set({ dir: e.target.value })}><option value="before">{x.before}</option><option value="after">{x.after}</option></select></label>
              <div className="al-bigtime">{shown}</div>
            </>)}
            {nx && <div className="al-ringsin">⏳ {x.ringsIn(fmtIn(nx - Date.now(), lang))}</div>}
          </div>

          <div className="al-card al-list">
            <button className="al-link" onClick={() => setView('sound')}><span>🔊 {x.sound}</span><span className="al-val">{soundLabel(d.sound, st, lang)}</span><Chev /></button>
            <div className="al-opt"><span>📱</span><div className="al-grow"><b>{x.volume}</b><small>{x.volumeNote}</small></div><Switch on={d.sysVol} onChange={(v) => set({ sysVol: v })} label={x.volume} /></div>
            {!d.sysVol && <div className="al-opt"><span>🎚️</span><div className="al-grow"><b>{x.volumeCustom}</b><input type="range" min="0.1" max="1" step="0.05" value={d.vol} onChange={(e) => set({ vol: +e.target.value })} /></div></div>}
            <div className="al-opt"><span>✨</span><div className="al-grow"><b>{x.gentle}</b><small>{x.gentleNote}</small></div><Switch on={d.gentle} onChange={(v) => set({ gentle: v })} label={x.gentle} /></div>
            <button className="al-link" onClick={() => setView('challenge')}><span>🏋️ {x.challenge}</span><span className="al-val">{x.chName[d.challenge]}</span><Chev /></button>
            <label className="al-link al-sel"><span>💤 {x.snooze}</span>
              <select value={d.snooze} onChange={(e) => set({ snooze: +e.target.value })}>
                <option value={0}>{x.snoozeOff}</option>{[1, 5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{x.snoozeN(m)}</option>)}
              </select></label>
            {key === 'fajr' && <button className="al-link" onClick={() => setView('sleep')}><span>🛏️ {x.sleepRow}</span><span className="al-val">{d.sleep.on ? x.on : x.snoozeOff}</span><Chev /></button>}
            <button className="al-link" onClick={() => setView('awake')}><span>✔ {x.awakeRow}</span><span className="al-val">{d.awake.on ? x.awakeMin(d.awake.mins) : x.snoozeOff}</span><Chev /></button>
          </div>
          {msg && <div className="al-toast" role="status">{msg}</div>}
          <div className="al-savebar"><button className="btn block" onClick={save}>{x.save}</button></div>
        </>)}
        {view !== 'main' && view !== 'sound' && view !== 'sleepSound' && view !== 'challenge' && (
          <div className="al-savebar"><button className="btn block" onClick={() => setView('main')}>{x.back}</button></div>
        )}
      </div>
    </div>
  )
}

/* =============================== ringing =============================== */
export function Ring({ ring: p }) {
  const { lang, back, go } = useApp()
  const x = A(lang), live = useRing()
  const r = p || live
  const preview = !!(p && p.preview)
  const [now, setNow] = useState(new Date())
  const [done, setDone] = useState(false)
  const [prog, setProg] = useState(0)
  const verse = useRef(pickRand(VERSES)).current
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  const progress = useCallback((v) => setProg(v), [])

  const key = r && r.key
  const cfg = key ? getAlarms().items[key] : null
  const kind = (r && r.kind) || 'alarm'

  // an alarm was answered elsewhere (or the page was reloaded) — nothing to show
  useEffect(() => { if (!preview && !live && !done) { const id = setTimeout(() => go('alarm'), 50); return () => clearTimeout(id) } }, [preview, live, done, go])
  if (!cfg) return null

  const leave = () => { if (preview) back(); else { finishRing(); back() } }
  const finish = () => { setDone(true); leave() }
  const needChallenge = kind === 'alarm' && cfg.challenge !== 'none'
  const L = lang === 'ar'

  return (
    <div className="al-ring" dir={L ? 'rtl' : 'ltr'}>
      {preview && <div className="al-prev"><span>{x.chPreviewBar}</span><button onClick={back}>{x.stopPreview}</button></div>}
      <div className="al-ring-top"><div className="al-ring-t1">{kind === 'alarm' ? x.editH1(prayerName(key, lang)) : kind === 'awake' ? x.awakeTitle : x.sleepTitle}</div></div>
      <div className="al-clock">{fmtClock(now, lang)}</div>
      <div className="al-ring-t2 ar">{kind === 'alarm' ? x.ringTitle(prayerName(key, lang)) : kind === 'awake' ? x.awakeLine : x.sleepLine}</div>
      {kind === 'alarm' && !needChallenge && <div className="al-anim"><Anim name="wakeup" /></div>}
      {kind === 'alarm' && <div className="al-ringing"><span />{lang === 'ar' ? 'المنبّه يرنّ…' : 'Ringing…'}</div>}
      {needChallenge && (<>
        <div className="al-bar"><i style={{ width: `${Math.round(prog * 100)}%` }} /></div>
        <Challenge kind={cfg.challenge} x={x} lang={lang} qr={cfg.qr} onDone={finish} progress={progress} />
      </>)}
      {kind === 'alarm' && !needChallenge && <>
        <button className="btn block al-stop" onClick={finish}>{L ? 'أنا مستيقظ — أوقف' : 'I’m awake — stop'}</button>
        {cfg.snooze > 0 && !preview && <button className="btn ghost block" onClick={() => { setDone(true); snoozeRing(); back() }}>{x.snoozeBtn(cfg.snooze)}</button>}
      </>}
      {kind === 'awake' && <button className="btn block al-stop" onClick={finish}>{x.awakeBtn}</button>}
      {kind === 'sleep' && <button className="btn block al-stop" onClick={finish}>{x.sleepOk}</button>}
      {kind === 'alarm' && <p className="al-verse"><span className="ar">{verse.ar}</span><small>{verse.ref}</small></p>}
    </div>
  )
}
