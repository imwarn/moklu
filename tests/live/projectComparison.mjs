/**
 * Compare saved project layout across editor migrations without discarding
 * user-visible changes. Asset contents are checked separately, byte for byte.
 */
export function normalizedProject(bundle) {
  const project = structuredClone(bundle.project)
  const walk = (layers) => {
    for (const layer of layers) {
      // Inline screenshot bytes are migrated to the asset store on reload.
      delete layer.screenshotDataUrl

      const defaultLocale = layer.localeContent?.en
      // A redundant default-locale pointer is equivalent to the base
      // screenshot, but only when both references really exist.
      if (
        defaultLocale &&
        typeof layer.screenshotPath === 'string' &&
        defaultLocale.screenshotPath === layer.screenshotPath &&
        Object.keys(defaultLocale).length === 1
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
