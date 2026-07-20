import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AlertProvider } from '../context/AlertContext'
import { useGameState } from './useGameState'
import { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AlertProvider>{children}</AlertProvider>
)

describe('useGameState cursor entry', () => {
  it('overwrites a middle letter when cursor is moved', () => {
    const { result } = renderHook(
      () =>
        useGameState({
          solution: 'ABCDE',
          solutionIndex: 0,
          onOpenStats: () => undefined,
        }),
      { wrapper },
    )

    act(() => {
      result.current.onChar('A')
      result.current.onChar('B')
      result.current.onChar('C')
      result.current.onChar('D')
      result.current.onChar('E')
    })

    expect(result.current.currentGuess.join('')).toBe('ABCDE')

    act(() => {
      result.current.setCursor(2)
      result.current.onChar('X')
    })

    expect(result.current.currentGuess.join('')).toBe('ABXDE')
  })

  it('delete clears current cell then moves back', () => {
    const { result } = renderHook(
      () =>
        useGameState({
          solution: 'ABCDE',
          solutionIndex: 0,
          onOpenStats: () => undefined,
        }),
      { wrapper },
    )

    act(() => {
      result.current.onChar('A')
      result.current.onChar('B')
      result.current.onChar('C')
    })

    expect(result.current.cursorIndex).toBe(3)

    act(() => {
      result.current.onDelete()
    })

    // cursor was on empty cell 3 → moves to 2 and clears C
    expect(result.current.currentGuess.slice(0, 3)).toEqual(['A', 'B', null])
    expect(result.current.cursorIndex).toBe(2)
  })

  it('blocks enter until the row is full', () => {
    const { result } = renderHook(
      () =>
        useGameState({
          solution: 'ABCDE',
          solutionIndex: 0,
          onOpenStats: () => undefined,
        }),
      { wrapper },
    )

    act(() => {
      result.current.onChar('A')
      result.current.onChar('B')
      result.current.onEnter()
    })

    expect(result.current.guesses).toHaveLength(0)
    expect(result.current.currentRowClass).toBe('jiggle')
  })
})
