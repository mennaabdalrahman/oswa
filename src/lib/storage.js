// Tiny, failure-proof wrappers around localStorage + idle scheduling.
// Every read/write is try/catch'd: private mode, blocked storage and quota errors must never break the UI.

export const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key)
      return v == null ? fallback : JSON.parse(v)
    } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode / quota */ }
  },
}

/** run `fn` when the main thread is idle (falls back to a short timeout). Returns a cancel function. */
export function idle(fn, timeout = 1500) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 200)
  return () => clearTimeout(id)
}

/** true when the user asked to save data / is on a very slow link — skip speculative prefetching */
export function saveDataMode() {
  const c = typeof navigator !== 'undefined' && navigator.connection
  return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')))
}
