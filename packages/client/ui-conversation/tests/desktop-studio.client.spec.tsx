// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DesktopStudio } from '../src/client/skeleton/DesktopStudio.tsx'
import type { ConversationContentProps } from '../src/client/contract/slots.ts'
import { zh } from '../src/client/locales.ts'
import { StudioTimeRow } from '../src/client/settings/StudioTimeRow.tsx'

const copy: Readonly<Record<string, string>> = zh
const t: ConversationContentProps['t'] = key => copy[key] ?? key

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  vi.setSystemTime(new Date(2026, 9, 24, 22, 0))
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    disconnect(): void {}
  })
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('desktop scene entry', () => {
  it('rests for a fresh random interval and cancels idle gestures when entering', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { container } = render(<DesktopStudio t={t} hero />)
    const host = container.querySelector<HTMLElement>('[data-mode]')!
    expect(host.hasAttribute('data-idle-active')).toBe(true)
    act(() => { vi.advanceTimersByTime(999) })
    expect(host.hasAttribute('data-idle-hair')).toBe(false)
    act(() => { vi.advanceTimersByTime(1) })
    expect(host.dataset.idleHair).toBe('left')
    expect(host.dataset.idleLeaves).toBe('left')
    act(() => { vi.advanceTimersByTime(2800) })
    expect(host.hasAttribute('data-idle-hair')).toBe(false)
    expect(host.hasAttribute('data-idle-leaves')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /夜猫子来了/ }))
    expect(host.hasAttribute('data-idle-active')).toBe(false)
    expect(host.hasAttribute('data-idle-leaves')).toBe(false)
    vi.restoreAllMocks()
  })

  it('opens a new blank Session directly in the letter after entering once', () => {
    let entered = false
    const studioVisit = { hasEntered: () => entered, enter: () => { entered = true } }
    const first = render(<DesktopStudio t={t} hero studioVisit={studioVisit} />)
    fireEvent.click(screen.getByRole('button', { name: /夜猫子来了/ }))
    first.unmount()
    const next = render(<DesktopStudio t={t} hero studioVisit={studioVisit} />)
    expect(next.container.querySelector('[data-mode="letter"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: '← 返回书桌' })).toBeTruthy()
  })

  it('opens the letter without submitting and preserves the resident draft when returning', () => {
    const submit = vi.fn()
    const { container } = render(<div><DesktopStudio t={t} hero /><form data-conversation-scroll="" onSubmit={submit}><textarea defaultValue="未发送的草稿" /></form></div>)
    const draft = screen.getByDisplayValue('未发送的草稿')
    expect(screen.getByRole('button', { name: /夜猫子来了/ })).toBeTruthy()
    expect(container.querySelector('form')?.hasAttribute('inert')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /夜猫子来了/ }))
    expect(screen.queryByRole('slider')).toBeNull()
    act(() => { vi.advanceTimersByTime(3400) })
    expect(container.querySelector('form')?.hasAttribute('inert')).toBe(false)
    expect(screen.getByDisplayValue('未发送的草稿')).toBe(draft)
    expect(submit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '← 返回书桌' }))
    expect(screen.getByDisplayValue('未发送的草稿')).toBe(draft)
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('previews daytime and restores the local clock', () => {
    document.documentElement.dataset.desktopStudio = 'true'
    render(<div><DesktopStudio t={t} hero /><StudioTimeRow t={t} /></div>)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '10' } })
    expect(screen.getByRole('button', { name: /你好，朋友/ })).toBeTruthy()
    expect(document.body.style.getPropertyValue('--dsh-windows-caption-fill')).toBe('transparent')
    expect(document.body.style.getPropertyValue('--dsh-windows-caption-ink')).toBe('#002fa7')
    fireEvent.click(screen.getByRole('button', { name: '跟随本地时间' }))
    expect(screen.getByRole('button', { name: /夜猫子来了/ })).toBeTruthy()
    expect(document.body.style.getPropertyValue('--dsh-windows-caption-fill')).toBe('transparent')
    expect(document.body.style.getPropertyValue('--dsh-windows-caption-ink')).toBe('#f4efe2')
    delete document.documentElement.dataset.desktopStudio
  })

  it('enters immediately when reduced motion is enabled', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<div><DesktopStudio t={t} hero /></div>)
    fireEvent.click(screen.getByRole('button', { name: /夜猫子来了/ }))
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByRole('button', { name: '← 返回书桌' })).toBeTruthy()
  })
})
