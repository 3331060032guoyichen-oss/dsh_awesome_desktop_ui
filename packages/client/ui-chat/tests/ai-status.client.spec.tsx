// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { PartialArguments } from '@deepseek-ai/dsh-util-values'
import { AiStatus } from '../src/client/chat/AiStatus.tsx'
import { DesktopAiStatus } from '../src/client/chat/DesktopAiStatus.tsx'
import type { ChatFlowSlotProps } from '../src/client/contract/slots.ts'
import { EMPTY_CHAT_SNAPSHOT, type ChatSnapshot } from '../src/client/contract/snapshot.ts'
import { zh } from '../src/client/locale.ts'

const t = makeTranslate(zh, commonZh)
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(5_000) })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Desktop AI status', () => {
  it('announces the phase, keeps elapsed ticks silent, and freezes when paused', () => {
    const view = render(<AiStatus state="thinking" startTime={1000} t={t} />)
    expect(screen.getByRole('status').textContent).toBe('正在思考')
    expect(view.container.textContent).toContain('4秒')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('status').textContent).toBe('正在思考')
    expect(view.container.textContent).toContain('6秒')
    view.rerender(<AiStatus state="paused" startTime={1000} t={t} />)
    expect(vi.getTimerCount()).toBe(0)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(view.container.textContent).toContain('6秒')
    view.rerender(<AiStatus state="writing" startTime={1000} t={t} />)
    expect(view.container.textContent).toContain('9秒')
  })
  it('uses recorded final duration and never invents time for unknown history', () => {
    const view = render(<AiStatus state="done" startTime={1000} endTime={3000} t={t} />)
    expect(view.container.textContent).toBe('本轮已完成2秒')
    expect(vi.getTimerCount()).toBe(0)
    view.rerender(<AiStatus state="error" t={t} />)
    expect(view.container.textContent).toBe('本轮遇到问题')
  })
  it('switches from real tool activity to reply writing, and does not run a demo sequence', () => {
    let snapshot: ChatSnapshot = { ...EMPTY_CHAT_SNAPSHOT }
    const useChat: ChatFlowSlotProps['useChat'] = selector => selector(snapshot)
    function useChatNode(key: string): undefined
    function useChatNode<Selected>(key: string, selector: (value: undefined) => Selected): Selected
    function useChatNode<Selected>(_key: string, selector?: (value: undefined) => Selected): Selected | undefined {
      return selector?.(undefined)
    }
    const view = render(<DesktopAiStatus running paused={false} useChat={useChat} useChatNode={useChatNode} t={t} />)
    expect(screen.getByRole('status').textContent).toBe('正在思考')
    for (const [name, label] of [['web_search','正在查找资料'], ['read','正在分析'], ['pwsh','正在执行'], ['write','正在撰写']] as const) {
      snapshot = { ...snapshot, legacy: { ...snapshot.legacy, runningCalls: [{ name, phase: 'preparing', callId: 'call', turn: 1, step: 1, time: 1000, subCalls: [], args: PartialArguments.EMPTY }] } }
      view.rerender(<DesktopAiStatus running paused={false} useChat={useChat} useChatNode={useChatNode} t={t} />)
      expect(screen.getByRole('status').textContent).toBe(label)
    }
    snapshot = { ...snapshot, legacy: { ...snapshot.legacy, runningCalls: [], partial: { turn: 1, step: 1, blocks: [{ kind: 'text', text: 'Answer' }] } } }
    view.rerender(<DesktopAiStatus running paused={false} useChat={useChat} useChatNode={useChatNode} t={t} />)
    expect(screen.getByRole('status').textContent).toBe('正在撰写')
    view.rerender(<DesktopAiStatus running={false} paused={false} useChat={useChat} useChatNode={useChatNode} t={t} />)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
