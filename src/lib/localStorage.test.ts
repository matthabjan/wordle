import { beforeEach, describe, expect, test } from 'vitest'
import { getStoredThemeSetting, setStoredThemeSetting } from './localStorage'

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
