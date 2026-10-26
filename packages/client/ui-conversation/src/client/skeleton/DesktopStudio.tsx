import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import type { ConversationContentProps } from '../contract/slots.ts'
import css from './DesktopStudio.module.css'
import { readStudioTime, subscribeStudioTime } from '../studio-time.ts'
import { useStudioParallax } from './useStudioParallax.ts'
import { useStudioIdle } from './useStudioIdle.ts'
import { StudioOpening } from './StudioOpening.tsx'

type StudioProps = Pick<ConversationContentProps, 't' | 'hero' | 'studioVisit'>

import { studioCamera, studioProjection, STUDIO_PAPER } from './studio-camera.ts'
const PAPER_TRANSFORM = studioProjection([[0,0],[1000,0],[1000,540],[0,540]],STUDIO_PAPER)

const LIGHT_STOPS: readonly (readonly [number, number, number, number, number, number])[] = [
  [0, .45, .78, .72, .025, .85], [4.5, .45, .78, .72, .025, .85],
  [6.5, .82, .86, .12, .2, 0], [9, 1, 1, 0, .01, 0],
  [15, 1, 1, 0, .01, 0], [18, .79, .9, .28, .24, .05],
  [21, .45, .78, .72, .025, .85], [24, .45, .78, .72, .025, .85],
]

/**
 * Desktop scene with a resident editor behind it to retain drafts.
 * @param props - Localized copy and the initial blank-session posture.
 * @returns The paper entry, camera transition, or return control.
 */
