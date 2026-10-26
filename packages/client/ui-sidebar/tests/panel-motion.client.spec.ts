// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { installPanelMotion } from '../src/client/panel-motion.ts'

afterEach(() => { vi.unstubAllGlobals(); delete document.documentElement.dataset.desktopStudio })

it('accelerates continuously, coasts to rest and resumes without resetting its angle', () => {
  document.documentElement.dataset.desktopStudio = 'true'
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(hover: hover)', addEventListener() {}, removeEventListener() {} }))
  let callback: FrameRequestCallback | undefined
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callback = cb; return 1 })
  vi.stubGlobal('cancelAnimationFrame', () => { callback = undefined })
  const row = document.createElement('button')
  const glyph = document.createElement('span')
  const dispose = installPanelMotion(row, glyph, 240)
  let time = 0
  const advance = (frames: number): void => {
    for (let i = 0; i < frames; i++) { const cb = callback; callback = undefined; cb?.(time); time += 16 }
  }
  const angle = (): number => Number(glyph.style.transform.slice(7, -4))
  row.dispatchEvent(new Event('pointerenter'))
  advance(2)
  const first = angle()
  advance(1)
  const earlyStep = angle() - first
  advance(40)
  const steady = angle()
  advance(1)
  expect(angle() - steady).toBeGreaterThan(earlyStep * 4)
  row.dispatchEvent(new Event('pointerleave'))
  advance(50)
  const slow = angle()
  advance(1)
  expect(angle() - slow).toBeLessThan(earlyStep * 2)
  advance(240)
  expect(callback).toBeUndefined()
  const stopped = angle()
  row.dispatchEvent(new Event('pointerenter'))
  advance(1)
  expect(angle()).toBe(stopped)
  advance(2)
  expect(angle()).toBeGreaterThan(stopped)
  dispose()
  expect(callback).toBeUndefined()
  expect(glyph.style.transform).toBe('')
})

it('keeps motion disabled for reduced-motion preferences', () => {
  document.documentElement.dataset.desktopStudio = 'true'
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  const request = vi.fn()
  vi.stubGlobal('requestAnimationFrame', request)
  const row = document.createElement('button')
  const dispose = installPanelMotion(row, document.createElement('span'), 90)
  row.dispatchEvent(new Event('pointerenter'))
  expect(request).not.toHaveBeenCalled()
  dispose()
})
