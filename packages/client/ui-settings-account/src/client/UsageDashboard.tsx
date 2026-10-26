/** Account analytics presentation; query ownership is supplied by the account entry. */
import { useEffect, useState } from 'react'
import { Button, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { AccountKey } from './locales.ts'
import { usageDate, type UsageReport, type UsageAccount } from './usage-report.ts'
import css from './UsageDashboard.module.css'

export interface UsageDashboardProps {
  t: (key: AccountKey) => string
  load: (signal: AbortSignal) => Promise<UsageReport>
  loadAccount: (provider: string, signal: AbortSignal) => Promise<UsageAccount>
  refreshAccount: () => Promise<void>
}
/** @param props - localized labels and cancellable read operations. @returns monthly usage dashboard. */
export function UsageDashboard({ t, load, loadAccount, refreshAccount }: UsageDashboardProps) {
  const [report, setReport] = useState<UsageReport>()
  const [failed, setFailed] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState('deepseek-account')
  const [account, setAccount] = useState<UsageAccount>()
  const [menu, setMenu] = useState(false)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState<string>()
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setFailed(false)
    void load(controller.signal).then((value) => {
      if (!controller.signal.aborted) setReport(value)
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [load, refresh])
  useEffect(() => {
    const controller = new AbortController()
    setAccount(undefined)
    void loadAccount(provider, controller.signal).then((value) => {
      if (!controller.signal.aborted) setAccount(value)
    }).catch(() => { if (!controller.signal.aborted) setAccount({ status: 'unavailable' }) })
    return () => controller.abort()
  }, [loadAccount, provider, refresh])
  const today = usageDate(new Date())
  const monthKey = usageDate(month).slice(0, 7)
  const days = report?.days ?? []
  const monthDays = days.filter(day => day.date.startsWith(monthKey))
  const todayUsage = days.find(day => day.date === today)
  const total = days.reduce((sum, day) => sum + day.tokens, 0)
  const monthTotal = monthDays.reduce((sum, day) => sum + day.tokens, 0)
  const prompt = todayUsage ? todayUsage.inputTokens + todayUsage.cacheReadTokens + todayUsage.cacheWriteTokens : 0
  const format = (number: number) => new Intl.NumberFormat(document.documentElement.lang || undefined).format(number)
  const value = (number: number) => report === undefined || failed ? '—' : format(number)
  const peak = Math.max(1, ...monthDays.map(day => day.tokens))
  const start = (month.getDay() + 6) % 7
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const providerLabel = report?.providers.find(item => item.id === provider)?.displayName ?? t('usageProviderName')
  const currency = account?.currency === 'CNY' ? '¥' : account?.currency === 'USD' ? '$' : account?.currency ?? ''
  const money = (amount: number | undefined) => amount === undefined ? '—' : `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
  const moveMonth = (offset: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1)); setSelected(undefined) }
  return <div className={css.dashboard} data-account-usage>
    <div className={css.heading}><div><h3>{t('usageTitle')}</h3><p>{t('usageScope')}</p></div>
      <Button variant="outline" disabled={loading} onClick={() => { setRefresh(value => value + 1); void refreshAccount().catch(() => {}) }}>{loading ? t('loading') : t('usageRefresh')}</Button>
    </div>
    <div className={css.providerRow}><span>{t('usageProvider')}</span>
      <Menu open={menu} portal autoFocus onClose={() => setMenu(false)}
        anchor={<button className={css.provider} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>{providerLabel}<span aria-hidden>⌄</span></button>}
        items={(report?.providers ?? [{ id: 'deepseek-account', displayName: t('usageProviderName') }]).map(item => ({ id: item.id, label: item.displayName }))}
        onSelect={(id) => { setProvider(id); setMenu(false) }} />
    </div>
    {(account?.used !== undefined || account?.total !== undefined || provider !== 'deepseek-account') && <div className={css.accountMetrics}>
      {account?.used !== undefined && <div><span>{t('usageUsed')}</span><strong>{money(account.used)}</strong></div>}
      {account?.total !== undefined && <div><span>{t('usageTotal')}</span><strong>{money(account.total)}</strong></div>}
      {provider !== 'deepseek-account' && <div><span>{t('usageAvailable')}</span><strong>{money(account?.status === 'ok' ? account.remaining : undefined)}</strong></div>}
    </div>}
    <div className={css.stats}>
      {[['usageToday', todayUsage?.tokens ?? 0], ['usageMonth', monthTotal], ['usageAll', total]].map(([key, number]) =>
        <div className={css.stat} key={key}><span>{t(key as AccountKey)}</span><strong>{value(Number(number))}</strong><small>{t('usageTokenUnit')}</small></div>)}
    </div>
    <div className={css.cache}><span>{t('usageCache')}</span><strong>{report === undefined || failed || prompt === 0 ? '—' : `${(100 * (todayUsage?.cacheReadTokens ?? 0) / prompt).toFixed(1)}%`}</strong></div>
    <div className={css.calendarHeading}><h3>{t('usageDaily')}</h3><div>
      <button aria-label={t('usagePrevious')} onClick={() => moveMonth(-1)}>‹</button>
      <strong>{new Intl.DateTimeFormat(document.documentElement.lang || undefined, { year: 'numeric', month: 'long' }).format(month)}</strong>
      <button aria-label={t('usageNext')} onClick={() => moveMonth(1)}>›</button>
    </div></div>
    {failed && <p role="status" className={css.notice}>{t('usageFailed')}</p>}
    <div className={css.calendar} aria-label={t('usageDaily')}>
      {Array.from({ length: 7 }, (_, i) => <span className={css.weekday} key={`week-${i}`}>{new Intl.DateTimeFormat(document.documentElement.lang || undefined, { weekday: 'short' }).format(new Date(2026, 5, 1 + i))}</span>)}
      {Array.from({ length: start }, (_, i) => <span key={`space-${i}`} />)}
      {Array.from({ length }, (_, index) => {
        const date = `${monthKey}-${String(index + 1).padStart(2, '0')}`
        const tokens = days.find(day => day.date === date)?.tokens ?? 0
        const future = date > today
        const level = report === undefined || failed || tokens === 0 ? 0 : Math.min(4, Math.ceil(tokens / peak * 4))
        const label = `${date} · ${value(tokens)} ${t('usageTokenUnit')}`
        return <button key={date} data-level={level} data-today={date === today} aria-pressed={selected === date}
          disabled={future || report === undefined || failed} title={label}
          aria-label={label} onClick={() => setSelected(date)}>{index + 1}</button>
      })}
    </div>
    <div className={css.legend}><span>{t('usageLess')}</span>{[0, 1, 2, 3, 4].map(level => <i key={level} data-level={level} />)}<span>{t('usageMore')}</span></div>
    <p className={css.selection} aria-live="polite">{selected ? `${selected} · ${value(days.find(day => day.date === selected)?.tokens ?? 0)} ${t('usageTokenUnit')}` : t('usageSelectDay')}</p>
    {report && <p className={css.note}>{t('usageUpdated')} {new Date(report.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}{failed ? ` · ${t('usageStale')}` : ''}</p>}
  </div>
}
