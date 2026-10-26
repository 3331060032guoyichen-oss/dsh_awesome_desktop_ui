import { useState, type CSSProperties } from 'react'
import css from './EffortSlider.module.css'

/** A draft gesture commits once on release; choices remain provider-owned. */
export function EffortSlider({ labels, value, label, modelLabel, disabled, onCommit, onModel, onEffort }: {
  labels: readonly string[]
  value: number
  label: string
  modelLabel: string
  disabled: boolean
  onCommit: (index: number) => void
  onModel: () => void
  onEffort: () => void
}) {
  const [draft, setDraft] = useState<number | null>(null)
  const index = draft ?? value
  const progress = index / Math.max(1, labels.length - 1)
  const commit = (): void => {
    if (draft !== null && draft !== value) onCommit(draft)
    setDraft(null)
  }
  return <div className={css.root} data-energy={progress === 1 ? 'peak' : progress >= .5 ? 'high' : 'low'}
    style={{ '--effort-fill': `${progress * 100}%`, '--effort-duration': `${7 - progress * 5}s` } as CSSProperties}>
    <svg className={css.bolt} viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2 5 14h6l-1 8 9-13h-6z" fill="currentColor" /></svg>
    <button type="button" className={css.heading} onClick={onEffort} aria-label={`${label}: ${labels[index]}`}>{labels[index]}</button>
    <button type="button" className={css.model} onClick={onModel}>{modelLabel}<span aria-hidden="true">⌄</span></button>
    <div className={css.control}>
      <div className={css.track} aria-hidden="true"><div className={css.fill}>
        {Array.from({ length: 24 }, (_, n) => <i key={n} style={{
          '--star': n, '--x': `${(n * 37 + 7) % 97}%`, '--y': `${(n * 19 + 13) % 83}%`,
        } as CSSProperties} />)}
      </div></div>
      <input type="range" min={0} max={labels.length - 1} step={1} value={index}
        aria-label={label} aria-valuetext={labels[index]} disabled={disabled}
        onChange={(event) => { setDraft(Number(event.target.value)) }}
        onPointerUp={commit} onPointerCancel={() => { setDraft(null) }} onBlur={commit}
        onKeyDown={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation()
        }}
        onKeyUp={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) commit()
        }} />
    </div>
    <div className={css.ticks} aria-hidden="true">{labels.map((text, n) => <span key={n} title={text} data-selected={n <= index} style={{ left: `${n / (labels.length - 1) * 100}%` }} />)}</div>
  </div>
}
