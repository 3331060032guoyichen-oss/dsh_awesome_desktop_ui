// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TrajectoryStory } from '../src/client/TrajectoryStory.tsx'
import type { TrajectoryStoryProps } from '../src/client/TrajectoryStory.tsx'
import { t } from './locale.client.ts'

afterEach(cleanup)
const props = (): TrajectoryStoryProps => ({
  turns: [{ turn: 1, groups: [{ title: '', cells: [
    { index: 1, kind: 'system', text: 'Hidden system prompt', timeSeconds: null },
    { index: 2, kind: 'context', text: 'Hidden runtime context', timeSeconds: null },
    { index: 3, kind: 'user', text: 'Find a quiet cafe', timeSeconds: null },
    { index: 4, kind: 'tool', toolName: 'search_places', text: 'search_places', inputDetail: '{"description":"Find cafes with outdoor seating"}', callId: 'search', result: 'Three cafes nearby', timeSeconds: 1.2 },
    { index: 5, kind: 'message', text: 'Here are three cafes', outputDetail: 'Here are three cafes with outdoor seating', timeSeconds: 2 },
  ] }] }],
  streamingCells: [], runningCallIds: new Set(), active: false, loading: false,
  hasOlder: false, loadOlder: vi.fn(async () => true), inspect: vi.fn(), t,
})
describe('task journey', () => {
  it('shows the request, action and result while keeping internal context out of the feed', () => {
    const p = props(); render(<TrajectoryStory {...p} />)
    expect(screen.getByText('Your request')).toBeTruthy()
    expect(screen.getByText('search_places')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Find cafes with outdoor seating' })).toBeTruthy()
    expect(screen.getByText('Three cafes nearby', { selector: 'p' })).toBeTruthy()
    expect(screen.queryByText('Hidden runtime context')).toBeNull()
    expect(screen.queryByText('Hidden system prompt')).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: 'Inspect record' })[1]!)
    expect(p.inspect).toHaveBeenCalledWith(4)
  })
  it('uses actual running and failure facts, and never marks an unrecorded tool result complete', () => {
    const p = props()
    p.turns = [{ turn: 1, groups: [{ title: '', cells: [
      { index: 1, kind: 'tool', text: 'waiting', callId: 'live', timeSeconds: null },
      { index: 2, kind: 'tool', text: 'failed', isError: true, result: 'Permission denied', timeSeconds: 1 },
      { index: 3, kind: 'tool', text: 'unknown', timeSeconds: null },
    ] }] }]
    p.runningCallIds = new Set(['live']); p.active = true
    render(<TrajectoryStory {...p} />)
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(screen.getByText('Result not recorded')).toBeTruthy()
    expect(screen.queryByText('Completed')).toBeNull()
    expect(screen.getAllByText('In progress')).toHaveLength(2)
  })
  it('searches result content and explains an empty search', () => {
    render(<TrajectoryStory {...props()} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'outdoor seating' } })
    expect(screen.getByText('Your request')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no such place' } })
    expect(screen.getByText('No matching activity')).toBeTruthy()
  })
  it('offers older history and a useful initial empty state', () => {
    const p = props(); p.turns = []; p.hasOlder = true
    render(<TrajectoryStory {...p} />)
    expect(screen.getByText('Send a message to start a task journey')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Show earlier activity' }))
    expect(p.loadOlder).toHaveBeenCalledOnce()
  })
})
