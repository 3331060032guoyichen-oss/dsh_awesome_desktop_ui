import { useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { readStudioTime, setStudioTime, subscribeStudioTime } from '../studio-time.ts'
import css from './StudioTimeRow.module.css'

/** The desktop's manual lighting control lives exclusively in General Settings. */
export function StudioTimeRow({ t }: PropsLocale<'conversation'>) {
  const manual = useSyncExternalStore(subscribeStudioTime, readStudioTime)
  if (document.documentElement.dataset.desktopStudio !== 'true') return null
  const now = new Date()
  const hour = manual ?? now.getHours() + now.getMinutes() / 60
  const minutes = Math.floor(hour * 60)
  return <div className={css.row}>
    <label className={css.label}>
      <span>{t('studio.time')}</span>
      <input type="range" aria-label={t('studio.time')} min="0" max="23.99" step="0.1" value={hour}
        onChange={(event) => { setStudioTime(Number(event.target.value)) }} />
      <output>{`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`}</output>
    </label>
    <button type="button" aria-pressed={manual === null} onClick={() => { setStudioTime(null) }}>{t('studio.local')}</button>
  </div>
}
