/** Desktop effort gestures persist through the shipped directory, without model calls. */
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { expect, it } from 'vitest'
import { launchWebScaffold, watchConsole } from './scaffold.ts'
import { connectFreshWorkspaceZh, ZH_BROWSER_LOCALE } from './support.ts'

it('saves a desktop effort gesture and keeps its menu usable at narrow widths', async () => {
  const scaffold = await launchWebScaffold({ extraOverlayPath: fileURLToPath(new URL('./declared-reasoning.overlay.yml', import.meta.url)) })
  const browser = await chromium.launch()
  try {
    await scaffold.ctx.settings.update('llm-pi-ai', { providers: { 'acme-gateway': {
      displayName: 'Acme Gateway', api: 'openai-completions', baseURL: 'https://gateway.acme.example/v1',
      models: [{ id: 'acme-think', name: 'Acme Think', reasoningEfforts: { off: null, high: 'high', max: 'ultra' } }],
    } } })
    const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, locale: ZH_BROWSER_LOCALE })
    const errors = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl)
    await connectFreshWorkspaceZh(page, scaffold.workspaceCwd)
    await page.addInitScript(() => {
      const mark = (): boolean => {
        if (document.documentElement === null) return false
        document.documentElement.dataset.desktopStudio = 'true'
        return true
      }
      if (!mark()) {
        const observer = new MutationObserver(() => { if (mark()) observer.disconnect() })
        observer.observe(document, { childList: true })
      }
    })
    await page.reload()
    await page.getByRole('button', { name: /我们一起做些什么呢/ }).click()
    await page.getByRole('button', { name: '← 返回书桌' }).waitFor()
    const trigger = page.getByRole('button', { name: /^选择模型/ })
    await trigger.click()
    const slider = page.getByRole('slider', { name: '推理等级', exact: true })
    await slider.focus()
    await slider.press('End')
    await expect.poll(() => scaffold.ctx.agentDefaultModel.currentSelection().reasoningEffort).toBe('max')
    await expect.poll(() => slider.getAttribute('aria-valuetext')).toBe('Max')
    expect(await slider.isVisible()).toBe(true)
    const decoration = slider.locator('..').locator('i').first()
    const peakDuration = await decoration.evaluate(element => Number.parseFloat(getComputedStyle(element).animationDuration))
    await slider.press('ArrowLeft')
    await expect.poll(() => scaffold.ctx.agentDefaultModel.currentSelection().reasoningEffort).toBe('high')
    const highDuration = await decoration.evaluate(element => Number.parseFloat(getComputedStyle(element).animationDuration))
    expect(peakDuration).toBeLessThan(highDuration)
    await slider.press('End')
    await expect.poll(() => scaffold.ctx.agentDefaultModel.currentSelection().reasoningEffort).toBe('max')
    const pointerBounds = await slider.boundingBox()
    if (pointerBounds === null) throw new Error('effort slider must be visible')
    await slider.click({ position: { x: pointerBounds.width - 13, y: pointerBounds.height / 2 } })
    const artifacts = process.env.DSH_STUDIO_ARTIFACT_DIR
    if (artifacts !== undefined) {
      mkdirSync(artifacts, { recursive: true })
      await page.screenshot({ path: join(artifacts, 'desktop-effort.png') })
      const card = await page.getByRole('menu').boundingBox()
      if (card === null) throw new Error('effort panel must be visible')
      await page.screenshot({ path: join(artifacts, 'desktop-effort-detail.png'), clip: {
        x: card.x - 24, y: card.y - 36, width: card.width + 48, height: card.height + 60,
      } })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    const bounds = await slider.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await decoration.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    await slider.press('Home')
    await slider.press('ArrowRight')
    await expect.poll(() => scaffold.ctx.agentDefaultModel.currentSelection().reasoningEffort).toBe('off')
    await page.keyboard.press('Escape')
    await expect.poll(() => slider.count()).toBe(0)
    expect(errors.pageErrors).toEqual([])
  } finally {
    await browser.close()
    await scaffold.close()
  }
}, 120_000)
