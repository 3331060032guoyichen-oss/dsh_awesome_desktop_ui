/** Decorative Hook navigation for the existing workspace tree and search results. */
import { useLayoutEffect, useRef, type ReactNode, type PointerEvent, type FocusEvent } from 'react'
import clsx from 'clsx'
import css from './WorkspaceHook.module.css'

const ROW = '[role="treeitem"]'
/** @param props - the existing list seat and its unchanged children. @returns a scrolling-aware navigation rail. */
export function WorkspaceHook({ children, className }: { children: ReactNode; className: string | undefined }) {
  const host = useRef<HTMLDivElement>(null)
  const active = useRef<HTMLSpanElement>(null)
  const preview = useRef<HTMLSpanElement>(null)
  const hovered = useRef<HTMLElement | null>(null)
  const focused = useRef<HTMLElement | null>(null)
  const update = useRef<() => void>(() => {})
  useLayoutEffect(() => {
    const root = host.current
    if (!root) return
    let frame = 0
    const draw = (rail: HTMLElement | null, row: HTMLElement | null) => {
      if (!rail) return
      const bounds = root.getBoundingClientRect()
      const rect = row?.isConnected ? row.getBoundingClientRect() : undefined
      const group = row?.closest('[data-workspace-hook-group]')
      const parent = group?.querySelector<HTMLElement>('[data-row-key^="workspace:"]')
      const parentRect = parent?.getBoundingClientRect()
      const y = rect ? rect.top - bounds.top + rect.height / 2 : -1
      const visible = y >= 0 && y <= bounds.height && parentRect !== undefined && parent !== row
      rail.dataset['visible'] = String(visible)
      if (visible && row && rect && parent && parentRect) {
        const inset = parseFloat(getComputedStyle(row).paddingInlineStart) || 0
        const parentInset = parseFloat(getComputedStyle(parent).paddingInlineStart) || 0
        const left = parentRect.left - bounds.left + parentInset + 8
        const top = parentRect.top - bounds.top + parentRect.height / 2 + 8
        rail.style.setProperty('--workspace-hook-left', `${left}px`)
        rail.style.setProperty('--workspace-hook-top', `${top}px`)
        rail.style.setProperty('--workspace-hook-y', `${Math.max(7, y - top)}px`)
        rail.style.setProperty('--workspace-hook-width', `${Math.max(12, rect.left - bounds.left + inset + 14 - left)}px`)
      }
    }
    const measure = () => {
      frame = 0
      const selected = root.querySelector<HTMLElement>(`${ROW}[aria-selected="true"]`)
      const target = hovered.current ?? focused.current
      draw(active.current, selected)
      draw(preview.current, target === selected ? null : target)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    update.current = schedule
    measure()
    const mutations = new MutationObserver(schedule)
    mutations.observe(root, { subtree: true, childList: true, attributes: true,
      attributeFilter: ['aria-selected', 'aria-expanded', 'data-row-key'] })
    const sizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
    sizes?.observe(root)
    root.addEventListener('scroll', schedule, true)
    root.addEventListener('transitionend', schedule, true)
    root.addEventListener('animationend', schedule, true)
    return () => {
      update.current = () => {}
      cancelAnimationFrame(frame)
      mutations.disconnect(); sizes?.disconnect()
      root.removeEventListener('scroll', schedule, true)
      root.removeEventListener('transitionend', schedule, true)
      root.removeEventListener('animationend', schedule, true)
    }
  }, [])
  const hover = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    hovered.current = event.target instanceof Element ? event.target.closest<HTMLElement>(ROW) : null
    update.current()
  }
  const focus = (event: FocusEvent<HTMLDivElement>) => {
    hovered.current = null
    focused.current = event.target.closest<HTMLElement>(ROW)
    update.current()
  }
  return <div ref={host} className={clsx(className, css.root)} data-workspace-hook-tree
    onPointerOver={hover} onPointerLeave={() => { hovered.current = null; update.current() }}
    onFocusCapture={focus} onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { focused.current = null; update.current() }
    }}>
    <div className={css.rails} aria-hidden="true">
      <span ref={preview} className={clsx(css.rail, css.preview)} data-workspace-hook="preview"><i /><b /></span>
      <span ref={active} className={css.rail} data-workspace-hook="active"><i /><b /></span>
    </div>
    {children}
  </div>
}
