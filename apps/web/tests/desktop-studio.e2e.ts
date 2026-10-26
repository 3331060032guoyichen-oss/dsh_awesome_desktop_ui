/** Desktop presentation against the real built client and a keyless Session. */
import { fileURLToPath } from 'node:url'
import { mkdirSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { chromium, type Page } from 'playwright'
import { LlmAdapter, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { expect, it } from 'vitest'
import { compareOrRefreshGolden, launchWebScaffold, seedSession, watchConsole, webSnapshotMode } from './scaffold.ts'
import { createChatScrollFixture } from './chat-scroll-fixture.ts'
import { connectFreshWorkspace, newEnglishPage, openSettings, saveFailureShot, writeComposerDraft } from './support.ts'

class StudioPausedAdapter extends LlmAdapter {
  started=false
  readonly arrived=Promise.withResolvers<undefined>()
  readonly release=Promise.withResolvers<undefined>()
  override async listModels(provider:string) { return [{ provider,id:'paused',name:'Studio preview' }] }
  override async *stream(options:GenerateOptions):AsyncIterable<StreamChunk> {
    yield { type:'block-start',index:0,blockType:'reasoning' }
    yield { type:'reasoning-delta',index:0,text:'Inspecting the desktop conversation.' }
    this.started=true
    this.arrived.resolve(undefined)
    await this.release.promise
    options.signal?.throwIfAborted()
    yield { type:'block-end',index:0,block:{ type:'reasoning',text:'Inspecting the desktop conversation.' } }
    yield { type:'block-start',index:1,blockType:'text' }
    yield { type:'text-delta',index:1,text:'Desktop inspection complete.' }
    yield { type:'block-end',index:1,block:{ type:'text',text:'Desktop inspection complete.' } }
    yield { type:'finish',reason:{ kind:'stop' } }
  }
}

it('enters a resident letter, preserves its draft, and opens the same Session trajectory', async () => {
  const scaffold = await launchWebScaffold({})
  mkdirSync(join(scaffold.workspaceCwd, 'Hook sample'), { recursive: true })
  writeFileSync(join(scaffold.workspaceCwd, 'Hook sample', 'hook-notes.md'), '# File rail preview\n')
  for (let index = 0; index < 40; index++) writeFileSync(join(scaffold.workspaceCwd, `rail-example-${index}.txt`), 'Fixture file\n')
  const adapter=new StudioPausedAdapter()
  scaffold.ctx.effect(() => scaffold.ctx.llm.registerAdapter(['studio-preview-test'],adapter))
  await scaffold.ctx.agentDefaultModel.saveSelection({ provider:'studio-preview-test',model:'paused' })
  const fixture = createChatScrollFixture({ markerPrefix: 'SWISS_STUDIO', title: 'Swiss trajectory review', turns: 8 })
  await seedSession(scaffold, fixture.log.replaceAll('deepseek-official','studio-preview-test').replaceAll('deepseek-v4-flash','paused'), 'swiss-studio-review')
  const browser = await chromium.launch()
  let failurePage: Page | undefined
  try {
    const page = await newEnglishPage(browser, 900)
    failurePage = page
    page.setDefaultTimeout(20_000)
    const console = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl)
    await connectFreshWorkspace(page, dirname(scaffold.workspaceCwd), basename(scaffold.workspaceCwd))
    await page.addInitScript(() => {
      const mark = (): boolean => {
        if (document.documentElement === null) return false
        document.documentElement.dataset.desktopStudio = 'true'
        document.documentElement.dataset.windowsTitlebar = 'true'
        document.documentElement.style.setProperty('--dsh-windows-titlebar-height', '40px')
        return true
      }
      if (!mark()) {
        const observer = new MutationObserver(() => { if (mark()) observer.disconnect() })
        observer.observe(document, { childList: true })
      }
    })
    await page.reload({ waitUntil: 'commit' })
    const opening = page.locator('[data-studio-opening]')
    expect((await page.request.get(new URL('/assets/studio-whale-seal.png', page.url()).href)).status()).toBe(200)
    await opening.waitFor()
    const openingBounds = await opening.boundingBox()
    expect(openingBounds).toEqual({ x: 0, y: 0, width: 1680, height: 900 })
    expect(await opening.evaluate(() => [[2, 2], [1678, 2], [2, 898], [1678, 898]].every(([x, y]) =>
      Boolean(document.elementFromPoint(x!, y!)?.closest('[data-studio-opening]'))))).toBe(true)
    expect(await opening.evaluate(() => {
      const menu = document.createElement('div')
      menu.dataset.windowsMenu = ''
      document.body.append(menu)
      const hidden = getComputedStyle(menu).visibility === 'hidden'
      menu.remove()
      return hidden
    })).toBe(true)
    expect(await opening.locator('[data-studio-seal-piece]').count()).toBe(4)
    const initialPositions = await opening.locator('[data-studio-seal]').evaluate((seal) => {
      const bounds = seal.getBoundingClientRect()
      return [...seal.querySelectorAll<SVGGElement>('[data-studio-seal-piece]')].map((piece) => {
        const name = piece.dataset.studioSealPiece!
        const center = new DOMPoint(name.endsWith('West') ? 313.5 : 940.5, name.startsWith('north') ? 313.5 : 940.5).matrixTransform(piece.getScreenCTM()!)
        const position = `${center.y < bounds.top + bounds.height / 2 ? 'north' : 'south'}${center.x < bounds.left + bounds.width / 2 ? 'West' : 'East'}`
        return { name, position }
      })
    })
    expect(initialPositions.every(piece => piece.name !== piece.position)).toBe(true)
    expect(new Set(initialPositions.map(piece => piece.position)).size).toBe(4)
    expect(await page.locator('[data-composer-seat]').first().isVisible()).toBe(false)
    const openingArtifacts = process.env.DSH_STUDIO_ARTIFACT_DIR
    if (openingArtifacts !== undefined) {
      mkdirSync(openingArtifacts, { recursive: true })
      await page.screenshot({ path: join(openingArtifacts, 'desktop-whale-registration.png') })
    }
    await expect.poll(() => opening.evaluate(el => Number((el as HTMLElement).style.getPropertyValue('--studio-registration-offset'))), { timeout: 5000 }).toBeLessThan(.001)
    if (openingArtifacts !== undefined) await page.screenshot({ path: join(openingArtifacts, 'desktop-whale-aligned.png') })
    await expect.poll(() => opening.getAttribute('data-progress')).toMatch(/^0\.[89]/)
    expect(await page.locator('[data-mode="intro"][data-period]').boundingBox()).toEqual({ x: 0, y: 0, width: 1680, height: 900 })
    if (openingArtifacts !== undefined) await page.screenshot({ path: join(openingArtifacts, 'desktop-opening-edge-cover.png') })
    const paper = page.getByRole('button', { name: /What shall we work on together/ })
    await paper.waitFor()
    expect(await opening.count()).toBe(0)
    expect((await page.request.get(new URL('/assets/desktop-studio-scene.png', page.url()).href)).status()).toBe(200)
    const scene = page.locator('[data-mode="scene"][data-period]')
    expect(await scene.getAttribute('data-idle-active')).toBe('')
    await expect.poll(() => scene.getAttribute('data-idle-hair'), { timeout: 14_000 }).toMatch(/left|right/)
    const sceneBounds = await scene.boundingBox()
    if (sceneBounds === null) throw new Error('desktop scene must be visible')
    const depthX = (): Promise<number> => scene.evaluate(element => Number.parseFloat(element.style.getPropertyValue('--studio-depth-x')) || 0)
    const rigidScene = scene.locator('[data-studio-rigid-scene]')
    // Register the scene plane while exercising pointer offsets and peak breathing:
    // hard window geometry must retain identical pixels instead of splitting at masks.
    const sceneAtmosphere = await scene.evaluate((element) => {
      const plane = element.querySelector<HTMLElement>('[data-studio-rigid-scene]')?.parentElement
      if (!plane) throw new Error('rigid scene plane required')
      plane.style.transform = 'none'
      // Suppress atmospheric fades before setting their values: pausing a newly
      // created opacity transition at zero otherwise preserves its old sunset tint.
      for (const layer of element.querySelectorAll<HTMLElement>('*')) layer.style.transition = 'none'
      const host = element as HTMLElement
      const atmosphere = { warmth: host.style.getPropertyValue('--studio-warmth'), stars: host.style.getPropertyValue('--studio-stars') }
      host.style.setProperty('--studio-warmth', '0'); host.style.setProperty('--studio-stars', '0')
      for (const animation of element.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 0 }
      return atmosphere
    })
    const rigidBounds = await rigidScene.boundingBox()
    if (!rigidBounds) throw new Error('scene geometry must be rendered')
    const hardObjects = { x: Math.ceil(rigidBounds.x + rigidBounds.width * 160 / 1672),
      y: Math.ceil(rigidBounds.y + rigidBounds.height * 50 / 941),
      width: Math.floor(rigidBounds.width * 150 / 1672), height: Math.floor(rigidBounds.height * 440 / 941) }
    const restingObjects = await page.screenshot({ clip: hardObjects })
    await page.mouse.move(sceneBounds.x + sceneBounds.width * .85, sceneBounds.y + sceneBounds.height * .25)
    await expect.poll(depthX, { timeout: 10_000 }).toBeLessThan(-2)
    await scene.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        if (animation instanceof CSSAnimation && animation.animationName === 'studioBreath') animation.currentTime = 3182
      }
    })
    expect(Buffer.compare(restingObjects, await page.screenshot({ clip: hardObjects }))).toBe(0)
    await scene.evaluate((element, atmosphere) => {
      element.querySelector<HTMLElement>('[data-studio-rigid-scene]')?.parentElement?.style.removeProperty('transform')
      const host = element as HTMLElement
      host.style.setProperty('--studio-warmth', atmosphere.warmth); host.style.setProperty('--studio-stars', atmosphere.stars)
      for (const animation of element.getAnimations({ subtree: true })) animation.play()
      for (const layer of element.querySelectorAll<HTMLElement>('*')) layer.style.removeProperty('transition')
    }, sceneAtmosphere)
    const layered = await scene.evaluate((element) => {
      const pane = element.querySelector('[data-studio-rigid-scene]')?.parentElement
      return pane == null ? 'none' : getComputedStyle(pane).transform
    })
    expect(layered).not.toBe('none')
    await page.mouse.move(-20, -20)
    await expect.poll(async () => Math.abs(await depthX()), { timeout: 10_000 }).toBeLessThan(.1)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.mouse.move(sceneBounds.x + sceneBounds.width * .9, sceneBounds.y + sceneBounds.height * .3)
    expect(await depthX()).toBe(0)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.mouse.move(-20, -20)
    const artifacts = process.env.DSH_STUDIO_ARTIFACT_DIR
    if (artifacts !== undefined) {
      mkdirSync(artifacts, { recursive: true })
      await page.screenshot({ path: join(artifacts, 'desktop-scene.png') })
    }
    expect(await page.getByRole('slider', { name: 'Time of day' }).count()).toBe(0)
    expect(await page.getByRole('tab', { name: 'Chat', exact: true }).count()).toBe(0)
    expect(await page.locator('[data-mode="scene"]').evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(1680)
    await paper.click()
    const approach = await page.locator('[data-mode="entering"][data-period]').evaluate(host => new Promise<{ samples: number; gaps: string[] }>((resolve) => {
      let samples = 0
      const gaps: string[] = []
      const sample = () => {
        if ((host as HTMLElement).dataset.mode !== 'entering') { resolve({ samples, gaps }); return }
        const stage = host.querySelector('[data-studio-rigid-scene]')!.parentElement!.parentElement!
        const transform = new DOMMatrix(getComputedStyle(stage).transform)
        const plane = [[0, 0], [1672, 0], [1672, 941], [0, 941]].map(([x, y]) => {
          const point = new DOMPoint(x, y).matrixTransform(transform)
          return [point.x / point.w, point.y / point.w]
        })
        const bounds = host.getBoundingClientRect()
        if (bounds.x !== 0 || bounds.y !== 0 || bounds.width !== innerWidth || bounds.height !== innerHeight) gaps.push('host does not fill viewport')
        for (const [x, y] of [[0, 0], [innerWidth, 0], [innerWidth, innerHeight], [0, innerHeight]]) {
          const crosses = plane.map(([ax, ay], index) => {
            const [bx, by] = plane[(index + 1) % 4]!
            return (bx! - ax!) * (y! - ay!) - (by! - ay!) * (x! - ax!)
          })
          if (!crosses.every(value => value >= -.01) && !crosses.every(value => value <= .01)) gaps.push(`image misses ${x},${y}`)
        }
        samples++
        requestAnimationFrame(sample)
      }
      sample()
    }))
    expect(approach.samples).toBeGreaterThan(15)
    expect(approach.gaps).toEqual([])
    await page.getByRole('button', { name: '← Back to the desk' }).waitFor()
    expect(await page.locator('[data-idle-active]').count()).toBe(0)
    expect(await page.locator('[data-sidebar-collapsed="true"]').count()).toBe(1)
    await page.getByRole('button', { name: 'Open sidebar', exact: true }).click()
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).waitFor()
    await expect.poll(() => page.locator('[data-sidebar-vibe]').getAttribute('data-direction')).toBe('open')
    expect(['0', '1', '2']).toContain(await page.locator('[data-sidebar-vibe]').getAttribute('data-palette'))
    const mosaic = await page.locator('[data-sidebar-vibe]').evaluate((host) => {
      const panel = host.firstElementChild as HTMLElement
      const cells = host.querySelector('[data-sidebar-pixel-mask]')!
      return { width: panel.getBoundingClientRect().width, height: panel.getBoundingClientRect().height,
        inert: panel.inert, cells: cells.childElementCount,
        sourceHidden: getComputedStyle(document.querySelector('[data-sidebar-surface]')!).visibility }
    })
    expect(mosaic.width).toBeGreaterThan(250)
    expect(mosaic.height).toBeGreaterThan(800)
    expect(mosaic.cells).toBeGreaterThan(200)
    expect(mosaic.inert).toBe(true)
    expect(mosaic.sourceHidden).toBe('hidden')
    if (artifacts !== undefined) {
      await page.locator('[data-sidebar-vibe]').evaluate((host) => {
        for (const animation of host.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 155 }
      })
      await page.screenshot({ path: join(artifacts, 'desktop-sidebar-mosaic.png') })
      await page.locator('[data-sidebar-vibe]').evaluate((host) => { for (const animation of host.getAnimations({ subtree: true })) animation.play() })
    }
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
    await expect.poll(() => page.locator('[data-sidebar-vibe]').getAttribute('data-direction')).toBe('close')
    await expect.poll(() => page.locator('[data-sidebar-vibe][data-active]').count(), { timeout: 4000 }).toBe(0)
    await page.getByRole('button', { name: 'Open sidebar', exact: true }).click()
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).waitFor()
    await openSettings(page, 'en')
    const selectedAppearance = page.getByRole('dialog').getByRole('button', { name: 'System', exact: true })
    expect(await selectedAppearance.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(232, 223, 204)')
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'desktop-settings.png') })
    expect((await page.request.get(new URL('/assets/desktop-studio-dusk.png', page.url()).href)).status()).toBe(200)
    await page.getByRole('slider', { name: 'Time of day' }).evaluate((element) => {
      const input = element as HTMLInputElement
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '18')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await page.locator('[data-period="dusk"]').waitFor()
    await expect.poll(() => page.locator('[data-period="dusk"]').evaluate((element) => {
      const art = element.querySelector('[aria-hidden="true"]')
      return art === null ? 0 : Number(getComputedStyle(art).opacity)
    }), { timeout: 10_000 }).toBe(1)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '← Back to the desk' }).click()
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'desktop-dusk-in-app.png') })
    await paper.click()
    await page.getByRole('button', { name: '← Back to the desk' }).waitFor()
    expect(await page.getByRole('slider').count()).toBe(0)
    const input = page.locator('[data-composer-input][contenteditable="true"]').first()
    expect(await input.evaluate(el => getComputedStyle(el).cursor)).toBe('text')
    expect(await page.getByRole('button', { name: '← Back to the desk' }).evaluate(el => getComputedStyle(el).cursor)).toContain('data:image/svg+xml')
    await input.fill('A draft that has not been sent')
    const wave = page.locator('[data-composer-wave]').first()
    await expect.poll(() => wave.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1)
    expect(await wave.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none')
    expect(await wave.locator('[data-composer-wave-surface]').evaluate(el => el.getAnimations().length)).toBe(1)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await input.evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const selection = window.getSelection()!
      selection.removeAllRanges()
      selection.addRange(range)
    })
    await page.keyboard.press('Control+c')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('A draft that has not been sent')
    await page.getByRole('button', { name: '← Back to the desk' }).focus()
    await expect.poll(() => wave.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(0)
    await input.focus()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await wave.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a instanceof CSSAnimation).length)).toBe(0)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await input.press('Control+End')
    expect(await page.getByText('Dear friend,', { exact: true }).isVisible()).toBe(true)
    const desktopHeight = await page.locator('[data-composer-card]').first().evaluate(el => el.getBoundingClientRect().height)
    expect(desktopHeight).toBe(112)
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'desktop-letter.png') })
    await page.getByRole('button', { name: '← Back to the desk' }).click()
    await paper.click()
    await page.getByRole('button', { name: '← Back to the desk' }).waitFor()
    expect(await input.textContent()).toBe('A draft that has not been sent')
    await page.getByRole('button', { name: 'Trajectory', exact: true }).click()
    await page.getByRole('button', { name: 'Close trajectory', exact: true }).waitFor()
    expect(await page.locator('[data-studio-trajectory]').getAttribute('aria-hidden')).toBe('false')
    await page.keyboard.press('Escape')
    expect(await page.getByRole('button', { name: 'Close trajectory', exact: true }).count()).toBe(0)
    await page.setViewportSize({ width: 600, height: 800 })
    const narrowHeight = await page.locator('[data-composer-card]').first().evaluate(el => el.getBoundingClientRect().height)
    expect(narrowHeight).toBe(108)
    await page.setViewportSize({ width: 1680, height: 900 })
    const sessionSearch = page.getByRole('button', { name: 'Search sessions' })
    if (await sessionSearch.getAttribute('aria-expanded') !== 'true') await sessionSearch.click()
    await page.getByRole('textbox', { name: 'Search session names', exact: true }).fill(fixture.markers.user(1))
    const result = page.getByRole('tree', { name: 'Search results' }).getByRole('treeitem')
    await expect.poll(() => result.count(), { timeout: 30_000 }).toBe(1)
    await result.click()
    await page.setViewportSize({ width: 1680, height: 900 })
    await page.getByRole('button', { name: 'Trajectory', exact: true }).click()
    await page.locator('[data-trajectory-story]').waitFor()
    expect(await page.getByRole('heading', { name: 'Task journey', exact: true }).isVisible()).toBe(true)
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'desktop-trajectory-journey.png') })
    for (const width of [390, 600, 1280, 1440, 1680]) {
      await page.setViewportSize({ width, height: 900 })
      const overflow = await page.locator('[data-trajectory-story]').evaluate(el => ({
        width: el.clientWidth, scroll: el.scrollWidth,
        outside: [...el.querySelectorAll('*')].filter(child => child.getBoundingClientRect().right > el.getBoundingClientRect().right + 1).slice(0, 8).map(child => ({ tag: child.tagName, className: child.className, width: child.getBoundingClientRect().width })),
      }))
      expect(overflow.scroll, JSON.stringify({ viewport: width, ...overflow })).toBeLessThanOrEqual(overflow.width + 1)
    }
    await page.getByRole('button', { name: 'Inspect record', exact: true }).first().click()
    await page.locator('[data-trajectory-scroll] table[data-scroll-ready="true"]').waitFor()
    await page.getByRole('button', { name: 'Close details', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Close details', exact: true }).click()
    const traceSearch = page.getByRole('searchbox', { name: 'Search trajectory' })
    const close = page.getByRole('button', { name: 'Close trajectory', exact: true })
    expect(await page.locator('[data-composer-seat]').first().isVisible()).toBe(false)
    expect(await page.locator('[data-workspace-hook="active"]').first().evaluate(element => getComputedStyle(element).visibility)).toBe('hidden')
    for (const width of [600, 1680]) {
      await page.setViewportSize({ width, height: 900 })
      const searchBox = await traceSearch.boundingBox()
      const closeBox = await close.boundingBox()
      if (searchBox === null || closeBox === null) throw new Error('trajectory controls must be visible')
      expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(searchBox.y)
      await traceSearch.fill('SWISS')
      expect(await traceSearch.inputValue()).toBe('SWISS')
      await traceSearch.fill('')
    }
    const tracePalette = await page.locator('[data-studio-trajectory]').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }))
    expect(tracePalette).toEqual({ background: 'rgb(0, 47, 167)', color: 'rgb(244, 239, 226)' })
    const traceSelection = await page.locator('[data-studio-trajectory]').evaluate((el) => {
      const style = getComputedStyle(el, '::selection')
      return { background: style.backgroundColor, color: style.color }
    })
    expect(traceSelection).toEqual({ background: 'rgb(244, 239, 226)', color: 'rgb(0, 47, 167)' })
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'desktop-trajectory.png') })
    await close.click()
    expect(await close.count()).toBe(0)
    expect(await page.locator('[data-composer-seat]').first().isVisible()).toBe(true)
    const workspaceHook = page.locator('[data-workspace-hook-tree]')
    expect(await workspaceHook.locator('[data-workspace-hook="active"]').evaluate(element => getComputedStyle(element).visibility)).toBe('visible')
    await expect.poll(() => workspaceHook.locator('[data-workspace-hook="active"]').getAttribute('data-visible')).toBe('true')
    const workspaceAnchor = await workspaceHook.evaluate((root) => {
      const row = root.querySelector('[role="treeitem"][aria-selected="true"]')
      const parent = row?.closest('[data-workspace-hook-group]')?.querySelector('[data-row-key^="workspace:"]')
      const rail = root.querySelector<HTMLElement>('[data-workspace-hook="active"]')
      if (!parent || !rail) throw new Error('workspace parent must own the hook')
      return { start: rail.getBoundingClientRect().top, parentBottom: parent.getBoundingClientRect().bottom }
    })
    expect(Math.abs(workspaceAnchor.start - workspaceAnchor.parentBottom)).toBeLessThanOrEqual(10)
    const selectedParagraph = page.locator('[data-chat-scroll] p').filter({ hasText: fixture.markers.assistant(7) }).first()
    await selectedParagraph.scrollIntoViewIfNeeded()
    await selectedParagraph.click()
    const selectedBody = await selectedParagraph.evaluate((el, marker) => {
      const paragraphs = el.parentElement?.querySelectorAll(':scope > p')
      const last = paragraphs?.item(2)
      if (el.firstChild === null || last?.firstChild === null || last === undefined) throw new Error('three body paragraphs required')
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStart(el.firstChild, marker.length + 1)
      range.setEnd(last.firstChild, last.firstChild.textContent?.length ?? 0)
      selection?.removeAllRanges()
      selection?.addRange(range)
      const style = getComputedStyle(el, '::selection')
      return { text: selection?.toString(), ranges: selection?.rangeCount,
        background: style.backgroundColor, color: style.color, selectable: getComputedStyle(el).userSelect }
    }, fixture.markers.assistant(7))
    const expectedSelection = 'The conversation remains readable after several paragraphs.\n\n'
      + 'Turn 7 deliberately carries enough prose to wrap at narrower viewport widths. '
      + 'The semantic marker stays near the start so geometry probes can find the same rendered row.\n\n'
      + 'The closing paragraph makes this a realistic assistant response rather than a one-line list item.'
    expect(selectedBody).toEqual({ text: expectedSelection, ranges: 1, background: 'rgb(0, 47, 167)', color: 'rgb(244, 239, 226)', selectable: 'text' })
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.keyboard.press('Control+c')
    expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(expectedSelection)
    await page.evaluate(() => window.getSelection()?.removeAllRanges())
    for (const id of ['plugins', 'schedules']) {
      const row = page.locator(`[data-panel-id="${id}"]`).first()
      await row.hover()
      await expect.poll(() => row.locator('span[aria-hidden="true"]').evaluate(el => el.style.transform)).toMatch(/rotate\([1-9]/)
    }
    await page.mouse.move(900, 200)
    const scrollport = page.locator('[data-chat-scroll]').first()
    await scrollport.evaluate((el) => {
      const preview = document.createElement('div')
      preview.dataset.studioTrajectory = ''
      preview.dataset.previewRegression = ''
      const ledger = document.createElement('div')
      ledger.dataset.conversationComposerOverlay = ''
      preview.append(ledger)
      el.prepend(preview)
    })
    expect(await page.locator('[data-composer-seat]').first().evaluate(el => getComputedStyle(el).position)).toBe('relative')
    await page.locator('[data-preview-regression]').evaluate(el => el.remove())
    const dockGap = () => page.locator('[data-composer-seat]').first().evaluate((el) => {
      const port = el.parentElement
      if (port === null) throw new Error('composer must belong to its conversation body')
      return Math.abs(port.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom)
    })
    await page.evaluate(() => {
      document.documentElement.dataset.windowsTitlebar = ''
      document.documentElement.style.setProperty('--dsh-windows-titlebar-height', '36px')
    })
    for (const width of [390, 600, 1280, 1440, 1680]) {
      await page.setViewportSize({ width, height: 900 })
      const footer = await page.locator('[data-composer-card]').first().evaluate((card) => {
        const seat = card.closest('[data-composer-seat]')
        const body = seat?.parentElement
        const dock = seat?.querySelector('[data-composer-dock]')
        if (body === null || body === undefined || dock === null || dock === undefined) throw new Error('footer geometry missing')
        const outer = body.getBoundingClientRect()
        const box = card.getBoundingClientRect()
        return { left: box.left - outer.left, right: outer.right - box.right, bottom: outer.bottom - dock.getBoundingClientRect().bottom }
      })
      expect(footer.left).toBeGreaterThanOrEqual(12)
      expect(footer.right).toBeGreaterThanOrEqual(12)
      expect(Math.abs(footer.left - footer.right)).toBeLessThan(2)
      expect(footer.bottom).toBeGreaterThanOrEqual(8)
      expect(await page.locator('[data-composer-stat="usage"]').first().isVisible()).toBe(true)
      await scrollport.evaluate((el) => { el.scrollTop = 0 })
      await expect.poll(dockGap).toBeLessThan(2)
      await scrollport.evaluate((el) => { el.scrollTop = el.scrollHeight / 2 })
      await expect.poll(dockGap).toBeLessThan(2)
    }
    await page.locator('[data-slot="ai-status"][data-state="done"]').waitFor()
    expect(await page.getByRole('status').filter({ hasText: 'Turn completed' }).count()).toBe(1)
    if (artifacts !== undefined) {
      await page.locator('[data-slot="ai-status"]').scrollIntoViewIfNeeded()
      await page.screenshot({ path: join(artifacts, 'desktop-ai-status.png') })
    }
    const settled=scaffold.whenTurnSettled()
    const liveInput=page.locator('[data-composer-input]').first()
    await writeComposerDraft(page,liveInput,'Check the desktop preview.')
    await liveInput.press('Enter')
    await expect.poll(()=>adapter.started,{ timeout:20000 }).toBe(true)
    await page.locator('[data-slot="ai-status"][data-state="thinking"]').waitFor()
    await expect.poll(dockGap).toBeLessThan(2)
    await page.mouse.move(900,220)
    const reveal=page.locator('[data-studio-views][data-revealing]')
    await reveal.waitFor()
    const previewFeed=reveal.locator('[data-studio-trajectory] [data-trajectory-story]')
    await previewFeed.waitFor({ state:'attached' })
    const fixedPreview = await previewFeed.boundingBox()
    await page.mouse.move(1040, 380)
    expect(await previewFeed.boundingBox()).toEqual(fixedPreview)
    const chatBefore=await scrollport.evaluate(el=>el.scrollTop)
    const traceBefore=await previewFeed.evaluate(el=>el.scrollTop)
    await page.mouse.wheel(0,350)
    await expect.poll(()=>previewFeed.evaluate(el=>el.scrollTop)).toBeGreaterThan(traceBefore)
    expect(Math.abs(await scrollport.evaluate(el=>el.scrollTop)-chatBefore)).toBeLessThan(2)
    await expect.poll(dockGap).toBeLessThan(2)
    if(artifacts!==undefined) await page.screenshot({ path:join(artifacts,'desktop-running-preview.png') })
    adapter.release.resolve(undefined)
    await settled
    // Exercise the same live bundle replacement that used to strand the
    // composer in its error boundary; no page reload may hide the failure.
    const moduleId = '@deepseek-ai/dsh-client-ui-conversation'
    const bundlePath = scaffold.ctx.clientModules.clientPath(moduleId)
    if (bundlePath === undefined) throw new Error('conversation bundle missing')
    await page.evaluate(() => { document.documentElement.dataset.studioHmrWitness = 'resident' })
    for (let generation = 0; generation < 2; generation++) {
      const stamp = statSync(bundlePath)
      const replaced = page.waitForResponse(response => response.url().includes('/plugins/') && response.url().includes('dsh-client-ui-conversation'))
      utimesSync(bundlePath, stamp.atime, new Date(stamp.mtimeMs + 1000))
      scaffold.ctx.clientModules.rebuilt(moduleId)
      await replaced
      await expect.poll(() => page.locator('[data-composer-card]').count()).toBe(1)
      await expect.poll(() => page.locator('[data-composer-stat="usage"]').first().isVisible()).toBe(true)
      expect(await page.locator('html').getAttribute('data-studio-hmr-witness')).toBe('resident')
      expect(await liveInput.isVisible()).toBe(true)
    }
    await liveInput.click()
    await page.locator('[data-sidebar-right-expand]').click()
    await page.locator('[data-sidebar-right-guide-entry="files"]').click()
    const files = page.locator('[data-files-state="tree"]').first()
    const folder = files.getByRole('button', { name: 'Hook sample', exact: true })
    await folder.waitFor()
    await folder.click()
    await expect.poll(() => files.locator('[data-files-hook="active"]').getAttribute('data-visible')).toBe('true')
    const nestedFile = files.getByRole('button', { name: 'hook-notes.md', exact: true })
    await nestedFile.hover()
    await expect.poll(() => files.locator('[data-files-hook="preview"]').getAttribute('data-visible')).toBe('true')
    await nestedFile.click()
    await page.getByText('File rail preview', { exact: true }).waitFor()
    await page.locator('[data-dockkit-tab]').filter({ hasText: /^Files/ }).first().click()
    await expect.poll(() => nestedFile.getAttribute('aria-current')).toBe('true')
    await files.locator('[data-files-body]').evaluate((element) => { element.scrollTop = 20 })
    await expect.poll(() => files.evaluate((element) => {
      const row = element.querySelector('[aria-current="true"]')
      const corner = element.querySelector('[data-files-hook="active"] > span:last-child')
      if (!row || !corner) return 999
      const box = row.getBoundingClientRect()
      return Math.abs(corner.getBoundingClientRect().bottom - (box.top + box.height / 2))
    })).toBeLessThan(3)
    if (artifacts !== undefined) await page.screenshot({ path: join(artifacts, 'desktop-hook-files.png') })
    await page.locator('[data-sidebar-right-toggle]').first().click()
    await page.getByRole('button', { name: /^New Session$/i }).first().click()
    await expect.poll(() => page.locator('[data-mode="letter"]').count()).toBe(1)
    expect(await page.locator('[data-mode="scene"]').count()).toBe(0)
    expect(await liveInput.isVisible()).toBe(true)
    expect(await page.getByText(basename(scaffold.workspaceCwd), { exact: true }).count()).toBeGreaterThan(0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await page.getByRole('button', { name: /What shall we work on together/ }).waitFor()
    expect(await page.locator('[data-studio-opening]').count()).toBe(0)
    expect(console.pageErrors).toEqual([])
    await compareOrRefreshGolden(fileURLToPath(new URL('./expected/desktop-studio/entry.expected.md', import.meta.url)), [
      '- Scene: physical-paper greeting; time preview lives in Settings',
      '- Letter: time preview hidden; salutation retained while drafting',
      `- Composer: ${desktopHeight}px desktop; ${narrowHeight}px narrow`,
      '- Returning to the desk preserves the unsent draft',
      '- The Session trajectory opens fullscreen and closes with Escape',
    ].join('\n'), webSnapshotMode())
  } catch (error) {
    if (failurePage !== undefined) await saveFailureShot(failurePage, 'desktop-studio-failure')
    throw error
  } finally {
    adapter.release.resolve(undefined)
    await browser.close()
    await scaffold.close()
  }
})
