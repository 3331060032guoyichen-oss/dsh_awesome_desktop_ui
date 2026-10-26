import { useEffect, useRef, type RefObject } from 'react'

/** Apply small pointer depth offsets and stop the frame loop after settling.
 * @param host - Scene element owning layer offsets.
 * @param mode - Current studio view.
 */
export function useStudioParallax(host: RefObject<HTMLDivElement | null>, mode: string): void {
  const modeRef = useRef(mode)
  const recenter = useRef<() => void>(() => {})
  modeRef.current = mode
  useEffect(() => {
    const element = host.current
    if (element === null) return
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0, previous = 0
    const paint = (): void => {
      element.style.setProperty('--studio-depth-x', `${x.toFixed(4)}px`)
      element.style.setProperty('--studio-depth-y', `${y.toFixed(4)}px`)
    }
    const tick = (time: number): void => {
      const dt = Math.min(40, Math.max(0, time - previous))
      previous = time
      const response = 1 - Math.exp(-dt / (targetX === 0 && targetY === 0 ? 230 : 160))
      x += (targetX - x) * response
      y += (targetY - y) * response
      if (Math.abs(targetX - x) + Math.abs(targetY - y) < .006) {
        x = targetX; y = targetY; frame = 0
        delete element.dataset.parallaxMoving
      } else frame = window.requestAnimationFrame(tick)
      paint()
    }
    const wake = (): void => {
      if (frame !== 0) return
      previous = performance.now()
      element.dataset.parallaxMoving = ''
      frame = window.requestAnimationFrame(tick)
    }
    const reset = (): void => { targetX = 0; targetY = 0; wake() }
    recenter.current = reset
    const pointer = (event: PointerEvent): void => {
      if (!media.matches || modeRef.current !== 'scene' || event.pointerType !== 'mouse') return
      const bounds = element.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return
      const clamp = (value: number): number => Math.min(1, Math.max(-1, value))
      targetX = -clamp((event.clientX - bounds.left) / bounds.width * 2 - 1) * 6
      targetY = -clamp((event.clientY - bounds.top) / bounds.height * 2 - 1) * 4
      wake()
    }
    const mediaChanged = (): void => {
      if (media.matches) { reset(); return }
      window.cancelAnimationFrame(frame)
      frame = 0; x = 0; y = 0; targetX = 0; targetY = 0
      delete element.dataset.parallaxMoving
      paint()
    }
    element.addEventListener('pointermove', pointer)
    element.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    window.addEventListener('resize', reset)
    document.addEventListener('visibilitychange', reset)
    media.addEventListener?.('change', mediaChanged)
    return () => {
      window.cancelAnimationFrame(frame)
      element.removeEventListener('pointermove', pointer)
      element.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
      window.removeEventListener('resize', reset)
      document.removeEventListener('visibilitychange', reset)
      media.removeEventListener?.('change', mediaChanged)
      element.style.removeProperty('--studio-depth-x')
      element.style.removeProperty('--studio-depth-y')
      delete element.dataset.parallaxMoving
      recenter.current = () => {}
    }
  }, [host])
  useEffect(() => { if (mode !== 'scene') recenter.current() }, [mode])
}
