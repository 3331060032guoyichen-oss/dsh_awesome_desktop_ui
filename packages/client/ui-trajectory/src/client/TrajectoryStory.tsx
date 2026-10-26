/** Human-readable activity feed over the existing, factual trajectory projection. */
import { useMemo, useState } from 'react'
import { IconCheckOutlineRegular, IconChevronRightOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { TrajectoryTurnModel } from './layout.ts'
import type { TrajectoryCellProps } from './trajectory-record.ts'
import { trajectoryRecordId, formatElapsedSeconds } from './trajectory-record.ts'
import { trajectoryPreviewText } from './trajectory-preview.ts'
import type { TrajectoryTranslate } from './locales.ts'
import css from './TrajectoryStory.module.css'

export interface TrajectoryStoryProps {
  turns: readonly TrajectoryTurnModel[]
  streamingCells: readonly TrajectoryCellProps[]
  runningCallIds: ReadonlySet<string>
  active: boolean
  loading: boolean
  hasOlder: boolean
  loadOlder: () => Promise<boolean>
  inspect: (index: number) => void
  t: TrajectoryTranslate
}

function body(cell: TrajectoryCellProps): string {
  return cell.kind === 'user' ? cell.inputDetail ?? cell.previewMarkdown ?? cell.text
    : cell.kind === 'message' ? cell.outputDetail ?? cell.previewMarkdown ?? cell.text
      : cell.outputDetail ?? cell.resultPreviewMarkdown ?? cell.result ?? ''
}

function actionDescription(cell: TrajectoryCellProps): string | undefined {
  if (cell.inputDetail === undefined || cell.inputDetail.length > 65_536) return undefined
  try {
    const args: unknown = JSON.parse(cell.inputDetail)
    if (args !== null && typeof args === 'object' && 'description' in args && typeof args.description === 'string') return args.description
  } catch { /* Partial tool arguments are not complete JSON yet. */ }
  return undefined
}

export function TrajectoryStory({
  turns, streamingCells, runningCallIds, active, loading, hasOlder, loadOlder, inspect, t,
}: TrajectoryStoryProps) {
  const [query, setQuery] = useState('')
  const [visibleTurns, setVisibleTurns] = useState(6)
  const sections = useMemo(() => {
    const live = new Map(streamingCells.map(cell => [cell.index, cell]))
    return turns.flatMap((turn) => {
      const cells = turn.groups.flatMap(group => group.cells)
        .filter(cell => !cell.requestOnly && ['user', 'message', 'tool', 'subtool'].includes(cell.kind))
        .map(cell => live.get(cell.index) ?? cell)
      return cells.length === 0 ? [] : [{ turn: turn.turn, cells }]
    })
  }, [turns, streamingCells])
  const matches = sections.filter(section => section.cells.some(cell =>
    `${cell.text} ${cell.toolName ?? ''} ${body(cell)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))
  const visible = (query.trim() === '' ? matches.slice(-visibleTurns) : matches).toReversed()
  const actions = sections.reduce((count, section) => count + section.cells.filter(cell => cell.kind === 'tool').length, 0)
  const liveIndexes = new Set(streamingCells.map(cell => cell.index))
  return <div className={css.root} data-trajectory-story="">
    <header className={css.overview}>
      <div><p className={css.eyebrow} role="status"><span className={css.statusDot} data-active={active || undefined} />{t(active ? 'story.working' : 'story.recorded')}</p>
        <h2>{t('story.title')}</h2><p className={css.intro}>{t('story.intro')}</p></div>
      <div className={css.count}><strong>{actions.toString().padStart(2, '0')}</strong><span>{t('story.actions')}</span></div>
    </header>
    <div className={css.searchRow}><label>{t('toolbar.search')}<input type="search" aria-label={t('toolbar.search')} placeholder={t('story.search')} value={query} onChange={(event) => { setQuery(event.target.value) }} /></label></div>
    <div className={css.feed}>
      {visible.length === 0 && <p className={css.empty}>{t(query.trim() === '' ? 'story.empty' : 'story.noMatches')}</p>}
      {visible.map(section => <section className={css.turn} key={section.turn ?? 'between'}>
        <div className={css.turnLabel}>{section.turn === null ? t('section.betweenTurns') : t('turn.label', { turn: section.turn })}</div>
        <ol className={css.steps}>{section.cells.map((cell) => {
          const isUser = cell.kind === 'user'
          const isTool = cell.kind === 'tool' || cell.kind === 'subtool'
          const running = liveIndexes.has(cell.index) || (cell.callId !== undefined && runningCallIds.has(cell.callId))
          const missingResult = isTool && !running && !cell.isError
            && cell.result === undefined && cell.outputDetail === undefined && cell.timeSeconds === null
          const text = body(cell)
          return <li key={trajectoryRecordId(cell)} className={css.step} data-user={isUser || undefined}
            data-error={cell.isError || undefined} data-running={running || undefined}>
            <span className={css.marker} aria-hidden="true">{
              isUser ? <span className={css.userMark} /> : running ? <span className={css.pulse} />
                : cell.isError ? '!' : missingResult ? '·' : <IconCheckOutlineRegular />
            }</span>
            <article className={css.content}>
              <div className={css.stepHeading}><h3>{(isTool ? actionDescription(cell) : undefined) ?? t(isUser ? 'story.request' : isTool ? 'story.action' : 'story.reply')}</h3>
                {!isUser && <span className={css.state}>{t(
                  cell.isError ? 'status.failed' : running ? 'story.working' : missingResult ? 'story.noResult' : 'status.completed',
                )}</span>}
                {cell.timeSeconds !== null && !isUser && <span className={css.duration}>{
                  formatElapsedSeconds(cell.timeSeconds, t)
                }</span>}</div>
              {isTool && <p className={css.toolName}>{cell.toolName ?? cell.text}</p>}
              {text !== '' && <p className={css.preview}>{trajectoryPreviewText(text)}</p>}
              {text !== '' && <details className={css.expansion}><summary>{t('story.content')}</summary><div className={css.fullText}>{text}</div></details>}
              <button className={css.inspect} onClick={() => { inspect(cell.index) }}>{t('story.inspect')}<IconChevronRightOutlineRegular aria-hidden="true" /></button>
            </article>
          </li>
        })}</ol>
      </section>)}
      {query.trim() === '' && (sections.length > visibleTurns || hasOlder) && <button className={css.earlier} disabled={loading} onClick={() => {
        if (sections.length > visibleTurns) setVisibleTurns(value => value + 6)
        else void loadOlder().then((loaded) => { if (loaded) setVisibleTurns(value => value + 6) })
      }}>{t('story.earlier')}</button>}
    </div>
  </div>
}
