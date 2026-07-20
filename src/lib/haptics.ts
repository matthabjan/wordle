export const vibrate = (pattern: number | number[] = 10) => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}
