import { describe, expect, it } from 'vitest'
import { communityPackageEnvironment, validateDesktopPackageEnvironment } from '../scripts/desktop-package-environment.mjs'
import { parseDesktopPackageInvocation } from '../scripts/package-target.ts'
import { createElectronBuilderConfig } from '../scripts/electron-builder-config.mjs'
import { communityReleasePage } from '../src/community-release.ts'

describe('community Windows distribution', () => {
  it('builds without deployment files, policy services, update feeds, or signing credentials', () => {
    const environment = communityPackageEnvironment({
      PATH: 'toolchain', HTTPS_PROXY: 'http://127.0.0.1:7897',
      DSH_DESKTOP_AUTO_UPDATE_ENV: 'production', DSH_PACKAGING_PRESET: 'production',
      DSH_DESKTOP_MANDATORY_UPDATE_PROD_ORIGIN: 'https://policy.example.com',
      DSH_DESKTOP_WINDOWS_TOKEN_PIN: 'fixture', CSC_LINK: 'fixture.pfx', WIN_CSC_LINK: 'fixture.pfx',
      DOWNLOAD_PROD_COS_SECRET_KEY: 'fixture',
    })
    expect(environment.PATH).toBe('toolchain')
    expect(environment.HTTPS_PROXY).toBe('http://127.0.0.1:7897')
    for (const name of ['DSH_DESKTOP_AUTO_UPDATE_ENV', 'DSH_PACKAGING_PRESET', 'DSH_DESKTOP_WINDOWS_TOKEN_PIN',
      'DSH_DESKTOP_MANDATORY_UPDATE_PROD_ORIGIN', 'DOWNLOAD_PROD_COS_SECRET_KEY', 'CSC_LINK', 'WIN_CSC_LINK']) {
      expect(environment[name]).toBeUndefined()
    }
    expect(() => { validateDesktopPackageEnvironment(environment, { platform: 'win32', arch: 'x64' }, { unsigned: true }) })
      .not.toThrow()
    const config = createElectronBuilderConfig(environment, 'win32', 'x64')
    expect(config.productName).toBe('DSH Awesome Desktop UI')
    expect(config.extraMetadata.dshCommunityDistribution).toBe('github-manual')
    expect(config.extraMetadata.dshMandatoryUpdatePolicy).toBeUndefined()
    expect(config.publish).toBeNull()
    expect(communityReleasePage(config.extraMetadata)).toBe(
      'https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/releases',
    )
  })

  it('requires the explicit Windows community invocation and rejects signing or invalid metadata', () => {
    expect(parseDesktopPackageInvocation(['win-x64', '--community'], 'win32', 'x64'))
      .toMatchObject({ community: true, unsigned: true, prepareOnly: false })
    expect(() => parseDesktopPackageInvocation(['mac-arm64', '--community'], 'darwin', 'arm64')).toThrow(/community/u)
    expect(() => parseDesktopPackageInvocation(['win-x64', '--community', '--prepare-only'], 'win32', 'x64'))
      .toThrow(/community/u)
    expect(() => { validateDesktopPackageEnvironment(communityPackageEnvironment({}), { platform: 'win32', arch: 'x64' }) })
      .toThrow(/unsigned Windows community/u)
    expect(communityReleasePage({})).toBeUndefined()
    expect(() => communityReleasePage({ dshCommunityDistribution: 'https://other.example.com' })).toThrow(/metadata/u)
    expect(() => communityReleasePage({
      dshCommunityDistribution: 'github-manual', dshDesktopAppId: 'com.dshawesome.desktopui', dshMandatoryUpdatePolicy: {},
    })).toThrow(/metadata/u)
  })
})
