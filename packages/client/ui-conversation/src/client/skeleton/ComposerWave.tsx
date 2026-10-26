import { useId } from 'react'
import css from './ComposerWave.module.css'

/** Decorative focus feedback; the editor and its selection remain in their original DOM. */
export function ComposerWave() {
  const gradient = useId()
  return <div className={css.root} data-composer-wave aria-hidden="true">
    <span className={css.surface} data-composer-wave-surface />
    <svg className={css.edge} viewBox="0 0 1000 200" preserveAspectRatio="none">
      <defs><linearGradient id={gradient}>
        <stop className={css.start} />
        <stop className={css.middle} offset=".5" />
        <stop className={css.end} offset="1" />
      </linearGradient></defs>
      <path className={css.line} />
      <path className={css.light} pathLength="1000" style={{ stroke: `url(#${gradient})` }} />
    </svg>
  </div>
}
