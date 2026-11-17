import { Component, Suspense, lazy, useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import { StatusBar } from './components/Chrome'
import Landing from './screens/Landing'
import { getRoute, prefetchRoutes } from './lib/routes'
import { idle, saveDataMode } from './lib/storage'
import { preloadAnims } from './components/Lottie'

// the reminder sheet lives in the Events chunk — mount it once the app has settled instead of in the first bundle
const EventReminder = lazy(() => import('./screens/Events').then((m) => ({ default: m.EventReminder })))

// If a screen's code can't be fetched (offline), show a retry instead of a blank page.
class RouteBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button className="btn" onClick={() => this.setState({ failed: false })}>↻</button>
      </div>
    )
  }
}

export default function App() {
  const { screen, theme, dir, payload, lang } = useApp()
  const [settled, setSettled] = useState(false)

  // keep dir + lang on the document itself
  useEffect(() => {
    document.documentElement.setAttribute('dir', dir || 'ltr')
    document.documentElement.setAttribute('lang', lang || 'en')
    document.body.setAttribute('dir', dir || 'ltr')
  }, [dir, lang])

  // once the first screen is up, warm the rest of the app in the background (one idle chunk at a time)
  useEffect(() => idle(() => { setSettled(true); prefetchRoutes(); idle(() => { if (!saveDataMode()) preloadAnims() }, 4000) }, 2500), [])

  if (screen === 'landing') {
    return (
      <div className="site-root" data-theme={theme} lang={lang}>
        <Landing />
      </div>
    )
  }

  const route = getRoute(screen)
  const Screen = route.Component

  return (
    <div className="app" data-theme={theme} dir={dir} lang={lang}>
      {screen !== 'splash' && <StatusBar />}
      <RouteBoundary key={screen}>
        <Suspense fallback={null}>
          <Screen {...(route.props ? route.props(payload) : null)} />
        </Suspense>
      </RouteBoundary>
      {settled && <Suspense fallback={null}><EventReminder /></Suspense>}
    </div>
  )
}
