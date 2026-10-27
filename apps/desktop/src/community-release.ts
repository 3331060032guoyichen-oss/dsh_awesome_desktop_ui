/** Community packages open their fixed release page for user-managed installation. */

/**
 * Resolve an installed community distribution without accepting a configurable download URL.
 * @param manifest - Application metadata read from the installed package.
 * @returns The project's release page, or undefined for existing distribution modes.
 */
export function communityReleasePage(manifest: unknown): string | undefined {
  if (typeof manifest !== 'object' || manifest === null || !('dshCommunityDistribution' in manifest)) return undefined
  if (manifest.dshCommunityDistribution !== 'github-manual' || 'dshMandatoryUpdatePolicy' in manifest
    || !('dshDesktopAppId' in manifest) || manifest.dshDesktopAppId !== 'com.dshawesome.desktopui') {
    throw new Error('desktop community: invalid manual-update distribution metadata')
  }
  return 'https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/releases'
}
