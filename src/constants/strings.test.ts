import { expect, test } from 'vitest'
import { MAX_CHALLENGES } from './settings'
import { WIN_MESSAGE, WIN_MESSAGE_MAX_LENGTH, WIN_MESSAGES } from './strings'

test('there are win phrases for every possible number of guesses', () => {
  expect(WIN_MESSAGES).toHaveLength(MAX_CHALLENGES)
  for (const phrases of WIN_MESSAGES) {
    expect(phrases.length).toBeGreaterThan(0)
  }
})

test('win phrases are short enough for one headline line', () => {
  for (const phrase of WIN_MESSAGES.flat()) {
    expect(phrase.length, phrase).toBeLessThanOrEqual(WIN_MESSAGE_MAX_LENGTH)
  }
})

test('the phrase depends on the score and stays the same for a game', () => {
  expect(WIN_MESSAGES[0]).toContain(WIN_MESSAGE(276, 1))
  expect(WIN_MESSAGES[5]).toContain(WIN_MESSAGE(276, 6))
  expect(WIN_MESSAGE(276, 4)).toBe(WIN_MESSAGE(276, 4))
})
