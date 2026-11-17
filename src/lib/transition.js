// Screen changes go through the View Transitions API when the browser has it: the browser snapshots the
// old screen, we swap React state synchronously, and it cross-fades to the new one on the compositor
// (no layout, no extra DOM). Browsers without it simply switch instantly, exactly as before.
// (A pure-CSS fade covers those browsers — see the @supports block at the end of index.css.)
import { flushSync } from 'react-dom'

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * @param {() => void} update   the state change that swaps the screen
 * @param {Promise|null} ready  resolves when the next screen's code is loaded (null = already loaded)
 */
export function navigate(update, ready) {
  const run = () => {
    if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) { update(); return }
    document.startViewTransition(() => { flushSync(update) })
  }
  // If the chunk fails to download (offline) we stay on the current screen rather than crash.
  if (ready) ready.then(run, () => {})
  else run()
}
