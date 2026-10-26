// @vitest-environment jsdom
import { cleanup, fireEvent, render, act } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SidebarVibe } from '../src/client/SidebarVibe.tsx'

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')
afterEach(() => {
  cleanup()
  delete document.documentElement.dataset.desktopStudio
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  if (animateDescriptor === undefined) Reflect.deleteProperty(Element.prototype, 'animate')
  else Object.defineProperty(Element.prototype, 'animate', animateDescriptor)
})

it.each([0, 1, 2])('assembles the complete panel in palette %i, then gathers it and releases the live surface', (palette) => {
  vi.useFakeTimers()
  document.documentElement.dataset.desktopStudio = 'true'
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  vi.spyOn(Math, 'random').mockReturnValue((palette + .1) / 3)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { left: 0, top: this.hasAttribute('data-sidebar-surface') ? 40 : 0, width: 320, height: 640 } as DOMRect
  })
  const animations: { cancel: ReturnType<typeof vi.fn>; frames: Keyframe[] }[] = []
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: vi.fn((frames: Keyframe[]) => {
    const animation = { cancel: vi.fn(), frames, finished: new Promise<void>(() => {}) }
    animations.push(animation)
    return animation as unknown as Animation
  }) })
  const view = (collapsed: boolean, viewport = 1200) => <div data-sidebar-collapsed={collapsed || undefined}>
    <div data-sidebar-surface><button data-sidebar-toggle>Toggle</button><span id="live-panel-label">Workspace and conversations</span></div>
    <SidebarVibe collapsed={collapsed} viewport={viewport} width={320} />
  </div>
  const rendered = render(view(true))
  const original = rendered.container.querySelector('[data-sidebar-surface]')!
  expect(animations.length).toBe(0)
  rendered.rerender(view(false))
  const image = rendered.container.querySelector('[data-sidebar-vibe] > div') as HTMLElement
  expect(image.inert).toBe(true)
  expect(image.textContent).toContain('Workspace and conversations')
  expect(image.querySelector('[data-sidebar-toggle]')).toBeNull()
  expect(image.id).not.toBe('live-panel-label')
  expect(rendered.container.querySelectorAll('#live-panel-label').length).toBe(1)
  expect(original.hasAttribute('data-pixel-transition')).toBe(true)
  expect(image.style.width).toBe('320px')
  expect(image.style.height).toBe('640px')
  expect(rendered.container.querySelector('[data-sidebar-vibe]')?.getAttribute('data-palette')).toBe(String(palette))
  expect(rendered.container.querySelectorAll('[data-sidebar-pixel-mask] rect').length).toBe(200)
  expect(animations.some(a => String(a.frames.at(-1)?.transform).includes('608px'))).toBe(true)
  const opening = animations.slice()
  fireEvent.click(rendered.container.querySelector('[data-sidebar-surface] button')!)
  rendered.rerender(view(true))
  expect(opening.every(a => a.cancel.mock.calls.length === 1)).toBe(true)
  expect(rendered.container.querySelector('[data-sidebar-vibe]')?.getAttribute('data-direction')).toBe('close')
  expect(rendered.container.querySelectorAll('[data-sidebar-pixel-mask] rect').length).toBe(200)
  act(() => { vi.advanceTimersByTime(650) })
  expect(original.hasAttribute('data-pixel-transition')).toBe(false)
  expect(rendered.container.querySelector('[data-sidebar-vibe]')?.childElementCount).toBe(0)
  rendered.rerender(view(false, 600))
  expect(rendered.container.querySelector('[data-sidebar-vibe]')?.childElementCount).toBe(0)
  expect(rendered.container.querySelector('[data-sidebar-surface]')).toBe(original)
  rendered.unmount()
  expect(animations.every(a => a.cancel.mock.calls.length === 1)).toBe(true)
})

it('keeps reduced motion free of pixel overlays', () => {
  document.documentElement.dataset.desktopStudio = 'true'
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const rendered = render(<div><div data-sidebar-surface /><SidebarVibe collapsed viewport={1200} width={320} /></div>)
  rendered.rerender(<div><div data-sidebar-surface /><SidebarVibe collapsed={false} viewport={1200} width={320} /></div>)
  expect(rendered.container.querySelector('[data-sidebar-vibe]')?.childElementCount).toBe(0)
})
