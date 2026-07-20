import { WORDS } from '../constants/wordlist'
import { VALID_GUESSES } from '../constants/validGuesses'
import { WRONG_SPOT_MESSAGE, NOT_CONTAINED_MESSAGE } from '../constants/strings'
import { getGuessStatuses } from './statuses'

const WORD_SET = new Set(WORDS.map((w) => w.toLowerCase()))
const GUESS_SET = new Set(VALID_GUESSES.map((w) => w.toLowerCase()))

export type WordOfDay = {
  solution: string
  solutionIndex: number
  tomorrow: number
}

export const isWordInWordList = (word: string) => {
  const lower = word.toLowerCase()
  return WORD_SET.has(lower) || GUESS_SET.has(lower)
}

export const isWinningWord = (word: string, solution: string) => {
  return solution === word
}

// build a set of previously revealed letters - present and correct
// guess must use correct letters in that space and any other revealed letters
// also check if all revealed instances of a letter are used (i.e. two C's)
export const findFirstUnusedReveal = (
  word: string,
  guesses: string[],
  solution: string,
) => {
  if (guesses.length === 0) {
    return false
  }

  const lettersLeftArray = new Array<string>()
  const guess = guesses[guesses.length - 1]
  const statuses = getGuessStatuses(guess, solution)

  for (let i = 0; i < guess.length; i++) {
    if (statuses[i] === 'correct' || statuses[i] === 'present') {
      lettersLeftArray.push(guess[i])
    }
    if (statuses[i] === 'correct' && word[i] !== guess[i]) {
      return WRONG_SPOT_MESSAGE(guess[i], i + 1)
    }
  }

  // check for the first unused letter, taking duplicate letters
  // into account - see issue #198
  let n
  for (const letter of word) {
    n = lettersLeftArray.indexOf(letter)
    if (n !== -1) {
      lettersLeftArray.splice(n, 1)
    }
  }

  if (lettersLeftArray.length > 0) {
    return NOT_CONTAINED_MESSAGE(lettersLeftArray[0])
  }
  return false
}

export const getWordOfDay = (now = new Date()): WordOfDay => {
  // February 9, 2026 Game Epoch (local midnight)
  const epoch = new Date(2026, 1, 9)
  const start = new Date(epoch)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  let index = 0
  while (start < today) {
    index++
    start.setDate(start.getDate() + 1)
  }

  const nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 1)

  return {
    solution: WORDS[index % WORDS.length].toUpperCase(),
    solutionIndex: index,
    tomorrow: nextDay.valueOf(),
  }
}
