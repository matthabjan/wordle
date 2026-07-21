import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from './index.js'

const PASSPHRASE = 'test-secret'

const submitResult = (app, result) =>
  app.inject({
    method: 'POST',
    url: '/api/results',
    payload: {
      passphrase: PASSPHRASE,
      ...result,
    },
  })

test('returns server-derived overall leaderboard statistics', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
  })
  t.after(() => app.close())

  const results = [
    {
      date: '2026-07-18',
      name: 'Ada',
      guesses: ['APPLE'],
      won: true,
    },
    {
      date: '2026-07-19',
      name: 'Ada',
      guesses: ['APPLE', 'BRAVE', 'CRANE'],
      won: true,
    },
    {
      date: '2026-07-20',
      name: 'Ada',
      guesses: ['APPLE', 'BRAVE', 'CRANE', 'DREAM', 'EARTH', 'FLAME'],
      won: false,
    },
    {
      date: '2026-07-19',
      name: 'Ben',
      guesses: ['APPLE', 'BRAVE'],
      won: true,
    },
    {
      date: '2026-07-20',
      name: 'Ben',
      guesses: ['APPLE', 'BRAVE', 'CRANE', 'DREAM', 'EARTH', 'FLAME'],
      won: false,
    },
  ]

  for (const result of results) {
    const response = await submitResult(app, result)
    assert.equal(response.statusCode, 204)
  }

  const response = await app.inject({
    method: 'GET',
    url: '/api/leaderboard/overall',
    query: {
      passphrase: PASSPHRASE,
      name: 'Ada',
    },
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), [
    {
      name: 'Ada',
      gamesPlayed: 3,
      wins: 2,
      points: 10,
      winRate: 66.7,
      averageGuesses: 2,
    },
    {
      name: 'Ben',
      gamesPlayed: 2,
      wins: 1,
      points: 5,
      winRate: 50,
      averageGuesses: 2,
    },
  ])
})

test('upserts a day instead of double-counting it', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
  })
  t.after(() => app.close())

  await submitResult(app, {
    date: '2026-07-20',
    name: 'Ada',
    guesses: ['APPLE', 'BRAVE'],
    won: false,
  })
  await submitResult(app, {
    date: '2026-07-20',
    name: 'Ada',
    guesses: ['APPLE', 'BRAVE'],
    won: true,
  })

  const response = await app.inject({
    method: 'GET',
    url: '/api/leaderboard/overall',
    query: {
      passphrase: PASSPHRASE,
      name: 'Ada',
    },
  })

  assert.deepEqual(response.json(), [
    {
      name: 'Ada',
      gamesPlayed: 1,
      wins: 1,
      points: 5,
      winRate: 100,
      averageGuesses: 2,
    },
  ])
})

test('rejects an invalid passphrase for overall results', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
  })
  t.after(() => app.close())

  const response = await app.inject({
    method: 'GET',
    url: '/api/leaderboard/overall',
    query: {
      passphrase: 'wrong',
      name: 'Ada',
    },
  })

  assert.equal(response.statusCode, 401)
  assert.deepEqual(response.json(), { error: 'invalid_passphrase' })
})
