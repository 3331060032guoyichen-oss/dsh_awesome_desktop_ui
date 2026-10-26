// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DefaultConversationViews } from '../src/client/skeleton/DefaultConversationViews.tsx'
import type { ConversationSessionSlotProps } from '../src/client/contract/slots.ts'

afterEach(cleanup)

function source<T>(snapshot: T) {
  return <R,>(select: (value: T) => R): R => select(snapshot)
}

function props(running: boolean, fullscreen = false, blank = false) {
  const close = vi.fn()
  const value = {
    useSession: source({ blank, running }),
    useConversation: source({ activeTargets: new Set<string>() }),
    useConversationViews: source([{ id: 'chat', label: 'Chat' }, { id: 'trajectory', label: 'Trajectory' }]),
    useInspectCall: source(undefined),
    useStore: source({ view: 'chat', viewRequest: null }),
    inputActions: { persistDraft: vi.fn() },
    actions: { setDraft: vi.fn(), setView: vi.fn(), completeViewRequest: vi.fn() },
    bindDraftPersistence: () => () => {},
    openView: vi.fn(),
    renderSlot: (_name: string, _owner: object, options: { only: string }) => <p>{options.only}</p>,
    studioTrace: { fullscreen, title: 'Trajectory', closeLabel: 'Close trajectory', close },
  }
  return { value: value as never as ConversationSessionSlotProps, close }
}

it('reveals the real trajectory view only while processing inside the conversation body', () => {
  const initial = props(true)
  const { container, rerender } = render(<div><DefaultConversationViews {...initial.value} /><textarea aria-label="Draft" /></div>)
  const body = container.querySelector('[data-fullscreen]') ?? screen.getByText('chat').parentElement?.parentElement
  expect(body).toBeTruthy()
  expect(container.querySelector('[data-revealing]')).toBeNull()
  fireEvent.pointerMove(body!, { pointerType: 'mouse', clientX: 100, clientY: 100 })
  expect(container.querySelector('[data-revealing]')).toBeTruthy()
  expect(container.querySelector('[data-studio-trajectory]')?.hasAttribute('inert')).toBe(true)
  fireEvent.pointerLeave(body!)
  fireEvent.pointerMove(screen.getByRole('textbox', { name: 'Draft' }))
  expect(container.querySelector('[data-revealing]')).toBeNull()
  rerender(<DefaultConversationViews {...props(false).value} />)
  expect(container.querySelector('[data-studio-trajectory]')).toBeNull()
})

it('opens an empty session trajectory in fullscreen and offers pointer and keyboard closing', () => {
  const initial = props(false, true, true)
  const { container } = render(<DefaultConversationViews {...initial.value} />)
  const trace = container.querySelector('[data-studio-trajectory]')
  expect(trace?.hasAttribute('inert')).toBe(false)
  expect(trace?.getAttribute('aria-hidden')).toBe('false')
  fireEvent.click(screen.getByRole('button', { name: 'Close trajectory' }))
  expect(initial.close).toHaveBeenCalledOnce()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(initial.close).toHaveBeenCalledTimes(2)
})
