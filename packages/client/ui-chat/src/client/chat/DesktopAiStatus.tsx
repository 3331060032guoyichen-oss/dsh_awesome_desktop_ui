/** Maps observed Session activity to the desktop status indicator. */
import type { ChatFlowSlotProps } from '../contract/slots.ts'
import { AiStatus, type AiStatusState } from './AiStatus.tsx'

export function DesktopAiStatus({ useChat, useChatNode, running, paused, t }: Pick<ChatFlowSlotProps, 'useChat' | 'useChatNode' | 't'> & { running: boolean; paused: boolean }) {
  const anchor = useChat(snapshot => snapshot.navigation.items().at(-1)?.anchorKey)
  const turn = useChatNode(anchor ?? '', node => node?.location.kind === 'turn' || node?.location.kind === 'step' ? node.location.turn : undefined)
  const phase = useChat<AiStatusState>((snapshot) => {
    const calls = snapshot.legacy.runningCalls
    if (calls.length > 0) {
      if (calls.some(call => call.name === 'web_search' || call.name === 'web_fetch')) return 'researching'
      if (calls.some(call => ['write', 'edit', 'apply_patch'].includes(call.name))) return 'writing'
      if (calls.some(call => call.name === 'read' || call.name === 'read_image')) return 'analyzing'
      return 'executing'
    }
    const block = snapshot.legacy.partial?.blocks.at(-1)
    return block?.kind === 'text' && block.text !== '' ? 'writing' : 'thinking'
  })
  const reason = turn?.end?.data.reason.kind
  const state = running ? paused ? 'paused' : phase : reason === 'completed' ? 'done' : reason === 'error' ? 'error' : reason === undefined ? null : 'stopped'
  if (state === null) return null
  return <AiStatus state={state} startTime={turn?.start?.time} endTime={running ? undefined : turn?.end?.time} t={t} />
}
