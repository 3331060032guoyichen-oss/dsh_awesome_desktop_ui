/** Read-only integration with dsh-usage-stats. No credentials cross this boundary. */
export interface UsageDay { date: string; tokens: number; inputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }
/** Validated daily usage and configured provider identities. */
export interface UsageReport {
  days: UsageDay[]
  updatedAt: number
  providers: { id: string; displayName: string }[]
}
/** Provider account status and available balance amounts. */
export interface UsageAccount {
  status: string
  remaining?: number | undefined
  used?: number | undefined
  total?: number | undefined
  currency?: string
}
function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid usage response')
  return value as Record<string, unknown>
}
function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid usage count')
  return value
}
async function read(path: string, signal: AbortSignal): Promise<Record<string, unknown>> {
  const response = await fetch(path, { signal, cache: 'no-store', headers: {
    accept: 'application/json', 'x-dsh-usage-stats-client-locale': document.documentElement.lang || navigator.language,
    'x-dsh-usage-stats-timezone-offset': String(-new Date().getTimezoneOffset() * 60),
  } })
  if (!response.ok) throw new Error('Usage service unavailable')
  const value = record(await response.json())
  if (value['ok'] !== true) throw new Error('Usage query failed')
  return value
}
/** Read daily usage and configured providers from the local service.
 * @param signal - View lifetime.
 * @returns Validated daily usage and providers.
 */
export async function loadUsageReport(signal: AbortSignal): Promise<UsageReport> {
  const [usage, providers] = await Promise.all([
    read('/api/usage-stats/usage', signal), read('/api/usage-stats/providers', signal),
  ])
  if (!Array.isArray(usage['days']) || !Array.isArray(providers['providers'])) throw new Error('Invalid usage report')
  return {
    updatedAt: count(usage['updatedAt']),
    days: usage['days'].map((item: unknown) => {
      const day = record(item)
      if (typeof day['date'] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day['date'])) throw new Error('Invalid usage date')
      return { date: day['date'], tokens: count(day['tokens']), inputTokens: count(day['inputTokens']),
        cacheReadTokens: count(day['cacheReadTokens']), cacheWriteTokens: count(day['cacheWriteTokens']) }
    }),
    providers: providers['providers'].map((item: unknown) => {
      const provider = record(item)
      if (typeof provider['id'] !== 'string' || typeof provider['displayName'] !== 'string') throw new Error('Invalid provider')
      return { id: provider['id'], displayName: provider['displayName'] }
    }),
  }
}
/** Read provider account amounts from the local service.
 * @param provider - Configured provider ID.
 * @param signal - View lifetime.
 * @returns Validated account status and available amounts.
 */
export async function loadUsageAccount(provider: string, signal: AbortSignal): Promise<UsageAccount> {
  const result = await read(`/api/usage-stats/account?provider=${encodeURIComponent(provider)}&activity=detail`, signal)
  const account = record(result['account'])
  if (typeof account['status'] !== 'string') throw new Error('Invalid account status')
  const balance = account['balance'] === undefined || account['balance'] === null ? {} : record(account['balance'])
  const amount = (key: string) => typeof balance[key] === 'number' && Number.isFinite(balance[key]) ? balance[key] : undefined
  return { status: account['status'], ...amount('remaining') === undefined ? {} : { remaining: amount('remaining') },
    ...amount('used') === undefined ? {} : { used: amount('used') }, ...amount('total') === undefined ? {} : { total: amount('total') },
    ...typeof balance['currency'] === 'string' ? { currency: balance['currency'] } : {} }
}
/** Format a day in the statistics service's local calendar.
 * @param date - Local date to format.
 * @returns Calendar date in YYYY-MM-DD form.
 */
export function usageDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
