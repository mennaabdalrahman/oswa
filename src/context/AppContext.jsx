import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { t as tr } from '../lib/i18n'
import { store, idle } from '../lib/storage'
import { navigate } from '../lib/transition'
import { preloadRoute } from '../lib/routes'
import { quietRefresh, MOVED_KM } from '../lib/location'
import { startAlarmEngine } from '../lib/alarmEngine'
import { getRing } from '../lib/alarms'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const PREFS_KEY = 'mc_prefs_v1'

function readPrefs() {
  const p = store.get(PREFS_KEY, null) || {}
  const num = (v) => typeof v === 'number' && isFinite(v)
  return {
    lang: typeof p.lang === 'string' ? p.lang : 'en',
    persona: ['child', 'new', 'adult'].includes(p.persona) ? p.persona : 'new',
    name: typeof p.name === 'string' ? p.name : '',
    theme: p.theme === 'night' ? 'night' : 'day',
    loc: p.loc && num(p.loc.lat) && num(p.loc.lng) ? { lat: p.loc.lat, lng: p.loc.lng } : null,
    locAt: num(p.locAt) ? p.locAt : 0,
  }
}

// pure transitions for the navigation stack (state: { screen, payload, history })
const pushTo = (n, s, p) => ({
  screen: s, payload: p,
  history: n.screen && n.screen !== s ? [...n.history, n.screen] : n.history,
})
const popBack = (n) => (n.history.length
  ? { ...n, screen: n.history[n.history.length - 1], history: n.history.slice(0, -1) }
  : { ...n, screen: 'home' })

export function AppProvider({ children }) {
  const [boot] = useState(readPrefs)           // read localStorage once, synchronously → first render already has the user's state
  const [nav, setNav] = useState({ screen: 'landing', payload: null, history: [] })
  const [lang, setLang] = useState(boot.lang)
  const [persona, setPersona] = useState(boot.persona)
  const [name, setName] = useState(boot.name)
  const [theme, setTheme] = useState(boot.theme)
  const [loc, setLocState] = useState(boot.loc)

  const navRef = useRef(nav); navRef.current = nav
  const langRef = useRef(lang); langRef.current = lang
  const locRef = useRef(loc); locRef.current = loc
  const locAt = useRef(boot.locAt)

  /* ---------- navigation: preload the next screen's code, then cross-fade to it ---------- */
  const go = useCallback((s, p = null) => {
    navigate(() => setNav((n) => pushTo(n, s, p)), preloadRoute(s))
  }, [])
  // return to wherever the user came from (website or app home)
  const back = useCallback(() => {
    const h = navRef.current.history
    navigate(() => setNav(popBack), preloadRoute(h.length ? h[h.length - 1] : 'home'))
  }, [])

  const setLoc = useCallback((l) => { locAt.current = l ? Date.now() : 0; setLocState(l) }, [])

  /* ---------- persistence: one small JSON blob, written off the hot path ---------- */
  useEffect(() => {
    const id = setTimeout(() => store.set(PREFS_KEY, { lang, persona, name, theme, loc, locAt: locAt.current }), 120)
    return () => clearTimeout(id)
  }, [lang, persona, name, theme, loc])

  /* ---------- location: cached fix is used instantly; refreshed silently, never prompting ---------- */
  useEffect(() => idle(() => quietRefresh({
    loc: locRef.current, at: locAt.current,
    onFix: (fix, km) => { if (km > MOVED_KM) setLoc(fix); else locAt.current = Date.now() },
  }), 3000), [setLoc])

  /* ---------- prayer alarms: the engine rings them; a tapped notification opens the ring screen ---------- */
  useEffect(() => startAlarmEngine({
    getLoc: () => locRef.current,
    getLang: () => langRef.current,
    openRing: (key, kind) => go('alarm-ring', { key, kind }),
  }), [go])
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || e.data.type !== 'prayer-open') return
      const r = getRing()
      go(r ? 'alarm-ring' : 'alarm', r ? { key: r.key, kind: r.kind } : null)
    }
    navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', onMsg)
    return () => navigator.serviceWorker && navigator.serviceWorker.removeEventListener('message', onMsg)
  }, [go])

  const t = tr(lang)
  const dir = t.dir

  // memoised so screens only re-render when something they read actually changed
  const value = useMemo(() => ({
    screen: nav.screen, payload: nav.payload, go, back,
    lang, setLang, persona, setPersona, name, setName, loc, setLoc, theme, setTheme, t, dir,
  }), [nav.screen, nav.payload, go, back, lang, persona, name, loc, setLoc, theme, t, dir])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
