// Location helpers. The coordinates themselves live in the persisted prefs (see AppContext);
// this file is the "when do we need to ask the browser again" logic.

export const LOC_STALE_MS = 6 * 60 * 60 * 1000 // refresh a cached fix at most every 6 h
const MOVED_KM = 0.5                            // ignore GPS jitter smaller than this (avoids re-render + recompute)

export function getPosition({ maximumAge = 10 * 60 * 1000, timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('unsupported')); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout, maximumAge }
    )
  })
}

export async function permissionState() {
  try {
    if (!navigator.permissions) return 'unknown'
    return (await navigator.permissions.query({ name: 'geolocation' })).state // granted | prompt | denied
  } catch { return 'unknown' }
}

export function movedKm(a, b) {
  const R = 6371, rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Background refresh. It NEVER shows a permission prompt: it only runs when the browser has already
 * granted access (or, on browsers without the Permissions API, when we already hold a fix).
 * onFix(fix, movedKm) is called with the new position.
 */
export async function quietRefresh({ loc, at, onFix }) {
  if (!navigator.geolocation) return
  const state = await permissionState()
  if (state === 'denied' || state === 'prompt') return
  if (state === 'unknown' && !loc) return
  if (loc && Date.now() - (at || 0) < LOC_STALE_MS) return
  try {
    const fix = await getPosition({ maximumAge: 30 * 60 * 1000 })
    onFix(fix, loc ? movedKm(loc, fix) : Infinity)
  } catch { /* offline / timed out — keep the cached fix */ }
}

export { MOVED_KM }
