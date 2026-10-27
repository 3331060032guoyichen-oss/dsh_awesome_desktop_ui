/** Verify the essential Desktop services in the real packaged Host. */

/** Check market delivery and the read-only usage endpoints without account credentials.
 * @param url - Authenticated Host URL.
 * @param cookie - Host session cookie obtained by the caller.
 * @param injections - Browser boot modules supplied by the running Host.
 * @returns Resolves once market and usage are available.
 */
export async function smokeCommunityFeatures(url: string, cookie: string, injections: readonly unknown[]): Promise<void> {
  const modules = JSON.stringify(injections)
  if (!modules.includes('@deepseek-ai/dsh-client-ui-plugin-market')) {
    throw new Error('desktop runtime: third-party market client is absent')
  }
  if (modules.includes('@ychris12138/dsh-usage-stats')) {
    throw new Error('desktop runtime: usage must only appear in Settings')
  }
  for (const path of ['/api/usage-stats/usage', '/api/usage-stats/providers']) {
    const response = await fetch(new URL(path, url), {
      headers: { cookie, accept: 'application/json' }, signal: AbortSignal.timeout(30_000),
    })
    const value: unknown = response.ok ? await response.json() : undefined
    if (typeof value !== 'object' || value === null || !('ok' in value) || value.ok !== true
      || (path.endsWith('/usage') && (!('days' in value) || !Array.isArray(value.days)))
      || (path.endsWith('/providers') && (!('providers' in value) || !Array.isArray(value.providers)))) {
      throw new Error(`desktop runtime: bundled usage service is unavailable at ${path} (${String(response.status)})`)
    }
  }
}
