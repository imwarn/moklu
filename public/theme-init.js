/**
 * [INPUT]: reads document.documentElement.dataset.surface, localStorage['moklu:ui-theme'], and window.matchMedia('(prefers-color-scheme: dark)')
 * [OUTPUT]: sets document.documentElement.dataset.theme and style.colorScheme synchronously before first paint to prevent FOUC
 * [POS]: CSP-safe external pre-paint theme initializer in public/, loaded by index.html ahead of stylesheets; mirrors src/theme/themeStore.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
;(function () {
  try {
    var root = document.documentElement
    var theme = 'light'
    if (root.dataset.surface === 'studio') {
      theme = 'dark'
    } else {
      var pref = window.localStorage.getItem('moklu:ui-theme')
      if (pref === 'dark' || (pref === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        theme = 'dark'
      }
    }
    root.dataset.theme = theme
    root.style.colorScheme = theme
  } catch {
    // Ignore storage or matchMedia restrictions.
  }
})()
