import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import css from './SidebarVibe.module.css'

type PanelImage = {
  element: HTMLElement
  width: number
  height: number
  left: number
  top: number
  scrolls: { element: HTMLElement; top: number; left: number }[]
}

/** An inert DOM image preserves the outgoing panel before its live contents collapse. */
function panelImage(surface: HTMLElement, width: number): PanelImage {
  const bounds = surface.getBoundingClientRect()
  const element = surface.cloneNode(true) as HTMLElement
  element.removeAttribute('data-sidebar-surface')
  element.removeAttribute('data-pixel-transition')
  element.inert = true
  element.setAttribute('aria-hidden', 'true')
  const originals = [surface, ...surface.querySelectorAll<HTMLElement>('*')]
  const copies = [element, ...element.querySelectorAll<HTMLElement>('*')]
  const scrolls: PanelImage['scrolls'] = []
  for (let i = 0; i < originals.length; i++) {
    const original = originals[i]
    const copy = copies[i]
    if (original !== undefined && copy !== undefined && (original.scrollTop !== 0 || original.scrollLeft !== 0)) {
      scrolls.push({ element: copy, top: original.scrollTop, left: original.scrollLeft })
    }
  }
  for (const toggle of element.querySelectorAll('[data-sidebar-toggle]')) toggle.remove()
  return { element, width: Math.max(width, bounds.width), height: bounds.height, left: bounds.left, top: bounds.top, scrolls }
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const keys = shortcut.toLowerCase().split('+')
  return keys.at(-1) === event.key.toLowerCase()
    && keys.includes('control') === event.ctrlKey && keys.includes('meta') === event.metaKey
    && keys.includes('alt') === event.altKey && keys.includes('shift') === event.shiftKey
}

