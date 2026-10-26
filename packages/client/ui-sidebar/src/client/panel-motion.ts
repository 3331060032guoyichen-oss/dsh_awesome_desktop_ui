/** Apply inertial rotation without rerendering the navigation row.
 * @param row - Pointer interaction target.
 * @param glyph - Rotating icon element.
 * @param topSpeed - Hover rotation speed in degrees per second.
 * @returns Animation and listener disposer.
 */
export function installPanelMotion(row: HTMLElement, glyph: HTMLElement, topSpeed: number): () => void {
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const hover = matchMedia('(hover: hover)')
  let pointing = false
  let angle = 0
  let speed = 0
  let previous: number | undefined
  let frame: number | undefined

  const paint = (time: number): void => {
    frame = undefined
    const dt = previous === undefined ? 0 : Math.min((time - previous) / 1000, .064)
    previous = time
    const target = pointing ? topSpeed : 0
    const next = target + (speed - target) * Math.exp(-dt / (target === 0 ? .4 : .28))
    angle = (angle + (speed + next) * .5 * dt) % 360
    speed = next
    glyph.style.transform = `rotate(${angle}deg)`
    if (target !== 0 || speed > .1) frame = requestAnimationFrame(paint)
    else { speed = 0; previous = undefined }
  }
  const start = (): void => {
    if (motion.matches || !hover.matches || document.documentElement.dataset.desktopStudio !== 'true') return
    if (frame === undefined) { previous = undefined; frame = requestAnimationFrame(paint) }
  }
  const enter = (): void => { pointing = true; start() }
  const leave = (): void => { pointing = false }
  const reset = (): void => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    previous = undefined
    speed = 0
    pointing = false
    glyph.style.removeProperty('transform')
    angle = 0
  }
  row.addEventListener('pointerenter', enter)
  row.addEventListener('pointerleave', leave)
  motion.addEventListener('change', reset)
  hover.addEventListener('change', reset)
  return () => {
    reset()
    row.removeEventListener('pointerenter', enter)
    row.removeEventListener('pointerleave', leave)
    motion.removeEventListener('change', reset)
    hover.removeEventListener('change', reset)
  }
}
