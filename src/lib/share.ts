import { getGuessStatuses } from './statuses'
import { solutionIndex } from './words'
import { GAME_TITLE } from '../constants/strings'
import { getStoredIsHighContrastMode } from './localStorage'
import { MAX_CHALLENGES } from '../constants/settings'

export const shareStatus = (
  guesses: string[],
  lost: boolean,
  isHardMode: boolean
) => {
  navigator.clipboard.writeText(
    `${GAME_TITLE} ${solutionIndex} ${
      lost ? 'X' : guesses.length
    }/${MAX_CHALLENGES}${isHardMode ? '*' : ''}\n\n${generateEmojiGrid(
      guesses
    )}\n\nhttps://wordle.mn11.net`
  )
}

export const shareStatusWithBBCode = (
  guesses: string[],
  lost: boolean,
  isHardMode: boolean
) => {
  navigator.clipboard.writeText(
    `${GAME_TITLE}` +
      solutionIndex +
      ' ' +
      (lost ? 'X' : guesses.length) +
      `/${MAX_CHALLENGES}${isHardMode ? '*' : ''}\n\n` +
      guesses
        .map(
          (guess) =>
            `${generateEmojiGridLine(guess)} ${guess}`
        )
        .join('\n')
  )
}

function generateEmojiGridLine(guess: string) {
  const status = getGuessStatuses(guess)
  const isHighContrast = getStoredIsHighContrastMode()
  return guess
    .split('')
    .map((letter, i) => {
      switch (status[i]) {
        case 'correct':
          if (isHighContrast) {
            return '🟧'
          }
          return '🟩'
        case 'present':
          if (isHighContrast) {
            return '🟦'
          }
          return '🟨'
        default:
          if (localStorage.getItem('theme') === 'dark') {
            return '⬛'
          }
          return '⬜'
      }
    })
    .join('')
}

export const generateEmojiGrid = (guesses: string[]) => {
  return guesses.map(generateEmojiGridLine).join('\n')
}
