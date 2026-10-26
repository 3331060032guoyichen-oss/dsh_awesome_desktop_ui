import { useEffect, useState } from 'react'
import { IconThinkOutlineRegular, IconSearchOutlineRegular, IconEditOutlineRegular, IconCheckOutlineRegular, IconCloseOutlineRegular, IconPauseOutlineRegular, TextShimmer } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ChatViewSlotProps } from '../contract/slots.ts'
import { formatRunDuration, LIVE_RUN_CLOCK_INTERVAL_MS } from './message-chrome.ts'
import css from './AiStatus.module.css'

export type AiStatusState = 'thinking' | 'researching' | 'analyzing' | 'writing' | 'executing' | 'done' | 'error' | 'paused' | 'stopped'

function StatusIcon({ state }: { state: AiStatusState }) {
  const Icon = state === 'researching' ? IconSearchOutlineRegular
    : state === 'writing' ? IconEditOutlineRegular
      : state === 'done' ? IconCheckOutlineRegular
        : state === 'error' ? IconCloseOutlineRegular
          : state === 'paused' || state === 'stopped' ? IconPauseOutlineRegular
            : IconThinkOutlineRegular
  return <span className={css.glyph} aria-hidden="true"><Icon /></span>
}
/** Clock changes are visual only; assistive technology announces phase changes. */
export function AiStatus({ state, startTime, endTime, t }: {
  state: AiStatusState
  startTime?: number | undefined
  endTime?: number | undefined
  t: ChatViewSlotProps['t']
}) {
  const active = !['done', 'error', 'paused', 'stopped'].includes(state)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active || startTime === undefined) return
    setNow(Date.now())
    const interval = setInterval(() => { if (!document.hidden) setNow(Date.now()) }, LIVE_RUN_CLOCK_INTERVAL_MS)
    return () => { clearInterval(interval) }
  }, [active, startTime])
  const elapsed = startTime === undefined || (!active && state !== 'paused' && endTime === undefined)
    ? undefined : formatRunDuration(Math.max(0, (endTime ?? now) - startTime), t).map(part => part.text).join('')
  const label = t(`aiStatus.${state}`)
  return <div className={css.root} data-slot="ai-status" data-state={state} data-active={active || undefined}>
    <span key={state} className={css.icon}><StatusIcon state={state} /></span>
    <span key={`label-${state}`} className={css.label} role="status" aria-live="polite"><TextShimmer active={active}>{label}</TextShimmer></span>
    {elapsed !== undefined && <span className={css.elapsed} aria-hidden="true">{elapsed}</span>}
  </div>
}
