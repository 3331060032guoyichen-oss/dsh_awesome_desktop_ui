import { useEffect, type RefObject } from 'react'

/** Keep resting gestures still for hidden scenes and reduced motion.
 * @param host - Scene element owning idle state.
 * @param mode - Current studio view.
 */
export function useStudioIdle(host: RefObject<HTMLDivElement | null>, mode: string): void {
  useEffect(() => {
    const element = host.current
    if (element === null || mode !== 'scene') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timers = new Set<number>()
    const clear = (): void => {
      timers.forEach(timer => window.clearTimeout(timer))
      timers.clear()
      delete element.dataset.idleActive
      delete element.dataset.idleHair
      delete element.dataset.idleLeaves
    }
    const later = (callback: () => void, delay: number): void => {
      const timer = window.setTimeout(() => { timers.delete(timer); callback() }, delay)
      timers.add(timer)
    }
    const schedule = (gesture: 'idleHair' | 'idleLeaves', duration: number): void => {
      // A fresh 1–10 second rest after every gesture, independently per layer.
      later(() => {
        element.dataset[gesture] = Math.random() < .5 ? 'left' : 'right'
        later(() => {
          if (gesture === 'idleHair') delete element.dataset.idleHair
          else delete element.dataset.idleLeaves
          schedule(gesture, duration)
        }, duration)
      }, 1000 + Math.random() * 9000)
    }
    const resume = (): void => {
      clear()
      if (reduced.matches || document.hidden) return
      element.dataset.idleActive = ''
      schedule('idleHair', 2800)
      schedule('idleLeaves', 3600)
    }
    resume()
    document.addEventListener('visibilitychange', resume)
    reduced.addEventListener?.('change', resume)
    return () => {
      clear()
      document.removeEventListener('visibilitychange', resume)
      reduced.removeEventListener?.('change', resume)
    }
  }, [host, mode])
}
