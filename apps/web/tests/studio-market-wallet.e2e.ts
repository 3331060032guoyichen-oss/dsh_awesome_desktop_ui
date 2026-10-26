import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { expect, it, vi } from 'vitest'
import { launchWebScaffold } from './scaffold.ts'
import { newEnglishPage, openSettings, saveFailureShot } from './support.ts'

it('searches the three market scopes and opens the branded model wallet on each visit', async () => {
  vi.stubEnv('OPENAI_API_KEY', 'wallet-fixture-key')
  const directory = mkdtempSync(join(tmpdir(), 'dsh-market-wallet-'))
  const index = { format: 1, title: 'Community fixture', plugins: [{ name: 'dsh-usage-stats', title: 'Usage statistics',
    description: 'Provider balances and token usage.', versions: [{ version: '1.0.0', publishTimestamp: 1, source: { type: 'npm' } }] }] }
  const server = createServer((_request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(index)) })
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('fixture must bind a port')
  const overlay = join(directory, 'market.yml')
  writeFileSync(overlay, `- id: plugin-market\n  config:\n    indexes: ["http://127.0.0.1:${address.port}/index.json"]\n`)
  const scaffold = await launchWebScaffold({ profile: { packages: [{ dir: fileURLToPath(new URL('../../../packages/experimental/plugin-market-bundle', import.meta.url)), enabled: true }] }, extraOverlayPath: overlay })
  await scaffold.ctx.settings.mutate('llm-pi-ai', [{ op: 'set', path: ['providers', 'openai'],
    value: { models: [{ id: 'gpt-6-astra', name: 'GPT-6 Astra', contextWindow: 272000, maxTokens: 128000 }] } }])
  const browser = await chromium.launch()
  const page = await newEnglishPage(browser)
  try {
    await page.goto(scaffold.authenticatedUrl)
    await openSettings(page, 'en')
    await page.evaluate(() => { document.documentElement.dataset.desktopStudio = 'true' })
    const dialog = page.getByRole('dialog', { name: 'Settings', exact: true })
    await dialog.getByRole('button', { name: 'Plugin market', exact: true }).click()
    const navigation = dialog.locator('[data-market-navigation]')
    expect(await navigation.getByRole('tab').allTextContents()).toEqual(['Third-party plugins', 'Session plugins', 'Global plugins'])
    await dialog.getByRole('button', { name: 'View Usage statistics', exact: true }).waitFor()
    const search = dialog.getByRole('searchbox', { name: 'Search plugins', exact: true })
    expect(await search.count()).toBe(1)
    expect((await search.boundingBox())!.y).toBeLessThan((await navigation.boundingBox())!.y)
    await search.fill('no-such-plugin')
    await expect.poll(() => dialog.locator('[data-market-entry]').count()).toBe(0)
    await navigation.getByRole('tab', { name: 'Session plugins', exact: true }).click()
    expect(await dialog.locator('[data-plugin-scope="global"]').count()).toBe(0)
    expect(await search.inputValue()).toBe('no-such-plugin')
    await navigation.getByRole('tab', { name: 'Global plugins', exact: true }).click()
    await search.fill('')
    await dialog.locator('[data-plugin-scope="global"]').waitFor()
    await navigation.getByRole('tab', { name: 'Third-party plugins', exact: true }).click()
    await dialog.getByRole('button', { name: 'View Usage statistics', exact: true }).waitFor()
    const artifacts = process.env.DSH_STUDIO_ARTIFACT_DIR
    if (artifacts !== undefined) { mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: join(artifacts, 'studio-plugin-market.png') }) }
    await dialog.getByRole('button', { name: 'General', exact: true }).click()
    await dialog.getByRole('button', { name: 'Dark', exact: true }).click()
    await expect.poll(() => page.locator('body').getAttribute('data-ds-dark-theme')).toBe('')
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--dsw-alias-bg-base').trim())).toBe('#111a33')
    await page.emulateMedia({ colorScheme: 'light' })
    expect(await page.locator('body').getAttribute('data-ds-dark-theme')).toBe('')
    await dialog.getByRole('button', { name: 'System', exact: true }).click()
    await expect.poll(() => page.locator('body').getAttribute('data-ds-dark-theme')).toBeNull()
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(() => page.locator('body').getAttribute('data-ds-dark-theme')).toBe('')
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'studio-dark-settings.png') })
    await dialog.getByRole('button', { name: 'Light', exact: true }).click()
    await expect.poll(() => page.locator('body').getAttribute('data-ds-dark-theme')).toBeNull()
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--dsw-alias-bg-base').trim())).toBe('#e9e2d2')
    await dialog.getByRole('button', { name: 'Models', exact: true }).click()
    const wallet = dialog.locator('[data-model-wallet]')
    await wallet.waitFor()
    await dialog.locator('[data-model-pass]').first().waitFor()
    expect(await wallet.locator('img').getAttribute('src')).toBe('/assets/studio-whale-seal.png')
    expect(await wallet.evaluate(el => el.getAnimations({ subtree: true })
      .some(animation => animation instanceof CSSAnimation && animation.animationName.includes('modelPassReveal')))).toBe(true)
    // Scrub the real CSS timeline: desktop lock/background throttling must not
    // turn an entrance verification into a wall-clock scheduling assertion.
    const motion = await wallet.evaluate((el) => {
      const card = el.querySelector('[data-model-pass]')!
      const animations = el.getAnimations({ subtree: true })
        .filter(animation => animation instanceof CSSAnimation && /modelPassReveal|walletUnfold/.test(animation.animationName))
      const entrance = animations.find(animation => (animation as CSSAnimation).animationName.includes('modelPassReveal'))!
      entrance.pause(); entrance.currentTime = 0
      const start = getComputedStyle(card).transform
      const timing = entrance.effect!.getTiming()
      entrance.currentTime = Number(timing.delay) + Number(timing.duration) / 2
      const middle = getComputedStyle(card).transform
      for (const animation of animations) animation.finish()
      return { start, middle, end: getComputedStyle(card).transform }
    })
    expect(motion.start).not.toBe(motion.middle)
    expect(motion.end).toBe('matrix(1, 0, 0, 1, 0, 0)')
    await wallet.locator('img').evaluate(img => (img as HTMLImageElement).decode())
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'studio-model-wallet.png') })
    await dialog.getByRole('button', { name: 'General', exact: true }).click()
    await dialog.getByRole('button', { name: 'Models', exact: true }).click()
    expect(await wallet.evaluate(el => el.getAnimations({ subtree: true })
      .some(animation => animation instanceof CSSAnimation && animation.animationName.includes('modelPassReveal')))).toBe(true)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await wallet.evaluate(el => el.getAnimations({ subtree: true })
      .filter(animation => animation instanceof CSSAnimation
        && /modelPassReveal|walletUnfold/.test(animation.animationName)).length)).toBe(0)
    await dialog.getByRole('button', { name: 'General', exact: true }).click()
    await dialog.getByRole('button', { name: 'Dark', exact: true }).click()
    await dialog.getByRole('button', { name: 'Models', exact: true }).click()
    await wallet.locator('img').evaluate(img => (img as HTMLImageElement).decode())
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'studio-dark-model-wallet.png') })
  } catch (error) { await saveFailureShot(page, 'studio-market-wallet'); throw error }
  finally {
    await browser.close()
    await scaffold.close()
    await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
    rmSync(directory, { recursive: true, force: true })
    vi.unstubAllEnvs()
  }
}, 120_000)
