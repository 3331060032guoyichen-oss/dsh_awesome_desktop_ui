/** Browser-local desktop lighting preference shared by its scene and Settings row. */
const KEY = 'dsh.desktopStudio.hour'
const EVENT = 'dsh-studio-time'
let fallback: number | null = null

/** Read the browser-local lighting preference.
 * @returns Manual hour, or null to follow the local clock.
 */
export function readStudioTime(): number | null {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === null) return null
    const value = Number(stored)
    return Number.isFinite(value) && value >= 0 && value < 24 ? value : null
  } catch { return fallback }
}

/** Persist the preference and refresh mounted scene and Settings views.
 * @param value - Manual hour, or null to follow the local clock.
 */
export function setStudioTime(value: number | null): void {
  fallback = value
  try {
    if (value === null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(value))
  } catch { /* Storage-denied windows retain the preference for this document only. */ }
  window.dispatchEvent(new Event(EVENT))
}

/** Observe same-document edits and preference changes from another window.
 * @param listener - Preference change callback.
 * @returns Listener disposer.
 */
export function subscribeStudioTime(listener: () => void): () => void {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
