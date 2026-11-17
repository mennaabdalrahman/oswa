// Route registry: every screen except the landing page is a lazily-loaded chunk.
//
//  • `preloadRoute(id)` downloads a screen's code. `go()` awaits it BEFORE swapping screens, so the new
//    screen renders synchronously — no Suspense fallback, no blank frame, which is what lets the
//    View-Transition cross-fade stay clean.
//  • `prefetchRoutes()` warms the rest of the app on idle, one chunk at a time, so by the time a user taps
//    anything the code is already in the cache (skipped when Data Saver is on).
//  • A route's `props(payload)` maps navigation payloads to the prop names the screens already expect.
import { idle, saveDataMode } from './storage'

const defs = {}

function route(id, importer, named, props) {
  const d = { id, props, mod: null, error: null, promise: null }
  d.load = () => {
    if (!d.promise) {
      d.promise = importer().then(
        (m) => { d.mod = named ? m[named] : m.default; return d.mod },
        (e) => { d.promise = null; d.error = e; throw e },   // allow a retry on the next navigation
      )
    }
    return d.promise
  }
  // Suspends only if rendered before it was preloaded (never via go()); otherwise renders synchronously.
  d.Component = function RouteScreen(p) {
    if (d.error) { const e = d.error; d.error = null; throw e }
    if (!d.mod) throw d.load()
    const C = d.mod
    return <C {...p} />
  }
  defs[id] = d
  return d
}

const payloadAs = (name) => (payload) => ({ [name]: payload })

route('splash', () => import('../screens/Splash'))
route('language', () => import('../screens/Onboarding'), 'Language')
route('name', () => import('../screens/Onboarding'), 'Name')
route('profile', () => import('../screens/Onboarding'), 'Profile')
route('location', () => import('../screens/Onboarding'), 'Location')
route('home', () => import('../screens/Home'))
route('rashed', () => import('../screens/Rashed'), null, payloadAs('initialQuery'))
route('scanner', () => import('../screens/Features'), 'Scanner')
route('map', () => import('../screens/Features'), 'MapScreen')
route('salah', () => import('../screens/Features'), 'Salah')
route('mushaf', () => import('../screens/Quran'), 'Mushaf')
route('tasbih', () => import('../screens/Quran'), 'Tasbih')
route('tasmee', () => import('../screens/Tasmee'))
route('adhkar', () => import('../screens/Adhkar'))
route('sunan', () => import('../screens/Sunan'))
route('lesson', () => import('../screens/Lessons'), null, payloadAs('initialLesson'))
route('events', () => import('../screens/Events'))
route('journey', () => import('../screens/Journey'))
route('more', () => import('../screens/Settings'))
// Prayer alarms — one lazy chunk (list, settings, ring screen). Replaces the old single-screen demo alarm.
route('alarm', () => import('../screens/alarm'), 'AlarmList')
route('alarm-edit', () => import('../screens/alarm'), 'AlarmEdit', (p) => ({ alarmKey: p && p.key }))
route('alarm-ring', () => import('../screens/alarm'), 'Ring', (p) => ({ ring: p }))

export const getRoute = (id) => defs[id] || defs.home

/** Promise while the chunk is downloading, null if it is already available. */
export function preloadRoute(id) {
  const d = defs[id]
  if (!d || d.mod) return null
  return d.load()
}

// order matters: what the next tap is most likely to need goes first
const PREFETCH_ORDER = [
  'language', 'name', 'profile', 'location', 'home',
  'rashed', 'more', 'journey', 'alarm', 'map', 'mushaf', 'adhkar', 'lesson',
  'events', 'scanner', 'tasbih', 'sunan', 'tasmee', 'salah',
]
let prefetching = false
export function prefetchRoutes() {
  if (prefetching || saveDataMode()) return
  prefetching = true
  const queue = PREFETCH_ORDER.slice()
  const next = () => {
    const id = queue.shift()
    if (!id) return
    const p = preloadRoute(id)
    if (p) p.catch(() => {}).finally(() => idle(next))
    else idle(next)
  }
  idle(next)
}

