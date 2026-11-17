// Favorite surahs — shared between the Mushaf and the recitation screen.
// Persisted on the device (same convention as the existing mc_* localStorage keys).
import { useCallback, useEffect, useState } from 'react'

const KEY = 'mc_fav_surahs'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

// tiny cross-component sync so both screens react to the same favorites
const listeners = new Set()
function emit(list) { listeners.forEach((fn) => fn(list)) }

export function useFavorites() {
  const [favs, setFavs] = useState(read)

  useEffect(() => {
    const fn = (list) => setFavs(list)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const toggle = useCallback((id) => {
    setFavs((cur) => {
      const has = cur.includes(id)
      const next = has ? cur.filter((x) => x !== id) : [...cur, id]
      localStorage.setItem(KEY, JSON.stringify(next))
      emit(next)
      return next
    })
  }, [])

  const isFav = useCallback((id) => favs.includes(id), [favs])
  return { favs, toggle, isFav }
}

export function Star({ on, onClick, title }) {
  return (
    <button
      onClick={onClick}
      aria-label={title || 'favorite'}
      aria-pressed={on}
      style={{
        width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'none', cursor: 'pointer', color: on ? 'var(--gold)' : 'var(--muted)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    </button>
  )
}
