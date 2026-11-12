import { describe, expect, it } from 'vitest'
import { WRONG_SPOT_MESSAGE } from '../constants/strings'
import {
  deleteLetter,
  Game,
  getGameResult,
  moveCursor,
  setCursor,
  setHardMode,
  startGame,
  submitGuess,
  typeLetter,
} from './game'

const SOLUTION = 'KUGEL'

const newGame = (
  overrides: { isHardMode?: boolean; guesses?: string[] } = {},
) =>
  startGame({
    solution: SOLUTION,
    solutionIndex: 7,
    isHardMode: false,
    ...overrides,
  })

const type = (game: Game, word: string) =>
  word.split('').reduce((g, letter) => typeLetter(g, letter), game)

// Types a word into the current row and submits it.
const play = (game: Game, word: string) => submitGuess(type(game, word))

const playAll = (game: Game, words: string[]) =>
  words.reduce((g, word) => play(g, word).game, game)

const row = (game: Game) => game.currentRow.map((l) => l ?? '_').join('')

describe('current row editing', () => {
  it('fills the row left to right', () => {
    const game = type(newGame(), 'KNO')
    expect(row(game)).toBe('KNO__')
    expect(game.cursor).toBe(3)
  })

  it('overwrites a middle letter when the cursor is moved', () => {
    const game = typeLetter(setCursor(type(newGame(), 'KNOPF'), 2), 'X')
    expect(row(game)).toBe('KNXPF')
    expect(game.cursor).toBe(3)
  })

  it('jumps to the next empty cell after filling a gap', () => {
    let game = type(newGame(), 'KN')
    game = setCursor(game, 3)
    game = typeLetter(game, 'P')
    expect(row(game)).toBe('KN_P_')
    expect(game.cursor).toBe(4)
    game = typeLetter(setCursor(game, 0), 'X')
    expect(game.cursor).toBe(2)
  })

  it('keeps the cursor on the last cell when the row is full', () => {
    const game = type(newGame(), 'KNOPFX')
    expect(row(game)).toBe('KNOPX')
    expect(game.cursor).toBe(4)
  })

  it('delete clears the current cell, then steps back', () => {
    let game = deleteLetter(type(newGame(), 'KNO'))
    expect(row(game)).toBe('KN___')
    expect(game.cursor).toBe(2)

    game = deleteLetter(setCursor(type(newGame(), 'KNOPF'), 1))
    expect(row(game)).toBe('K_OPF')
    expect(game.cursor).toBe(1)
  })

  it('delete on an empty first cell does nothing', () => {
    const game = newGame()
    expect(deleteLetter(game)).toBe(game)
  })

  it('clamps cursor movement to the row', () => {
    const game = newGame()
    expect(moveCursor(game, -1).cursor).toBe(0)
    expect(moveCursor(game, 9).cursor).toBe(4)
    expect(setCursor(game, 5)).toBe(game)
    expect(setCursor(game, -1)).toBe(game)
  })
})

