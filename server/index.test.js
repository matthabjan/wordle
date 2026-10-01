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

const bearer = (passphrase) => ({
  authorization: `Bearer ${encodeURIComponent(passphrase)}`,
})

const overall = (app, options = {}) =>
  app.inject({
    method: 'GET',
    url: '/api/leaderboard/overall?name=Ada',
    ...options,
  })

test('accepts the passphrase from the Authorization header', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
  })
  t.after(() => app.close())

  const post = await app.inject({
    method: 'POST',
    url: '/api/results',
    headers: bearer(PASSPHRASE),
    payload: {
      date: '2026-07-18',
      name: 'Ada',
      guesses: ['APPLE'],
      won: true,
    },
  })
  assert.equal(post.statusCode, 204)

  const get = await overall(app, { headers: bearer(PASSPHRASE) })
  assert.equal(get.statusCode, 200)
  assert.equal(get.json()[0].name, 'Ada')
})

test('supports passphrases with non-Latin-1 characters in the header', async (t) => {
  const passphrase = 'Wörtchen 🎯 100%'
  const app = buildApp({ dbPath: ':memory:', passphrase, logger: false })
  t.after(() => app.close())

  assert.equal(
    (await overall(app, { headers: bearer(passphrase) })).statusCode,
    200,
  )
  assert.equal(
    (await overall(app, { headers: bearer('Wörtchen') })).statusCode,
    401,
  )
})

test('rejects a wrong or malformed Authorization header even with a valid legacy parameter', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
    maxFailures: 0,
  })
  t.after(() => app.close())

  for (const authorization of [
    'Bearer wrong',
    'Bearer %E0%A4%A',
    'Basic abc',
  ]) {
    const response = await overall(app, {
      url: `/api/leaderboard/overall?name=Ada&passphrase=${PASSPHRASE}`,
      headers: { authorization },
    })
    assert.equal(response.statusCode, 401, authorization)
  }
})

test('legacy query/body passphrase works unless disabled', async (t) => {
  const legacy = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
  })
  const strict = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
    allowLegacyAuth: false,
  })
  t.after(() => Promise.all([legacy.close(), strict.close()]))

  const url = `/api/leaderboard/overall?name=Ada&passphrase=${PASSPHRASE}`
  assert.equal((await overall(legacy, { url })).statusCode, 200)
  assert.equal((await overall(strict, { url })).statusCode, 401)
  assert.equal(
    (await overall(strict, { headers: bearer(PASSPHRASE) })).statusCode,
    200,
  )
})

test('blocks a client after too many failed attempts, per client address', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
    maxFailures: 3,
  })
  t.after(() => app.close())

  const from = (remoteAddress, passphrase) =>
    overall(app, { remoteAddress, headers: bearer(passphrase) })

  for (let i = 0; i < 3; i += 1) {
    assert.equal((await from('10.0.0.1', 'wrong')).statusCode, 401)
  }

  const blocked = await from('10.0.0.1', PASSPHRASE)
  assert.equal(blocked.statusCode, 429)
  assert.deepEqual(blocked.json(), { error: 'too_many_attempts' })
  assert.ok(Number(blocked.headers['retry-after']) > 0)

  assert.equal((await from('10.0.0.2', PASSPHRASE)).statusCode, 200)
})

test('the failed-attempt block expires after the window', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
    maxFailures: 1,
    windowMs: 50,
  })
  t.after(() => app.close())

  assert.equal(
    (await overall(app, { headers: bearer('wrong') })).statusCode,
    401,
  )
  assert.equal(
    (await overall(app, { headers: bearer(PASSPHRASE) })).statusCode,
    429,
  )

  await new Promise((resolve) => setTimeout(resolve, 80))
  assert.equal(
    (await overall(app, { headers: bearer(PASSPHRASE) })).statusCode,
    200,
  )
})

test('keys the limiter on the forwarded client address when proxies are trusted', async (t) => {
  const app = buildApp({
    dbPath: ':memory:',
    passphrase: PASSPHRASE,
    logger: false,
    maxFailures: 2,
    trustProxy: '172.16.0.0/12',
  })
  t.after(() => app.close())

  const via = (client, passphrase) =>
    overall(app, {
      remoteAddress: '172.18.0.5',
      headers: { ...bearer(passphrase), 'x-forwarded-for': client },
    })

  await via('203.0.113.7', 'wrong')
  await via('203.0.113.7', 'wrong')
  assert.equal((await via('203.0.113.7', PASSPHRASE)).statusCode, 429)
  assert.equal((await via('198.51.100.9', PASSPHRASE)).statusCode, 200)
})
