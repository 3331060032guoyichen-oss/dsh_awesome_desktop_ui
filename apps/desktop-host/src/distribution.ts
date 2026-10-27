/** Capability selection from immutable Desktop runtime metadata. */

/**
 * Resolve document conversion availability without reading user environment overrides.
 * @param manifest - Package metadata of the prepared Desktop runtime.
 * @returns Whether the full LibreOffice conversion capability is shipped.
 */
export function desktopOfficeConversionEnabled(manifest: unknown): boolean {
  if (typeof manifest !== 'object' || manifest === null) throw new Error('desktop runtime: invalid package metadata')
  if (!('dshDesktopFeatures' in manifest)) return true
  const features = manifest.dshDesktopFeatures
  if (typeof features !== 'object' || features === null || !('officeConversion' in features)
    || typeof features.officeConversion !== 'boolean') throw new Error('desktop runtime: invalid Office feature metadata')
  return features.officeConversion
}
