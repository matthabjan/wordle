// Applies the stored theme before the app loads, so there is no flash of the
// wrong one. A separate file because the CSP forbids inline scripts. Keys and
// colours mirror src/lib/localStorage.ts and src/hooks/useTheme.ts.
;(function () {
  try {
    var theme = localStorage.getItem('theme')
    var dark =
      theme === 'dark' ||
      (theme !== 'light' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    var root = document.documentElement
    if (dark) root.classList.add('dark')
    if (localStorage.getItem('highContrast') === '1') {
      root.classList.add('high-contrast')
    }
    var metas = document.querySelectorAll('meta[name="theme-color"]')
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute('content', dark ? '#1c1917' : '#fafaf9')
    }
  } catch (e) {
    // Storage blocked: the app applies the theme once it has loaded.
  }
})()
