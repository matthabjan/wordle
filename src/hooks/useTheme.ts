import { useEffect, useState } from 'react'
import {
  getStoredIsHighContrastMode,
  getStoredThemeSetting,
  setStoredIsHighContrastMode,
  setStoredThemeSetting,
  ThemeSetting,
} from '../lib/localStorage'

const DARK_QUERY = '(prefers-color-scheme: dark)'
// Page backgrounds, mirrored in index.css and public/theme-init.js
const THEME_COLOR = { light: '#fafaf9', dark: '#1c1917' }

export const useTheme = () => {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() =>
    getStoredThemeSetting(),
  )
  const [prefersDarkMode, setPrefersDarkMode] = useState(
    () => window.matchMedia(DARK_QUERY).matches,
  )
  const [isHighContrastMode, setIsHighContrastMode] = useState(
    getStoredIsHighContrastMode(),
  )

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersDarkMode(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const isDarkMode =
    themeSetting === 'system' ? prefersDarkMode : themeSetting === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    document.documentElement.classList.toggle(
      'high-contrast',
      isHighContrastMode,
    )

    // All of them, so the device-scheme variants cannot overrule the setting.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) =>
        meta.setAttribute(
          'content',
          isDarkMode ? THEME_COLOR.dark : THEME_COLOR.light,
        ),
      )
  }, [isDarkMode, isHighContrastMode])

  const handleThemeSetting = (setting: ThemeSetting) => {
    setThemeSetting(setting)
    setStoredThemeSetting(setting)
  }

  const handleHighContrastMode = (isHighContrast: boolean) => {
    setIsHighContrastMode(isHighContrast)
    setStoredIsHighContrastMode(isHighContrast)
  }

  return {
    themeSetting,
    isHighContrastMode,
    handleThemeSetting,
    handleHighContrastMode,
  }
}
