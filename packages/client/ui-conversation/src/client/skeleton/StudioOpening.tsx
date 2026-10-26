import { useEffect, useId, useRef } from 'react'
import type { RefObject } from 'react'
import type { ConversationContentProps } from '../contract/slots.ts'
import css from './StudioOpening.module.css'

type Props = {
  host: RefObject<HTMLDivElement | null>
  control: NonNullable<ConversationContentProps['studioVisit']>['opening']
  onComplete: () => void
  t: ConversationContentProps['t']
}

const SEAL = '/assets/studio-whale-seal.png'
const ease = (value: number): number => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p) }
const PIECES = [
  { name: 'northWest', x: 0, y: 0, start: .12, end: .37 },
  { name: 'northEast', x: 627, y: 0, start: .15, end: .405 },
  { name: 'southWest', x: 0, y: 627, start: .18, end: .44 },
  { name: 'southEast', x: 627, y: 627, start: .21, end: .48 },
] as const

/** Each quarter starts in a different quadrant before the assembled seal hands off to the desk. */
export function StudioOpening({ host, control, onComplete, t }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    const element = host.current
    const overlay = root.current
    if (element === null || overlay === null) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    let completed = false
    let frame = 0
    const complete = () => { if (!disposed && !completed) { completed = true; onComplete() } }
    const mediaChanged = () => { if (reduced.matches) complete() }
    reduced.addEventListener?.('change', mediaChanged)
    const images: HTMLImageElement[] = []
    const preload = (url: string): Promise<boolean> => new Promise((resolve) => {
      const image = new Image()
      images.push(image)
      image.onload = () => { resolve(true) }
      image.onerror = () => { resolve(false) }
      image.src = url
    })
    const paint = (progress: number) => {
      const advance = ease((progress - .56) / .44)
      element.style.setProperty('--studio-opening-scene-scale', String(1 + advance * .08))
      element.style.setProperty('--studio-opening-scene-opacity', String(ease((progress - .58) / .25)))
      overlay.style.setProperty('--studio-registration-offset', String(1 - ease(progress / .48)))
      for (const piece of PIECES) overlay.style.setProperty(`--studio-${piece.name}-offset`, String(1 - ease((progress - piece.start) / (piece.end - piece.start))))
      overlay.style.setProperty('--studio-seal-scale', String(1 + advance * .28))
      overlay.style.setProperty('--studio-seal-opacity', String(1 - ease((progress - .65) / .25)))
      overlay.style.setProperty('--studio-opening-paper-opacity', String(1 - ease((progress - .58) / .25)))
      overlay.dataset.phase = progress < .48 ? 'register' : progress < .56 ? 'aligned' : 'approach'
      overlay.dataset.progress = progress.toFixed(4)
    }
    paint(0)
    if (reduced.matches) complete()
    else void Promise.all([preload(SEAL), preload('/assets/desktop-studio-scene.png')]).then((loaded) => {
      if (disposed) return
      if (loaded.some(ok => !ok)) { complete(); return }
      const start = control?.start() ?? performance.now()
      const tick = (now: number) => {
        if (disposed) return
        const progress = Math.min(1, Math.max(0, (now - start) / 3000))
        paint(progress)
        if (progress === 1) complete()
        else frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    const fallback = setTimeout(complete, 7500)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      clearTimeout(fallback)
      reduced.removeEventListener?.('change', mediaChanged)
      for (const image of images) { image.onload = null; image.onerror = null }
      element.style.removeProperty('--studio-opening-scene-scale')
      element.style.removeProperty('--studio-opening-scene-opacity')
    }
  }, [host, control, onComplete])
  return <div ref={root} className={css.root} data-studio-opening data-phase="register">
    <div className={css.paper} aria-hidden="true" />
    <svg className={css.seal} viewBox="0 0 1254 1254" aria-hidden="true" data-studio-seal>
      <defs>
        <filter id={`${id}-ink`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -2 -2 -2 0 3.4" /></filter>
        <mask id={`${id}-seal`} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style={{ maskType: 'alpha' }}>
          <image href={SEAL} width="1254" height="1254" filter={`url(#${id}-ink)`} />
        </mask>
        {PIECES.map(piece => <clipPath key={piece.name} id={`${id}-${piece.name}`}><rect x={piece.x} y={piece.y} width="627.5" height="627.5" /></clipPath>)}
      </defs>
      {PIECES.map(piece => <g key={piece.name} className={css[piece.name]} data-studio-seal-piece={piece.name}>
        <g clipPath={`url(#${id}-${piece.name})`}>
          <rect className={css.paperInk} width="1254" height="1254" />
          <rect className={css.blueInk} mask={`url(#${id}-seal)`} width="1254" height="1254" />
        </g>
      </g>)}
      <path className={css.marks} d="M160 195V160H195M1059 160H1094V195M1094 1059V1094H1059M195 1094H160V1059" />
    </svg>
    <button type="button" className={css.skip} onClick={onComplete}>{t('studio.skipIntro')}</button>
  </div>
}
