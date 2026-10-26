/** View-only file-tree navigation rails; filesystem actions remain owned by FilesBody. */
import { useLayoutEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import css from './FileHookRail.module.css'

interface Point { y: number; x: number }
function rowPath(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined
  return target.closest('[data-files-entry] > button')?.parentElement?.dataset['filesPath']
}
/** @param props - selected row and current tree layout. @returns content with non-interactive navigation rails. */
export function FileHookRail({ children, selectedPath, revision }: {
  children: ReactNode
  selectedPath: string | undefined
  revision: object
}) {
  const root = useRef<HTMLDivElement>(null)
  const [pointerPath, setPointerPath] = useState<string>()
  const [focusPath, setFocusPath] = useState<string>()
  const previewPath = pointerPath ?? focusPath
  const [points, setPoints] = useState<{ active?: Point; preview?: Point }>({})
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      const rows = [...element.querySelectorAll<HTMLElement>('[data-files-entry] > button')]
      const point = (path: string | undefined): Point | undefined => {
        const row = path === undefined ? undefined : rows.find(row => row.parentElement?.dataset['filesPath'] === path)
        if (!row) return undefined
        const rect = row.getBoundingClientRect()
        return { y: rect.top - bounds.top + rect.height / 2, x: rect.left - bounds.left + 14 }
      }
      const active = point(selectedPath)
      const preview = previewPath === selectedPath ? undefined : point(previewPath)
      setPoints((previous) => {
        if (previous.active?.x === active?.x && previous.active?.y === active?.y
          && previous.preview?.x === preview?.x && previous.preview?.y === preview?.y) return previous
        return { ...active ? { active } : {}, ...preview ? { preview } : {} }
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [selectedPath, previewPath, revision])
  const rail = (point: Point | undefined, preview: boolean) => <span aria-hidden="true"
    className={css.rail} data-files-hook={preview ? 'preview' : 'active'} data-visible={point !== undefined}
    style={{ '--files-hook-y': `${point?.y ?? 0}px`, '--files-hook-x': `${point?.x ?? 14}px` } as CSSProperties}>
    <span className={css.stem} /><span className={css.corner} />
  </span>
  return <div ref={root} className={css.canvas} data-files-hook-tree
    onPointerOver={(event) => { if (event.pointerType === 'mouse') setPointerPath(rowPath(event.target)) }}
    onPointerLeave={() => setPointerPath(undefined)}
    onFocusCapture={(event) => { setPointerPath(undefined); setFocusPath(rowPath(event.target)) }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusPath(undefined) }}>
    {rail(points.preview, true)}{rail(points.active, false)}{children}
  </div>
}
