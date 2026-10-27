/** Desktop features remain available on clean installs and existing profiles. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { createPluginProfile } from '../src/project-manager.ts'

const roots: string[] = []
function profile(): string {
  const path = mkdtempSync(join(tmpdir(), 'dsh-features-'))
  roots.push(path)
  return path
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

it('includes the desktop feature bundle without a separate plugin installation', () => {
  const path = profile()
  createPluginProfile(path)
  expect(JSON.parse(readFileSync(join(path, 'package.json'), 'utf8')).dsh.profile.bundles)
    .toContain('@deepseek-ai/dsh-desktop-host')
})

it('upgrades an existing profile while preserving installed plugins and user patches', () => {
  const path = profile()
  const manifest = {
    name: 'dsh-profile-desktop', private: true, dependencies: { 'my-plugin': '1.0.0' },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app',
      '@deepseek-ai/dsh-experimental-plugin-market-bundle', '@ychris12138/dsh-usage-stats', 'my-plugin'] } },
  }
  writeFileSync(join(path, 'package.json'), JSON.stringify(manifest))
  writeFileSync(join(path, 'cordis.patch.yml'), '# User preferences\n[]\n')
  writeFileSync(join(path, 'pnpm-lock.yaml'), 'user lockfile\n')
  createPluginProfile(path)
  const migrated = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'))
  expect(migrated.dependencies).toEqual(manifest.dependencies)
  expect(migrated.dsh.profile.bundles).toEqual([
    '@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@deepseek-ai/dsh-desktop-host', 'my-plugin',
  ])
  expect(readFileSync(join(path, 'cordis.patch.yml'), 'utf8')).toBe('# User preferences\n[]\n')
  expect(readFileSync(join(path, 'pnpm-lock.yaml'), 'utf8')).toBe('user lockfile\n')
  const first = readFileSync(join(path, 'package.json'), 'utf8')
  createPluginProfile(path)
  expect(readFileSync(join(path, 'package.json'), 'utf8')).toBe(first)
})
