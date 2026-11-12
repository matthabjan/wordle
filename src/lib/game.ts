import { MAX_CHALLENGES, MAX_WORD_LENGTH } from '../constants/settings'
import { findFirstUnusedReveal, isWordInWordList } from './words'

export type GameStatus = 'playing' | 'won' | 'lost'

// One player's attempt at one day's solution. Immutable: every operation
// returns the next game. Knows nothing about time, React or storage.
export type Game = {
  solution: string
  solutionIndex: number
  guesses: string[]
  status: GameStatus
  currentRow: (string | null)[]
  cursor: number
  isHardMode: boolean
}

export type GameResult = {
  solutionIndex: number
  guesses: string[]
  won: boolean
  isHardMode: boolean
}

export type SubmitOutcome =
  | { kind: 'ignored' }
  | { kind: 'rejected'; reason: 'not_enough_letters' | 'word_not_found' }
  // `message` is the ready-made hint from findFirstUnusedReveal.
  | { kind: 'rejected'; reason: 'hard_mode'; message: string }
  | { kind: 'accepted' }
  | { kind: 'won' }
  | { kind: 'lost' }

const emptyRow = (): (string | null)[] =>
  Array.from({ length: MAX_WORD_LENGTH }, () => null)

const statusFor = (guesses: string[], solution: string): GameStatus => {
  if (guesses.includes(solution)) return 'won'
  return guesses.length >= MAX_CHALLENGES ? 'lost' : 'playing'
}

// Starts a fresh game, or restores one from previously submitted guesses.
export const startGame = (params: {
  solution: string
  solutionIndex: number
  isHardMode: boolean
  guesses?: string[]
}): Game => {
  const guesses = params.guesses ?? []
  return {
    solution: params.solution,
    solutionIndex: params.solutionIndex,
    guesses,
    status: statusFor(guesses, params.solution),
    currentRow: emptyRow(),
    cursor: 0,
    isHardMode: params.isHardMode,
  }
}

// Writes the letter at the cursor, then jumps to the next empty cell to the
// right (or one step right when the rest of the row is already filled).
export const typeLetter = (game: Game, letter: string): Game => {
  if (game.status !== 'playing') return game

  const currentRow = [...game.currentRow]
  currentRow[game.cursor] = letter

  const nextEmpty = currentRow.indexOf(null, game.cursor + 1)
  const cursor =
    nextEmpty !== -1
      ? nextEmpty
      : Math.min(game.cursor + 1, MAX_WORD_LENGTH - 1)

  return { ...game, currentRow, cursor }
}

// Clears the cell at the cursor; on an empty cell, steps back and clears that.
export const deleteLetter = (game: Game): Game => {
  if (game.status !== 'playing') return game

  const currentRow = [...game.currentRow]
  if (currentRow[game.cursor] !== null) {
    currentRow[game.cursor] = null
    return { ...game, currentRow }
  }
  if (game.cursor > 0) {
    const cursor = game.cursor - 1
    currentRow[cursor] = null
    return { ...game, currentRow, cursor }
  }
  return game
}

export const setCursor = (game: Game, index: number): Game => {
  if (game.status !== 'playing') return game
  if (index < 0 || index >= MAX_WORD_LENGTH) return game
  return { ...game, cursor: index }
}

export const moveCursor = (game: Game, delta: number): Game => {
  if (game.status !== 'playing') return game
  const cursor = Math.max(0, Math.min(MAX_WORD_LENGTH - 1, game.cursor + delta))
  return { ...game, cursor }
}

// Submits the current row as a guess. A rejected or ignored submission
// returns the game unchanged.
export const submitGuess = (
  game: Game,
): { game: Game; outcome: SubmitOutcome } => {
  if (game.status !== 'playing') return { game, outcome: { kind: 'ignored' } }

  if (game.currentRow.some((letter) => letter === null)) {
    return {
      game,
      outcome: { kind: 'rejected', reason: 'not_enough_letters' },
    }
  }

  const guess = game.currentRow.join('')

  if (!isWordInWordList(guess)) {
    return { game, outcome: { kind: 'rejected', reason: 'word_not_found' } }
  }

  if (game.isHardMode) {
    const message = findFirstUnusedReveal(guess, game.guesses, game.solution)
    if (message) {
      return {
        game,
        outcome: { kind: 'rejected', reason: 'hard_mode', message },
      }
    }
  }

  const guesses = [...game.guesses, guess]
  const status = statusFor(guesses, game.solution)

  return {
    game: { ...game, guesses, status, currentRow: emptyRow(), cursor: 0 },
    outcome: { kind: status === 'playing' ? 'accepted' : status },
  }
}

// Hard mode can always be switched off, but only switched on before the
// first guess. A refused change returns the game unchanged.
export const setHardMode = (
  game: Game,
  isHardMode: boolean,
): { game: Game; allowed: boolean } => {
  if (game.guesses.length > 0 && !game.isHardMode) {
    return { game, allowed: false }
  }
  return { game: { ...game, isHardMode }, allowed: true }
}

// The result of a finished game; null while it is still being played.
export const getGameResult = (game: Game): GameResult | null => {
  if (game.status === 'playing') return null
  return {
    solutionIndex: game.solutionIndex,
    guesses: game.guesses,
    won: game.status === 'won',
    isHardMode: game.isHardMode,
  }
}
