import { getGuessStatuses } from './statuses'
import { GAME_TITLE } from '../constants/strings'
import { getStoredIsHighContrastMode, getStoredTheme } from './localStorage'
import { MAX_CHALLENGES } from '../constants/settings'

const buildShareText = (
  guesses: string[],
  lost: boolean,
  isHardMode: boolean,
  solutionIndex: number,
  solution: string,
  withSpoilers = false,
) => {
  const header = `${GAME_TITLE} ${solutionIndex} ${
    lost ? 'X' : guesses.length
  }/${MAX_CHALLENGES}${isHardMode ? '*' : ''}`

  if (withSpoilers) {
    return (
      `${header}\n\n` +
      guesses
        .map((guess) => `${generateEmojiGridLine(guess, solution)} ${guess}`)
        .join('\n')
    )
  }

  return `${header}\n\n${generateEmojiGrid(guesses, solution)}`
}

const writeToClipboard = async (text: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API unavailable')
  }
  await navigator.clipboard.writeText(text)
}

export const shareStatus = async (
  guesses: string[],
  lost: boolean,
  isHardMode: boolean,
  solutionIndex: number,
  solution: string,
) => {
  const text = buildShareText(
    guesses,
    lost,
    isHardMode,
    solutionIndex,
    solution,
  )

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared' as const
    } catch (error) {
      // User cancelled share sheet — not an error worth surfacing
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled' as const
      }
    }
  }

  await writeToClipboard(text)
  return 'copied' as const
}

export const shareStatusWithBBCode = async (
  guesses: string[],
  lost: boolean,
  isHardMode: boolean,
  solutionIndex: number,
  solution: string,
) => {
  const text = buildShareText(
    guesses,
    lost,
    isHardMode,
    solutionIndex,
    solution,
    true,
  )
  await writeToClipboard(text)
  return 'copied' as const
}

function generateEmojiGridLine(guess: string, solution: string) {
  const status = getGuessStatuses(guess, solution)
  const isHighContrast = getStoredIsHighContrastMode()
  const isDark = getStoredTheme() === true

  return guess
    .split('')
    .map((_letter, i) => {
      switch (status[i]) {
        case 'correct':
          return isHighContrast ? '🟧' : '🟩'
        case 'present':
          return isHighContrast ? '🟦' : '🟨'
        default:
          return isDark ? '⬛' : '⬜'
      }
    })
    .join('')
}

export const generateEmojiGrid = (guesses: string[], solution: string) => {
  return guesses
    .map((guess) => generateEmojiGridLine(guess, solution))
    .join('\n')
}
