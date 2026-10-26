/** Route preview wheel gestures to the trajectory without moving Chat.
 * @param host - Studio element containing the preview and trajectory.
 * @returns Listener disposer.
 */
export function installStudioTraceWheel(host: HTMLElement): () => void {
  const wheel = (event: WheelEvent): void => {
    const rect = host.getBoundingClientRect()
    const x = Number.parseFloat(host.style.getPropertyValue('--trace-x'))
    const y = Number.parseFloat(host.style.getPropertyValue('--trace-y'))
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(event.clientX-rect.left-x,event.clientY-rect.top-y)>180) return
    const trace = host.querySelector<HTMLElement>('[data-studio-trajectory] [data-trajectory-story], [data-studio-trajectory] [data-trajectory-scroll]')
    if (trace === null) return
    event.preventDefault()
    event.stopPropagation()
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? trace.clientHeight : 1
    trace.scrollTop += event.deltaY * unit
  }
  host.addEventListener('wheel',wheel,{ passive:false })
  return () => { host.removeEventListener('wheel',wheel) }
}
