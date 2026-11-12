import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_WORD_LENGTH, REVEAL_TIME_MS } from '../constants/settings'
import { AlertProvider } from '../context/AlertContext'
import { loadStats } from '../lib/stats'
import { useGameState } from './useGameState'

// Game rules are covered in lib/game.test.ts. These tests cover what the hook
// adds around the game: the reveal lock, persistence and stats.

const SOLUTION = 'KUGEL'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AlertProvider>{children}</AlertProvider>
)

const renderGame = () =>
  renderHook(
    () =>
      useGameState({
        solution: SOLUTION,
        solutionIndex: 0,
        onOpenStats: () => undefined,
      }),
    { wrapper },
  )

type Hook = ReturnType<typeof renderGame>['result']

const type = (result: Hook, word: string) =>
  act(() => word.split('').forEach((l) => result.current.onChar(l)))

const finishReveal = () =>
  act(() => vi.advanceTimersByTime(REVEAL_TIME_MS * MAX_WORD_LENGTH))

const play = (result: Hook, word: string) => {
  type(result, word)
  act(() => result.current.onEnter())
  finishReveal()
}

const storedGame = () => JSON.parse(localStorage.getItem('gameState') ?? 'null')

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('jiggles the row when a guess is rejected', () => {
    const { result } = renderGame()

    type(result, 'KU')
    act(() => result.current.onEnter())

    expect(result.current.guesses).toHaveLength(0)
    expect(result.current.currentGuess.slice(0, 2)).toEqual(['K', 'U'])
    expect(result.current.currentRowClass).toBe('jiggle')
  })

  it('ignores input while a guess is being revealed', () => {
    const { result } = renderGame()

    type(result, 'KNOPF')
    act(() => result.current.onEnter())
    expect(result.current.isRevealing).toBe(true)

    type(result, 'X')
    act(() => result.current.setCursor(3))
    expect(result.current.currentGuess.every((l) => l === null)).toBe(true)
    expect(result.current.cursorIndex).toBe(0)

    finishReveal()
    expect(result.current.isRevealing).toBe(false)

    type(result, 'X')
    expect(result.current.currentGuess[0]).toBe('X')
  })

  it('saves guesses and restores them on the next visit', () => {
    const first = renderGame()
    play(first.result, 'KNOPF')
    expect(storedGame()).toEqual({ guesses: ['KNOPF'], solution: SOLUTION })
    first.unmount()

    const second = renderGame()
    expect(second.result.current.guesses).toEqual(['KNOPF'])
    expect(second.result.current.isGameWon).toBe(false)
  })

  it('discards saved guesses that belong to another solution', () => {
    localStorage.setItem(
      'gameState',
      JSON.stringify({ guesses: ['KNOPF'], solution: 'XENON' }),
    )

    const { result } = renderGame()
    expect(result.current.guesses).toEqual([])
  })

  it('records stats once when the game ends, not again on restore', () => {
    const first = renderGame()
    play(first.result, 'KNOPF')
    play(first.result, SOLUTION)

    expect(first.result.current.isGameWon).toBe(true)
    expect(first.result.current.stats.totalGames).toBe(1)
    expect(first.result.current.stats.winDistribution[1]).toBe(1)
    first.unmount()

    const second = renderGame()
    expect(second.result.current.isGameWon).toBe(true)
    expect(second.result.current.stats.totalGames).toBe(1)
    expect(loadStats().totalGames).toBe(1)
  })

  it('records a loss after six wrong guesses', () => {
    const { result } = renderGame()
    for (const word of ['KNOPF', 'XENON', 'SITTE', 'FOYER', 'WRACK', 'KAKAO']) {
      play(result, word)
    }

    expect(result.current.isGameLost).toBe(true)
    expect(result.current.stats.gamesFailed).toBe(1)
    expect(result.current.stats.currentStreak).toBe(0)
  })

  it('refuses to switch hard mode on mid-game and keeps the stored setting', () => {
    const { result } = renderGame()
    play(result, 'KNOPF')

    act(() => result.current.handleHardMode(true))

    expect(result.current.isHardMode).toBe(false)
    expect(localStorage.getItem('gameMode')).not.toBe('hard')
  })
})
