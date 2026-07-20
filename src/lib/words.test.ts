import { describe, expect, it } from 'vitest'
import { WORDS } from '../constants/wordlist'
import {
  findFirstUnusedReveal,
  getWordOfDay,
  isWinningWord,
  isWordInWordList,
} from './words'

describe('getWordOfDay', () => {
  it('returns the first word on the epoch day', () => {
    const day = getWordOfDay(new Date(2026, 1, 9, 12, 0, 0))
    expect(day.solutionIndex).toBe(0)
    expect(day.solution).toBe(WORDS[0].toUpperCase())
  })

  it('increments index for subsequent days', () => {
    const day = getWordOfDay(new Date(2026, 1, 11, 8, 0, 0))
    expect(day.solutionIndex).toBe(2)
    expect(day.solution).toBe(WORDS[2].toUpperCase())
  })

  it('uses a deterministic epoch (not string parsing)', () => {
    const a = getWordOfDay(new Date(2026, 2, 1))
    const b = getWordOfDay(new Date(2026, 2, 1, 23, 59, 59))
    expect(a.solutionIndex).toBe(b.solutionIndex)
  })
})

describe('isWordInWordList', () => {
  it('accepts known solutions case-insensitively', () => {
    expect(isWordInWordList(WORDS[0].toUpperCase())).toBe(true)
  })

  it('rejects unknown words', () => {
    expect(isWordInWordList('QQQQQ')).toBe(false)
  })
})

describe('isWinningWord', () => {
  it('compares against the provided solution', () => {
    expect(isWinningWord('HELLO', 'HELLO')).toBe(true)
    expect(isWinningWord('WORLD', 'HELLO')).toBe(false)
  })
})

describe('findFirstUnusedReveal', () => {
  it('returns false with no prior guesses', () => {
    expect(findFirstUnusedReveal('ABCDE', [], 'ABCDE')).toBe(false)
  })

  it('requires correct letters in the same spot', () => {
    const result = findFirstUnusedReveal('XBCDE', ['ABCDE'], 'ABCDE')
    expect(result).toBeTruthy()
  })

  it('requires previously revealed present letters', () => {
    const result = findFirstUnusedReveal('XXXXX', ['AXXXX'], 'ABCDE')
    expect(result).toBeTruthy()
  })
})
