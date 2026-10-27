/** Bundle verified Microsoft C++ redistributables beside the native Office helper. */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants, copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'

const REQUIRED = ['msvcp140.dll', 'msvcp140_1.dll', 'msvcp140_2.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']

/**
 * Locate the licensed Visual Studio x64 CRT redistributable, with an explicit build-directory override.
 * @param environment - Build-machine settings.
 * @returns The redistributable directory; missing or relative inputs throw.
 */
export function windowsCppRuntimeDirectory(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.DSH_DESKTOP_CRT_DIR
  if (configured !== undefined) {
    if (!isAbsolute(configured)) throw new Error('desktop CRT: DSH_DESKTOP_CRT_DIR must be absolute')
    return configured
  }
  const programFiles = environment['ProgramFiles(x86)']
  if (!programFiles) throw new Error('desktop CRT: Visual Studio location is unavailable')
  const installation = execFileSync(join(programFiles, 'Microsoft Visual Studio/Installer/vswhere.exe'),
    ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
      '-property', 'installationPath'], { encoding: 'utf8', windowsHide: true, timeout: 20_000 }).trim()
  if (!installation) throw new Error('desktop CRT: Visual Studio C++ redistributables are required')
  const redist = join(installation, 'VC/Redist/MSVC')
  for (const version of readdirSync(redist).filter(value => /^\d+\.\d+\.\d+$/u.test(value))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
    const directory = join(redist, version, 'x64/Microsoft.VC143.CRT')
    if (existsSync(directory)) return directory
  }
  throw new Error('desktop CRT: x64 Microsoft.VC143.CRT was not found')
}

function verifyMicrosoftRuntime(files: readonly string[]): void {
  const script = `$ErrorActionPreference='Stop'; foreach($file in ($env:DSH_CRT_FILES | ConvertFrom-Json)) {
    $signature=Get-AuthenticodeSignature -LiteralPath $file
    if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') {
      throw 'desktop CRT: a redistributable has no valid Microsoft signature'
    }
  }`
  // Windows PowerShell must discover its own modules, rather than PowerShell Core assemblies.
  execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script], {
    env: { ...process.env, PSModulePath: undefined, DSH_CRT_FILES: JSON.stringify(files) }, windowsHide: true, timeout: 60_000, stdio: 'pipe',
  })
}

/**
 * Copy app-local CRT libraries without changing System32, permissions, or machine installations.
 * @param engine - Materialized native Office engine package.
 * @param source - Microsoft x64 redistributable directory.
 * @param verify - Trust verifier; production requires valid Microsoft Authenticode signatures.
 * @returns The sealed filename, digest, and version-source inventory.
 */
export function stageWindowsCppRuntime(engine: string, source: string,
  verify: (files: readonly string[]) => void = verifyMicrosoftRuntime): readonly { name: string; sha256: string }[] {
  for (const name of REQUIRED) {
    if (!existsSync(join(source, name))) throw new Error(`desktop CRT: required redistributable is missing: ${name}`)
  }
  const names = readdirSync(source).filter(name => /^[_a-z0-9]+\.dll$/iu.test(name)).sort()
  verify(names.map(name => join(source, name)))
  const files = names.map((name) => {
    copyFileSync(join(source, name), join(engine, 'bin', name), constants.COPYFILE_EXCL)
    return { name, sha256: createHash('sha256').update(readFileSync(join(engine, 'bin', name))).digest('hex') }
  })
  writeFileSync(join(engine, 'windows-cpp-runtime.json'), JSON.stringify({ schemaVersion: 1, files }, null, 2) + '\n')
  writeFileSync(join(engine, 'MICROSOFT-CRT-NOTICE.txt'),
    'Microsoft Visual C++ Runtime. Copyright Microsoft Corporation. All rights reserved.\n'
    + 'Redistributed from the licensed Visual Studio C++ Redist directory. Microsoft terms apply; these files are not MIT licensed.\n'
    + 'https://learn.microsoft.com/visualstudio/releases/2022/redistribution\n')
  return files
}
