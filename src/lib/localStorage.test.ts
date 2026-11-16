import { beforeEach, describe, expect, test } from 'vitest'
import {
  getStoredPaletteSetting,
  getStoredThemeSetting,
  setStoredPaletteSetting,
  setStoredThemeSetting,
} from './localStorage'

describe('theme setting', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('follows the device when nothing is stored', () => {
    expect(getStoredThemeSetting()).toBe('system')
  })

  test('reads the values earlier versions stored', () => {
    localStorage.setItem('theme', 'dark')
    expect(getStoredThemeSetting()).toBe('dark')
    localStorage.setItem('theme', 'light')
    expect(getStoredThemeSetting()).toBe('light')
  })

  test('choosing the device setting removes the entry again', () => {
    setStoredThemeSetting('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    setStoredThemeSetting('system')
    expect(localStorage.getItem('theme')).toBeNull()
  })
})

describe('palette setting', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('uses the default colours when nothing is stored', () => {
    expect(getStoredPaletteSetting()).toBe('default')
  })

  test('ignores unknown values', () => {
    localStorage.setItem('palette', 'purple')
    expect(getStoredPaletteSetting()).toBe('default')
  })

  test('stores a chosen palette and removes the entry for the default', () => {
    setStoredPaletteSetting('lemon')
    expect(localStorage.getItem('palette')).toBe('lemon')
    expect(getStoredPaletteSetting()).toBe('lemon')
    setStoredPaletteSetting('default')
    expect(localStorage.getItem('palette')).toBeNull()
  })
})
