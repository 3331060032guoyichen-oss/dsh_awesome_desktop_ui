import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it, expect, vi } from 'vitest'
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))

import { stageWindowsCppRuntime, windowsCppRuntimeDirectory } from '../scripts/windows-cpp-runtime.ts'

it('copies and inventories app-local CRT files only after successful trust verification', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-crt-'))
  try {
    const source = join(root, 'source'), engine = join(root, 'engine')
    mkdirSync(source); mkdirSync(join(engine, 'bin'), { recursive: true })
    for (const name of ['msvcp140.dll', 'msvcp140_1.dll', 'msvcp140_2.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']) {
      writeFileSync(join(source, name), name)
    }
    const verify = vi.fn()
    const files = stageWindowsCppRuntime(engine, source, verify)
    expect(verify).toHaveBeenCalledOnce()
    expect(files).toHaveLength(5)
    expect(files.every(file => /^[a-f0-9]{64}$/u.test(file.sha256))).toBe(true)
    expect(readFileSync(join(engine, 'bin/msvcp140_2.dll'), 'utf8')).toBe('msvcp140_2.dll')
    expect(existsSync(join(engine, 'MICROSOFT-CRT-NOTICE.txt'))).toBe(true)
    expect(() => stageWindowsCppRuntime(engine, source, () => { throw new Error('untrusted') })).toThrow('untrusted')
    expect(() => windowsCppRuntimeDirectory({ DSH_DESKTOP_CRT_DIR: 'relative' })).toThrow(/absolute/u)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

it('rejects an incomplete runtime before copying any DLL', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-crt-missing-'))
  try {
    const verify = vi.fn()
    expect(() => stageWindowsCppRuntime(root, root, verify)).toThrow(/required redistributable/u)
    expect(verify).not.toHaveBeenCalled()
  } finally { rmSync(root, { recursive: true, force: true }) }
})

it('isolates Windows PowerShell module discovery from the calling shell', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-crt-shell-'))
  vi.stubEnv('PSModulePath', 'incompatible-core-modules')
  try {
    const source = join(root, 'source'), engine = join(root, 'engine')
    mkdirSync(source); mkdirSync(join(engine, 'bin'), { recursive: true })
    for (const name of ['msvcp140.dll', 'msvcp140_1.dll', 'msvcp140_2.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']) {
      writeFileSync(join(source, name), name)
    }
    stageWindowsCppRuntime(engine, source)
    expect(execFileSync).toHaveBeenLastCalledWith('powershell.exe', expect.any(Array), expect.objectContaining({
      env: expect.objectContaining({ PSModulePath: undefined }), windowsHide: true,
    }))
    expect(process.env.PSModulePath).toBe('incompatible-core-modules')
  } finally { vi.unstubAllEnvs(); rmSync(root, { recursive: true, force: true }) }
})