describe('submitting a guess', () => {
  it('rejects an incomplete row', () => {
    const game = type(newGame(), 'KN')
    const result = submitGuess(game)
    expect(result.outcome).toEqual({
      kind: 'rejected',
      reason: 'not_enough_letters',
    })
    expect(result.game).toBe(game)
  })

  it('rejects a row with a gap in the middle', () => {
    const game = deleteLetter(setCursor(type(newGame(), 'KNOPF'), 2))
    expect(submitGuess(game).outcome).toEqual({
      kind: 'rejected',
      reason: 'not_enough_letters',
    })
  })

  it('rejects a word that is not in the word lists', () => {
    const game = type(newGame(), 'QQQQQ')
    const result = submitGuess(game)
    expect(result.outcome).toEqual({
      kind: 'rejected',
      reason: 'word_not_found',
    })
    expect(result.game).toBe(game)
  })

  it('accepts a valid guess and clears the current row', () => {
    const { game, outcome } = play(newGame(), 'KNOPF')
    expect(outcome).toEqual({ kind: 'accepted' })
    expect(game.guesses).toEqual(['KNOPF'])
    expect(game.status).toBe('playing')
    expect(row(game)).toBe('_____')
    expect(game.cursor).toBe(0)
  })

  it('wins when the guess is the solution', () => {
    const { game, outcome } = play(playAll(newGame(), ['KNOPF']), SOLUTION)
    expect(outcome).toEqual({ kind: 'won' })
    expect(game.status).toBe('won')
  })

  it('loses after six wrong guesses', () => {
    const wrong = ['KNOPF', 'XENON', 'SITTE', 'FOYER', 'WRACK']
    const before = playAll(newGame(), wrong)
    expect(before.status).toBe('playing')

    const { game, outcome } = play(before, 'KAKAO')
    expect(outcome).toEqual({ kind: 'lost' })
    expect(game.status).toBe('lost')
    expect(game.guesses).toHaveLength(6)
  })

  it('wins on the sixth guess', () => {
    const wrong = ['KNOPF', 'XENON', 'SITTE', 'FOYER', 'WRACK']
    expect(play(playAll(newGame(), wrong), SOLUTION).outcome).toEqual({
      kind: 'won',
    })
  })

  it('ignores all input once the game is over', () => {
    const won = play(newGame(), SOLUTION).game
    expect(typeLetter(won, 'A')).toBe(won)
    expect(deleteLetter(won)).toBe(won)
    expect(setCursor(won, 2)).toBe(won)
    expect(moveCursor(won, 1)).toBe(won)
    expect(submitGuess(won)).toEqual({
      game: won,
      outcome: { kind: 'ignored' },
    })
  })
})

describe('hard mode', () => {
  it('rejects a guess that drops a revealed letter, with the hint', () => {
    // KNOPF reveals K in position 1.
    const game = playAll(newGame({ isHardMode: true }), ['KNOPF'])
    const result = play(game, 'XENON')
    expect(result.outcome).toEqual({
      kind: 'rejected',
      reason: 'hard_mode',
      message: WRONG_SPOT_MESSAGE('K', 1),
    })
    expect(result.game.guesses).toEqual(['KNOPF'])
  })

  it('accepts the same guess when hard mode is off', () => {
    const game = playAll(newGame(), ['KNOPF'])
    expect(play(game, 'XENON').outcome).toEqual({ kind: 'accepted' })
  })

  it('can be switched on before the first guess', () => {
    const { game, allowed } = setHardMode(newGame(), true)
    expect(allowed).toBe(true)
    expect(game.isHardMode).toBe(true)
  })

  it('cannot be switched on after the first guess', () => {
    const game = playAll(newGame(), ['KNOPF'])
    const result = setHardMode(game, true)
    expect(result.allowed).toBe(false)
    expect(result.game).toBe(game)
  })

  it('can be switched off mid-game, but then not back on', () => {
    const game = playAll(newGame({ isHardMode: true }), ['KNOPF'])
    const off = setHardMode(game, false)
    expect(off.allowed).toBe(true)
    expect(off.game.isHardMode).toBe(false)
    expect(setHardMode(off.game, true).allowed).toBe(false)
  })
})

describe('restoring from saved guesses', () => {
  it('continues an unfinished game', () => {
    const game = newGame({ guesses: ['KNOPF', 'XENON'] })
    expect(game.status).toBe('playing')
    expect(play(game, SOLUTION).outcome).toEqual({ kind: 'won' })
  })

  it('restores a won game', () => {
    expect(newGame({ guesses: ['KNOPF', SOLUTION] }).status).toBe('won')
  })

  it('restores a lost game', () => {
    const guesses = ['KNOPF', 'XENON', 'SITTE', 'FOYER', 'WRACK', 'KAKAO']
    expect(newGame({ guesses }).status).toBe('lost')
  })
})

describe('result', () => {
  it('is null while playing', () => {
    expect(getGameResult(playAll(newGame(), ['KNOPF']))).toBeNull()
  })

  it('describes a won game', () => {
    const game = playAll(newGame({ isHardMode: true }), [SOLUTION])
    expect(getGameResult(game)).toEqual({
      solutionIndex: 7,
      guesses: [SOLUTION],
      won: true,
      isHardMode: true,
    })
  })

  it('describes a lost game', () => {
    const guesses = ['KNOPF', 'XENON', 'SITTE', 'FOYER', 'WRACK', 'KAKAO']
    expect(getGameResult(newGame({ guesses }))).toMatchObject({
      won: false,
      guesses,
    })
  })
})
