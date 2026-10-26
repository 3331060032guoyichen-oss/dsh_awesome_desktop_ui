// @vitest-environment jsdom
import { createRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { StudioOpening } from '../src/client/skeleton/StudioOpening.tsx'
import { DesktopStudio } from '../src/client/skeleton/DesktopStudio.tsx'
import { zh } from '../src/client/locales.ts'
import type { ConversationContentProps } from '../src/client/contract/slots.ts'

const copy: Readonly<Record<string, string>> = zh
const t: ConversationContentProps['t'] = key => copy[key] ?? key
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

it('aligns the selected seal before moving only forward into the existing homepage framing', async () => {
  let frame: FrameRequestCallback = () => {}
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null
    set src(_value: string) { queueMicrotask(() => { this.onload?.() }) }
  })
  const host = createRef<HTMLDivElement>()
  const onComplete = vi.fn()
  const control = { start: () => 0, hasFinished: () => false, finish: vi.fn() }
  const { container } = render(<div ref={host}><StudioOpening host={host} control={control} onComplete={onComplete} t={t} /></div>)
  const opening = container.querySelector<HTMLElement>('[data-studio-opening]')!
  expect(container.querySelectorAll('[data-studio-seal-piece]').length).toBe(4)
  await act(async () => { await Promise.resolve() })
  act(() => { frame(300) })
  for (const quarter of ['northWest', 'northEast', 'southWest', 'southEast']) {
    expect(Number(opening.style.getPropertyValue(`--studio-${quarter}-offset`))).toBe(1)
  }
  act(() => { frame(1440) })
  expect(opening.dataset.phase).toBe('aligned')
  expect(Number(opening.style.getPropertyValue('--studio-registration-offset'))).toBe(0)
  for (const quarter of ['northWest', 'northEast', 'southWest', 'southEast']) {
    expect(Number(opening.style.getPropertyValue(`--studio-${quarter}-offset`))).toBe(0)
  }
  const scales: number[] = []
  for (const time of [1680, 2000, 2500, 3000]) {
    act(() => { frame(time) })
    scales.push(Number(host.current!.style.getPropertyValue('--studio-opening-scene-scale')))
  }
  expect(scales.every((scale, index) => index === 0 || scale >= scales[index - 1]!)).toBe(true)
  // The camera may advance, but its visible illustration must never shrink below cover.
  expect(scales.every(scale => scale >= 1)).toBe(true)
  expect(scales.at(-1)).toBe(1.08)
  expect(onComplete).toHaveBeenCalledOnce()
  act(() => { vi.advanceTimersByTime(7500) })
  expect(onComplete).toHaveBeenCalledOnce()
})

it('skips to the homepage with a resident draft and never replays on returning to the desk', () => {
  let finished = false
  const opening = { start: () => 0, hasFinished: () => finished, finish: () => { finished = true } }
  const enter = vi.fn()
  const { container } = render(<div><DesktopStudio t={t} hero={false} studioVisit={{ hasEntered: () => false, enter, opening }} /><form data-conversation-scroll><textarea defaultValue="保留的草稿" /></form></div>)
  const draft = screen.getByDisplayValue('保留的草稿')
  expect(container.querySelector('[data-mode="intro"]')).not.toBeNull()
  expect(container.querySelector('form')?.hasAttribute('inert')).toBe(true)
  expect(enter).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '跳过开场' }))
  expect(finished).toBe(true)
  expect(container.querySelector('[data-mode="scene"]')).not.toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /我们一起做些什么呢/ }))
  act(() => { vi.advanceTimersByTime(3400) })
  fireEvent.click(screen.getByRole('button', { name: '← 返回书桌' }))
  expect(container.querySelector('[data-studio-opening]')).toBeNull()
  expect(screen.getByDisplayValue('保留的草稿')).toBe(draft)
})

it('bypasses the opening when reduced motion is requested', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const finish = vi.fn()
  const { container } = render(<DesktopStudio t={t} hero studioVisit={{
    hasEntered: () => false, enter: vi.fn(), opening: { start: () => 0, hasFinished: () => false, finish },
  }} />)
  expect(finish).toHaveBeenCalledOnce()
  expect(container.querySelector('[data-mode="scene"]')).not.toBeNull()
  expect(container.querySelector('[data-studio-opening]')).toBeNull()
})
