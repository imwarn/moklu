/**
 * Compare saved project layouts across legacy screenshot migrations.
 *
 * Only remove a default-locale screenshot patch when both its reference and
 * (if present) legacy inlined bytes agree with the same bundled image asset.
 * All other locale properties remain subject to strict comparison.
 */
export function normalizedProject(bundle) {
  const project = structuredClone(bundle.project)
  const assets = bundle.assets ?? {}
  const walk = (layers) => {
    for (const layer of layers) {
      // Legacy inline bytes are represented by the bundled asset map. Do not
      // lose this check: callers must also compare the entire assets map.
      if (
        typeof layer.screenshotPath === 'string' &&
        typeof assets[layer.screenshotPath] === 'string' &&
        layer.screenshotDataUrl === assets[layer.screenshotPath]
      ) {
        delete layer.screenshotDataUrl
      }

      const defaultLocale = layer.localeContent?.en
      const screenshotKey = layer.screenshotPath
      const asset = typeof screenshotKey === 'string' ? assets[screenshotKey] : undefined
      if (
        defaultLocale &&
        typeof screenshotKey === 'string' &&
        typeof asset === 'string' &&
        defaultLocale.screenshotPath === screenshotKey &&
        Object.keys(defaultLocale).every((key) =>
          key === 'screenshotPath' ||
          (key === 'screenshotDataUrl' && defaultLocale.screenshotDataUrl === asset)
        )
      ) {
        delete layer.localeContent.en
        if (Object.keys(layer.localeContent).length === 0) delete layer.localeContent
      }
      if (Array.isArray(layer.children)) walk(layer.children)
    }
  }
  for (const group of project.slideGroups) walk(group.layers)
  return project.slideGroups
}
