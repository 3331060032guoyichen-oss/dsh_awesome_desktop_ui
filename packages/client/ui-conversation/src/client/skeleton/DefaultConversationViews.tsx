import { useEffect, useRef, useState } from 'react'
import type { ConversationSessionSlotProps } from '../contract/slots.ts'
import { conversationPhase } from '../contract/snapshot.ts'
import { resolveActiveView } from '../view-selection.ts'
import { installStudioTraceWheel } from './studio-trace-wheel.ts'
import css from './ConversationRoot.module.css'

/**
 * Renders the active Session view inside the resident scrollport and keeps
 * the input draft persisted while blank Hero chrome is visible.
 * @param props - Strict Session input/store, view ledger, and render shares.
 * @returns the active view area, or null while the Session remains blank.
 */
export function DefaultConversationViews({
  view, useSession, useConversation, useConversationViews, inputActions, useStore, actions,
  renderSlot, bindDraftPersistence, openView, useInspectCall, studioTrace,
}: ConversationSessionSlotProps) {
  const tabs = useConversationViews(value => value)
  const inspectCall = useInspectCall(value => value)
  const selectedId = useStore(s => s.view)
  const active = resolveActiveView(tabs, selectedId)
  const session = useSession(s => s)
  const conversation = useConversation(s => s)
  const viewRequest = useStore(s => s.viewRequest ?? null)
  const [hovering, setHovering] = useState(false)
  const traceHost = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = traceHost.current
    if (host === null || studioTrace === undefined || !session.running || studioTrace.fullscreen || selectedId === 'trajectory') return
    return installStudioTraceWheel(host)
  }, [session.running, studioTrace?.fullscreen, selectedId])
  useEffect(() => {
    if (studioTrace === undefined) return
    const close = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      studioTrace.close()
      if (selectedId === 'trajectory') actions.setView('chat')
    }
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('keydown', close) }
  }, [studioTrace, selectedId, actions])

  useEffect(() => {
    const unbindDraftPersistence = bindDraftPersistence(actions.setDraft)
    inputActions.persistDraft()
    return () => { unbindDraftPersistence() }
    // The Session input owns content before this persistence writer is attached.
  }, [inputActions])

  if (session.blank && conversationPhase(session, conversation) === 'blank' && !studioTrace?.fullscreen) return null
  const viewId = view ?? active?.id
  const owner = { inspectCall, viewRequest, openView, completeViewRequest: actions.completeViewRequest }
  const hasTrace = tabs.some(tab => tab.id === 'trajectory')
  if (studioTrace !== undefined && hasTrace && (viewId === 'chat' || viewId === 'trajectory')) {
    const fullscreen = studioTrace.fullscreen || viewId === 'trajectory'
    return (
      <div ref={traceHost} className={css.studioViews} data-studio-views="" data-fullscreen={fullscreen || undefined}
        data-revealing={session.running && hovering && !fullscreen || undefined}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          const rect = event.currentTarget.getBoundingClientRect()
          event.currentTarget.style.setProperty('--trace-x', `${event.clientX - rect.left}px`)
          event.currentTarget.style.setProperty('--trace-y', `${event.clientY - rect.top}px`)
          setHovering(true)
        }} onPointerLeave={() => { setHovering(false) }}>
        <div className={css.studioChat}>{renderSlot('conversation.view', owner, { only: 'chat' })}</div>
        {fullscreen && <div className={css.traceMasthead} data-studio-trace-masthead="">
          <span className={css.traceMark} aria-hidden="true">↗</span>
          <h1>{studioTrace.title}</h1>
          <button type="button" className={css.traceClose} onClick={() => {
            studioTrace.close()
            if (viewId === 'trajectory') actions.setView('chat')
          }}><span aria-hidden="true">×</span>{studioTrace.closeLabel}</button>
        </div>}
        {(session.running || fullscreen) && <div className={css.studioTrace} data-studio-trajectory="" aria-hidden={!fullscreen} ref={(element) => { element?.toggleAttribute('inert', !fullscreen) }}>
          {renderSlot('conversation.view', owner, { only: 'trajectory' })}
        </div>}
      </div>
    )
  }
  return (
    <div className={css.viewArea}>
      {viewId !== undefined && renderSlot('conversation.view', {
        inspectCall,
        viewRequest,
        openView,
        completeViewRequest: actions.completeViewRequest,
      }, { only: viewId })}
    </div>
  )
}