export function DesktopStudio({ t, hero, studioVisit }: StudioProps) {
  const [mode, setMode] = useState<'intro' | 'scene' | 'entering' | 'letter'>(() => studioVisit?.opening?.hasFinished() === false
    ? 'intro' : hero && studioVisit?.hasEntered() !== true ? 'scene' : 'letter')
  useEffect(() => { if (mode === 'entering' || mode === 'letter') studioVisit?.enter() }, [mode, studioVisit])
  const completeOpening = useCallback(() => { studioVisit?.opening?.finish(); setMode('scene') }, [studioVisit])
  const [clock, setClock] = useState(() => new Date().getHours() + new Date().getMinutes() / 60)
  const preview = useSyncExternalStore(subscribeStudioTime, readStudioTime)
  const [size, setSize] = useState({ width: 1672, height: 941 })
  const [progress, setProgress] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  useStudioParallax(host, mode)
  useStudioIdle(host, mode)
  const hour = preview ?? clock
  const period = hour >= 5 && hour < 8 ? 'morning' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night'
  useEffect(() => {
    const update = (): void => { const now = new Date(); setClock(now.getHours() + now.getMinutes() / 60) }
    const timer = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update) }
  }, [])
  useEffect(() => {
    const element = host.current
    if (element === null) return
    // Entry is viewport-sized; the resident letter keeps its own content rectangle.
    const measure = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => { observer.disconnect() }
  }, [])
  useEffect(() => {
    const root = host.current?.parentElement
    if (root === undefined || root === null) return
    root.dataset.studioMode = mode
    const scroller = root.querySelector<HTMLElement>('[data-conversation-scroll], [data-studio-scroll]')
    const composer = root.querySelector<HTMLElement>('[data-composer-seat]')
    composer?.toggleAttribute('inert', mode !== 'letter')
    scroller?.toggleAttribute('inert', mode !== 'letter')
    return () => { scroller?.removeAttribute('inert'); composer?.removeAttribute('inert'); delete root.dataset.studioMode }
  }, [mode])
  useEffect(() => {
    if (mode !== 'entering') return
    let frame = 0
    const start = performance.now()
    const animate = (time: number): void => {
      const next = Math.min(1, (time - start) / 3400)
      setProgress(next)
      if (next < 1) frame = window.requestAnimationFrame(animate)
    }
    frame = window.requestAnimationFrame(animate)
    const timer = window.setTimeout(() => {
      setMode('letter')
      window.requestAnimationFrame(() => {
        host.current?.parentElement?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus()
      })
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 3400)
    return () => { window.clearTimeout(timer); window.cancelAnimationFrame(frame) }
  }, [mode])
  const ease = (value: number): number => { const n = Math.max(0, Math.min(1, value)); return n * n * (3 - 2 * n) }
  const p = mode === 'letter' ? 1 : mode === 'entering' ? progress : 0
  const upper = LIGHT_STOPS.findIndex(stop => stop[0] > hour)
  const lowerLight = LIGHT_STOPS.at(upper - 1)
  const upperLight = LIGHT_STOPS.at(upper)
  if (lowerLight === undefined || upperLight === undefined) throw new Error('studio: hour is outside the lighting stops')
  const blend = ease((hour - lowerLight[0]) / (upperLight[0] - lowerLight[0]))
  const mixLight = (index: 1 | 2 | 3 | 4 | 5): number => lowerLight[index] + (upperLight[index] - lowerLight[index]) * blend
  const dusk = ease((hour - 15) / 3) * (1 - ease((hour - 18.5) / 2.5))
  const night = Math.max(0, Math.min(1, (1 - mixLight(1)) / .55))
  const captionInk = mode === 'intro' || night < .45 && dusk < .55 ? '#002fa7' : '#f4efe2'
  useEffect(() => {
    if (mode === 'letter') return
    const body = document.body
    body.style.setProperty('--dsh-windows-caption-fill', 'transparent')
    body.style.setProperty('--dsh-windows-caption-ink', captionInk)
    return () => {
      body.style.removeProperty('--dsh-windows-caption-fill')
      body.style.removeProperty('--dsh-windows-caption-ink')
    }
  }, [mode, captionInk])
  const style = {
    '--studio-paper-transform': PAPER_TRANSFORM,
    '--studio-overhead-opacity': ease((p - .76) / .24),
    '--studio-scene-opacity': 1 - ease((p - .82) / .18),
    '--studio-camera-transform': studioCamera(size.width, size.height, p),
    '--studio-brightness': mixLight(1),
    '--studio-saturation': mixLight(2),
    '--studio-window-opacity': mixLight(3),
    '--studio-warmth': mixLight(4) * (1 - dusk),
    '--studio-dusk': dusk,
    '--studio-stars': mixLight(5),
    '--studio-depth-scale': 1 + .018 * (1 - ease(p / .2)),
    '--studio-center-x': `${size.width / 2}px`,
    '--studio-center-y': `${size.height / 2}px`,
  } as CSSProperties
  return (<>
    {mode === 'letter' && <button type="button" className={css.back} onClick={() => { setMode('scene') }}>{t('studio.back')}</button>}
    <div ref={host} className={css.host} data-mode={mode} data-period={period} style={style}>
      <div className={css.scene} {...(mode === 'intro' ? { inert: '' } : {})} aria-hidden={mode === 'intro' || undefined}>
        <div className={css.stage}>
          <div className={css.parallax}>
            <div className={css.art} data-studio-rigid-scene="" />
            <div className={css.dusk} aria-hidden="true" />
            <div className={css.idleBody} aria-hidden="true"><div className={css.art} /><div className={css.dusk} />
              <div className={css.idleHair}><div className={css.art} /><div className={css.dusk} /></div>
            </div>
            <div className={css.idleLeaves} aria-hidden="true"><div className={css.art} /><div className={css.dusk} /></div>
            <div className={css.window} />
            <div className={css.stars} aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div className={css.light} />
            <button type="button" className={css.paper} disabled={mode === 'entering' || mode === 'intro'} onClick={() => { setProgress(0); setMode('entering') }}>
              <span className={css.greeting}>{t(`studio.${period}`)}</span>
              <span className={css.invitation}>{t('studio.invitation')}</span>
            </button>
          </div>
        </div>
      </div>
      <div className={css.overhead} aria-hidden="true" />
      {mode === 'intro' && <StudioOpening host={host} control={studioVisit?.opening} onComplete={completeOpening} t={t} />}
    </div>
  </>)
}
