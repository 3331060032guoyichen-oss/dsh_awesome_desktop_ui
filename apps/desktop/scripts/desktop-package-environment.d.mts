/** Select local test defaults or platform release settings without changing the caller's environment. */

/**
 * Select an unsigned Windows community environment without deployment configuration.
 * @param environment Parent tooling and network environment.
 * @returns Isolated community build settings.
 */
export function communityPackageEnvironment(environment?: NodeJS.ProcessEnv, edition?: 'lite' | 'full'): NodeJS.ProcessEnv

/**
 * Validate explicit community mode against platform, signing mode, and application identity.
 * @param environment Build settings.
 * @param platform Target platform.
 * @param unsigned Whether signing is disabled.
 * @returns Whether this is a community build; invalid combinations throw.
 */
export function isCommunityPackageEnvironment(environment: NodeJS.ProcessEnv, platform: string, unsigned: boolean): boolean

/**
 * Select local macOS test defaults without reading dotenv files or inheriting release settings.
 * @param environment Parent environment, retained for build tools and networking.
 * @returns Unsigned build environment with the standard application identifier and no update policy.
 */
export function localMacOSPackageEnvironment(environment?: NodeJS.ProcessEnv): NodeJS.ProcessEnv

/**
 * Read a machine preset when selected, otherwise the target's required dotenv; no ambient release fallback.
 * PACKAGE_TEST_RELEASE_ID overrides the test preset only; blank retains its configured ID.
 * PACKAGE_MACOS_ZIP_COMPRESSION_LEVEL overrides the Mac file setting with 3 or 7; an empty value is invalid.
 * Any defined Mac ZIP override rejects Windows, including an empty value; nonempty Windows overrides reject macOS.
 * PACKAGE_WINDOWS_COMPRESSION_LEVEL selects 3 or 7 for Windows workflow builds; blank retains the file setting.
 * @param platform Target platform.
 * @param environment Parent environment, retained only for unrelated build tools.
 * @param appRoot Desktop application directory; relative credential paths resolve here.
 * @param options Unsigned presets and Windows preparation-only presets never read signing credentials.
 * @returns Isolated environment with file-owned release settings.
 */
export function loadDesktopPackageEnvironment(
  platform: 'win32' | 'darwin',
  environment?: NodeJS.ProcessEnv,
  appRoot?: string,
  options?: { unsigned?: boolean, prepareOnly?: boolean },
): NodeJS.ProcessEnv

/**
 * Validate the packaging mode before preparation without invoking a token or Apple's services.
 * @param environment Selected local defaults or file-owned release settings.
 * @param target Selected release target.
 * @param options Explicit packaging mode.
 * @returns Nothing.
 */
export function validateDesktopPackageEnvironment(
  environment: NodeJS.ProcessEnv,
  target: { platform: 'win32' | 'darwin', arch: string },
  options?: { unsigned?: boolean, prepareOnly?: boolean, skipNotarization?: boolean },
): void
