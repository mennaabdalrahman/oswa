import { lazy, Suspense, useEffect, useState } from 'react'

// The Lottie runtime and the animation JSON (~1.7 MB) used to sit in the main bundle and block first paint.
// They now load as separate chunks; the boxes that hold them already have fixed sizes, so nothing shifts.
const LottieReact = lazy(() => import('lottie-react'))

const LOADERS = {
  rashed: () => import('../assets/rashed.json'),
  mosque: () => import('../assets/mosque.json'),
  wakeup: () => import('../assets/wakeup.json'),
  salam: () => import('../assets/salam.json'),
}
const pending = {}
const ready = {}
function load(name) {
  if (!LOADERS[name]) return Promise.resolve(null)
  return (pending[name] ||= LOADERS[name]().then((m) => (ready[name] = m.default)))
}

// the landing page shows these two straight away — start fetching them as soon as this module is evaluated
load('mosque'); load('salam')

export const preloadAnims = () => Promise.all(Object.keys(LOADERS).map(load)).catch(() => {})

export function Anim({ name, style, className }) {
  const [data, setData] = useState(ready[name] || null)
  useEffect(() => {
    if (data) return
    let alive = true
    load(name).then((d) => { if (alive && d) setData(d) }).catch(() => {})
    return () => { alive = false }
  }, [name, data])
  if (!data) return null
  return (
    <Suspense fallback={null}>
      <LottieReact animationData={data} loop autoplay style={{ width: '100%', height: '100%', ...style }} className={className} />
    </Suspense>
  )
}

export function RashedAvatar({ style, className }) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Anim name="rashed" />
    </div>
  )
}
