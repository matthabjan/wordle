import { useEffect, useState } from 'react'
import {
  getStoredIsHighContrastMode,
  getStoredTheme,
  setStoredIsHighContrastMode,
  setStoredTheme,
} from '../lib/localStorage'

export const useTheme = () => {
  const prefersDarkMode =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  const storedTheme = getStoredTheme()
  const [isDarkMode, setIsDarkMode] = useState(
    storedTheme !== null ? storedTheme : prefersDarkMode,
  )
  const [isHighContrastMode, setIsHighContrastMode] = useState(
    getStoredIsHighContrastMode(),
  )

  useEffect(() => {
    // Persist resolved theme so share emoji grid matches the UI
    if (getStoredTheme() === null) {
      setStoredTheme(isDarkMode)
    }
  }, [isDarkMode])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    document.documentElement.classList.toggle(
      'high-contrast',
      isHighContrastMode,
    )

    const themeColor = isDarkMode ? '#1c1917' : '#fafaf9'
    let meta = document.querySelector('meta[name="theme-color"]:not([media])')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', themeColor)
  }, [isDarkMode, isHighContrastMode])

  const handleDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
    setStoredTheme(isDark)
  }

  const handleHighContrastMode = (isHighContrast: boolean) => {
    setIsHighContrastMode(isHighContrast)
    setStoredIsHighContrastMode(isHighContrast)
  }

  return {
    isDarkMode,
    isHighContrastMode,
    handleDarkMode,
    handleHighContrastMode,
  }
}
