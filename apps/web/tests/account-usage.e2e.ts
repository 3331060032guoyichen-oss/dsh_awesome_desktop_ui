/** Real settings composition with explicit account and statistics endpoint doubles. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it, onTestFinished, vi } from 'vitest'
import type { AccountView } from '@deepseek-ai/dsh-deepseek-account/types'
import { launchWebScaffold } from './scaffold.ts'
import { openSettings, ZH_BROWSER_LOCALE } from './support.ts'

it('renders the branded usage dashboard and navigates daily usage without horizontal clipping', async () => {
  const scaffold = await launchWebScaffold({})
  onTestFinished(() => scaffold.close())
  await scaffold.ctx.settings.mutate('ui-settings-account', [
    { op: 'set', path: ['step'], value: 'done' }, { op: 'set', path: ['completion'], value: 'completed' },
  ])
  const state: AccountView = { status: 'credential-stored', attempt: null,
    links: { usageUrl: 'https://platform.deepseek.com/usage', topUpUrl: 'https://platform.deepseek.com/top_up' } }
  const provider = scaffold.ctx.deepseekAccount
  const mocks = [vi.spyOn(provider, 'getState').mockResolvedValue(state),
    vi.spyOn(provider, 'getProfile').mockResolvedValue({ status: 'ready', value: { id: null, name: 'Usage example', contact: null } }),
    vi.spyOn(provider, 'getBalance').mockResolvedValue({ status: 'ready', value: [{ currency: 'CNY', balance: '5.16' }], bonusWallets: [] }),
    vi.spyOn(provider, 'watch').mockImplementation(async function* (signal) {
      yield state
      if (!signal.aborted) await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true }))
    })]
  onTestFinished(() => mocks.forEach(mock => mock.mockRestore()))
  const browser = await chromium.launch()
  onTestFinished(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: ZH_BROWSER_LOCALE })
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  await page.route('**/api/usage-stats/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const value = path.endsWith('/providers') ? { providers: [{ id: 'deepseek-account', displayName: 'DeepSeek' }] }
      : path.endsWith('/account') ? { account: { status: 'ok', balance: { remaining: 5.16, currency: 'CNY' } } }
        : { updatedAt: Date.now(), days: [{ date, tokens: 1234567, inputTokens: 100, cacheReadTokens: 900, cacheWriteTokens: 0 }] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ...value }) })
  })
  await page.goto(scaffold.authenticatedUrl)
  await openSettings(page, 'zh')
  await page.getByRole('button', { name: '账号与余额', exact: true }).click()
  await page.evaluate(() => { document.documentElement.dataset.desktopStudio = 'true' })
  const dashboard = page.locator('[data-account-usage]')
  await dashboard.getByText('90.0%', { exact: true }).waitFor()
  expect(await dashboard.getByText('1,234,567', { exact: true }).count()).toBe(3)
  const artifacts = process.env.DSH_STUDIO_ARTIFACT_DIR
  if (artifacts !== undefined) { mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: join(artifacts, 'studio-account-usage.png') }) }
  const day = dashboard.getByRole('button', { name: `${date} · 1,234,567 Token`, exact: true })
  await day.click()
  expect(await day.getAttribute('aria-pressed')).toBe('true')
  await dashboard.getByRole('button', { name: '上个月', exact: true }).click()
  expect(await dashboard.getByText('1,234,567', { exact: true }).count()).toBe(2)
  await dashboard.getByRole('button', { name: '下个月', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await dashboard.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
}, 90_000)