/** The entire sidebar assembles from pixel cells and gathers back into the left edge. */
export function SidebarVibe({ collapsed, viewport, width }: { collapsed: boolean; viewport: number; width: number }) {
  const host = useRef<HTMLDivElement>(null)
  const previous = useRef({ collapsed, viewport })
  const outgoing = useRef<PanelImage | null>(null)
  const maskId = useId().replaceAll(':', '')

  useEffect(() => {
    const frame = host.current?.parentElement
    if (frame === null || frame === undefined) return
    const capture = (event: Event) => {
      if (frame.hasAttribute('data-sidebar-collapsed') || document.documentElement.dataset.desktopStudio !== 'true'
        || matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const target = event.target instanceof Element ? event.target.closest('[data-sidebar-toggle]') : null
      const toggle = frame.querySelector<HTMLElement>('[data-sidebar-toggle]')
      if (target === null && !(event instanceof KeyboardEvent && toggle !== null
        && matchesShortcut(event, toggle.getAttribute('aria-keyshortcuts') ?? ''))) return
      const surface = frame.querySelector<HTMLElement>('[data-sidebar-surface]')
      if (surface !== null) outgoing.current = panelImage(surface, surface.getBoundingClientRect().width)
    }
    frame.addEventListener('click', capture, true)
    frame.addEventListener('keydown', capture, true)
    return () => {
      frame.removeEventListener('click', capture, true)
      frame.removeEventListener('keydown', capture, true)
      outgoing.current = null
    }
  }, [])

  useLayoutEffect(() => {
    const before = previous.current
    previous.current = { collapsed, viewport }
    const node = host.current
    const surface = node?.parentElement?.querySelector<HTMLElement>('[data-sidebar-surface]')
    if (node === null || surface === null || surface === undefined || before.collapsed === collapsed
      || before.viewport !== viewport || document.documentElement.dataset.desktopStudio !== 'true'
      || document.hidden) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return
    const image = collapsed ? outgoing.current : panelImage(surface, width)
    outgoing.current = null
    // Programmatic collapse without an outgoing image uses the ordinary layout transition.
    if (image === null || image.width < 1 || image.height < 1) return
    const bounds = node.getBoundingClientRect()
    node.dataset.palette = String(Math.floor(Math.random() * 3))
    node.dataset.direction = collapsed ? 'close' : 'open'
    node.dataset.active = ''
    const panel = image.element
    panel.classList.add(css.panel as string)
    panel.style.cssText = `position:absolute;left:${image.left - bounds.left}px;top:${image.top - bounds.top}px;width:${image.width}px;height:${image.height}px;visibility:visible;opacity:1;clip-path:url(#${maskId});pointer-events:none`
    // Namespace image IDs so SVG fills cannot alias the live panel.
    const ids = new Map<string, string>()
    for (const element of panel.querySelectorAll<HTMLElement>('[id]')) {
      const scopedId = `${maskId}-${element.id}`
      ids.set(element.id, scopedId)
      element.id = scopedId
    }
    for (const element of [panel, ...panel.querySelectorAll('*')]) {
      element.removeAttribute('data-window-drag')
      for (const attribute of [...element.attributes]) {
        let value = attribute.value
        for (const [oldId, newId] of ids) {
          value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`)
          if (attribute.name === 'href' && value === `#${oldId}`) value = `#${newId}`
        }
        if (value !== attribute.value) element.setAttribute(attribute.name, value)
      }
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.classList.add(css.cells as string)
    svg.style.cssText = `left:${image.left - bounds.left}px;top:${image.top - bounds.top}px;width:${image.width}px;height:${image.height}px`
    svg.setAttribute('viewBox', `0 0 ${image.width} ${image.height}`)
    const clip = document.createElementNS(svg.namespaceURI, 'clipPath')
    clip.id = maskId
    clip.setAttribute('data-sidebar-pixel-mask', '')
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse')
    const defs = document.createElementNS(svg.namespaceURI, 'defs')
    defs.append(clip)
    svg.append(defs)
    node.append(panel, svg)
    for (const scroll of image.scrolls) {
      scroll.element.scrollTop = scroll.top
      scroll.element.scrollLeft = scroll.left
    }
    surface.dataset.pixelTransition = ''
    const animations: Animation[] = []
    const columns = Math.max(4, Math.ceil(image.width / 32))
    const rows = Math.max(1, Math.ceil(image.height / 32))
    const cellWidth = image.width / columns
    const cellHeight = image.height / rows
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const x = column * cellWidth
      const y = row * cellHeight
      const progress = column / columns * .65 + row / rows * .35
      const delay = (collapsed ? 1 - progress : progress) * 100 + Math.random() * 25
      const rect = document.createElementNS(svg.namespaceURI, 'rect')
      rect.setAttribute('width', String(cellWidth + .5))
      rect.setAttribute('height', String(cellHeight + .5))
      clip.append(rect)
      const gathered = `translate(0px,${image.height * .45}px) scale(.015)`
      const placed = `translate(${x}px,${y}px) scale(1)`
      const frames = collapsed ? [{ transform: placed }, { transform: gathered }] : [{ transform: gathered }, { transform: placed }]
      const timing = { duration: collapsed ? 260 : 310, delay, fill: 'both' as const, easing: 'cubic-bezier(.2,.7,.25,1)' }
      animations.push(rect.animate(frames, timing))
      const tint = rect.cloneNode() as SVGRectElement
      tint.classList.add(css.tint as string)
      svg.append(tint)
      animations.push(tint.animate(frames.map((frame, index) => ({
        ...frame, opacity: collapsed ? index === 0 ? .03 : .4 : index === 0 ? .4 : 0,
      })), timing))
    }
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      for (const animation of animations) animation.cancel()
      node.replaceChildren()
      delete node.dataset.active
      delete surface.dataset.pixelTransition
    }
    const timer = setTimeout(finish, 650)
    void Promise.all(animations.map(animation => animation.finished)).then(finish, () => {})
    reduced.addEventListener('change', finish)
    document.addEventListener('visibilitychange', finish)
    return () => {
      clearTimeout(timer)
      reduced.removeEventListener('change', finish)
      document.removeEventListener('visibilitychange', finish)
      finish()
    }
  }, [collapsed, viewport, width, maskId])
  return <div ref={host} className={css.root} data-sidebar-vibe aria-hidden="true" />
}
