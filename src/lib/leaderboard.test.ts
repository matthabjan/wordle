import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { GameResult } from './game'
import { ALL_ROUNDS, createLeaderboard, httpTransport } from './leaderboard'
import { createInMemoryTransport } from './leaderboardInMemory'
import { getDateForSolutionIndex } from './words'

const PASSPHRASE = 'geheim'
const ADA = { name: 'Ada', passphrase: PASSPHRASE }
const TODAY = getDateForSolutionIndex(7)

const wonGame: GameResult = {
  solutionIndex: 7,
  guesses: ['KNOPF', 'KUGEL'],
  won: true,
  isHardMode: false,
}

const setup = () => {
  const server = createInMemoryTransport(PASSPHRASE)
  return { server, leaderboard: createLeaderboard(server.transport) }
}

// Lets a fire-and-forget submission settle.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('leaderboard participation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('joining stores the identity', async () => {
    const { leaderboard } = setup()

    expect(leaderboard.getIdentity()).toBeNull()
    expect(await leaderboard.join(ADA, TODAY)).toEqual({ status: 'joined' })
    expect(leaderboard.getIdentity()).toEqual(ADA)
  })

  test('a wrong passphrase is rejected and never stored', async () => {
    const { leaderboard } = setup()

    const result = await leaderboard.join({ ...ADA, passphrase: 'x' }, TODAY)

    expect(result).toEqual({ status: 'unauthorized' })
    expect(leaderboard.getIdentity()).toBeNull()
  })

  test('joining works while the server is unreachable', async () => {
    const { server, leaderboard } = setup()
    server.setOnline(false)

    expect(await leaderboard.join(ADA, TODAY)).toEqual({ status: 'joined' })
    expect(await leaderboard.dailyStandings(TODAY)).toEqual({
      status: 'unavailable',
    })
  })

  test('a finished game is submitted and shows up in the standings', async () => {
    const { leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)

    leaderboard.reportResult(wonGame)

    expect(await leaderboard.dailyStandings(TODAY)).toEqual({
      status: 'ok',
      entries: [
        { name: 'Ada', won: true, guessCount: 2, guesses: wonGame.guesses },
      ],
    })
  })

  test('a game finished before joining is submitted on the way in', async () => {
    const { server, leaderboard } = setup()
    server.seed('Ben', { date: TODAY, guesses: ['KUGEL'], won: true })

    leaderboard.reportResult(wonGame)
    await settle()
    expect(server.calls).toEqual([])

    await leaderboard.join(ADA, TODAY)
    const standings = await leaderboard.dailyStandings(TODAY)

    expect(standings).toMatchObject({
      status: 'ok',
      // Having submitted, Ada is also shown the other players' grids.
      entries: [
        { name: 'Ben', guesses: ['KUGEL'] },
        { name: 'Ada', guesses: wonGame.guesses },
      ],
    })
  })

  test('standings wait for a submission that is still in flight', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)
    server.calls.length = 0

    leaderboard.reportResult(wonGame)
    await leaderboard.dailyStandings(TODAY)

    expect(server.calls).toEqual(['submit', 'daily'])
  })

  test('a confirmed result is not submitted again', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)
    leaderboard.reportResult(wonGame)
    await leaderboard.dailyStandings(TODAY)
    server.calls.length = 0

    leaderboard.reportResult(wonGame)
    await leaderboard.dailyStandings(TODAY)
    await leaderboard.overallStandings()

    expect(server.calls).toEqual(['daily', 'overall'])
  })

  test('a failed submission is retried when standings are next requested', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)

    server.setOnline(false)
    leaderboard.reportResult(wonGame)
    expect(await leaderboard.dailyStandings(TODAY)).toEqual({
      status: 'unavailable',
    })

    server.setOnline(true)
    expect(await leaderboard.overallStandings()).toMatchObject({
      status: 'ok',
      entries: [{ name: 'Ada', points: 5, gamesPlayed: 1 }],
    })
  })

  test('an unfinished game is never submitted', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)
    server.seed('Ben', { date: TODAY, guesses: ['KUGEL'], won: true })

    const standings = await leaderboard.dailyStandings(TODAY)

    expect(server.calls).not.toContain('submit')
    // Not finished yet: Ben's result is listed, his grid is withheld.
    expect(standings).toEqual({
      status: 'ok',
      entries: [{ name: 'Ben', won: true, guessCount: 1 }],
    })
  })

  test('rejoining under another name submits the result under that name too', async () => {
    const { leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)
    leaderboard.reportResult(wonGame)
    await leaderboard.dailyStandings(TODAY)

    leaderboard.leave()
    expect(leaderboard.getIdentity()).toBeNull()
    await leaderboard.join({ name: 'Grace', passphrase: PASSPHRASE }, TODAY)

    const standings = await leaderboard.dailyStandings(TODAY)
    expect(standings).toMatchObject({
      entries: [{ name: 'Ada' }, { name: 'Grace' }],
    })
  })

  test('a passphrase that stopped working surfaces as unauthorized', async () => {
    const { leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)
    localStorage.setItem('leaderboardPassphrase', 'changed-on-server')

    leaderboard.reportResult(wonGame)

    expect(await leaderboard.dailyStandings(TODAY)).toEqual({
      status: 'unauthorized',
    })
  })

  test('never throws, even if the transport does', async () => {
    const boom = () => Promise.reject(new Error('boom'))
    const leaderboard = createLeaderboard({
      submitResult: boom,
      dailyStandings: boom,
      overallStandings: boom,
      rounds: boom,
    })

    expect(await leaderboard.join(ADA, TODAY)).toEqual({ status: 'joined' })
    expect(() => leaderboard.reportResult(wonGame)).not.toThrow()
    expect(await leaderboard.dailyStandings(TODAY)).toEqual({
      status: 'unavailable',
    })
    expect(await leaderboard.overallStandings()).toEqual({
      status: 'unavailable',
    })
    expect(await leaderboard.rounds()).toEqual({ status: 'unavailable' })
  })

  test('the overall ranking is split into yearly rounds', async () => {
    const { server, leaderboard } = setup()
    await leaderboard.join(ADA, TODAY)
    server.seed('Ada', { date: '2025-12-31', guesses: ['KUGEL'], won: true })
    server.seed('Ben', { date: '2026-01-01', guesses: ['KUGEL'], won: true })

    expect(await leaderboard.rounds()).toMatchObject({
      status: 'ok',
      mode: 'year',
      rounds: [
        { id: '2026', top: [{ name: 'Ben' }] },
        { id: '2025', top: [{ name: 'Ada' }] },
      ],
    })
    expect(await leaderboard.overallStandings('2025')).toMatchObject({
      entries: [{ name: 'Ada', points: 6 }],
    })
    expect(await leaderboard.overallStandings(ALL_ROUNDS)).toMatchObject({
      entries: [{ name: 'Ada' }, { name: 'Ben' }],
    })
  })
})

describe('http transport', () => {
  const identity = { name: 'Ada', passphrase: 'Wörtchen 100%' }
  const expectedAuth = `Bearer ${encodeURIComponent(identity.passphrase)}`

  const okResponse = () =>
    new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sends the passphrase as a header, never in the URL', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => okResponse())
    vi.stubGlobal('fetch', fetchMock)

    await httpTransport.dailyStandings(identity, '2026-07-18')
    await httpTransport.overallStandings(identity)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).not.toMatch(/passphrase/i)
      expect(String(url)).not.toContain(encodeURIComponent(identity.passphrase))
      expect(init.headers.Authorization).toBe(expectedAuth)
    }
  })

  test('treats a server without the rounds route as having no rounds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response('', { status: 404 })),
    )

    expect(await httpTransport.rounds(identity)).toEqual({
      status: 'ok',
      mode: 'none',
      rounds: [],
    })
  })

  test('asks for a specific round only when one is given', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => okResponse())
    vi.stubGlobal('fetch', fetchMock)

    await httpTransport.overallStandings(identity)
    await httpTransport.overallStandings(identity, '2026')

    const [first, second] = fetchMock.mock.calls.map(([url]) => String(url))
    expect(first).not.toContain('round=')
    expect(second).toContain('round=2026')
  })

  test('submit sends the passphrase as a header, not in the body', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const status = await httpTransport.submitResult(identity, {
      date: '2026-07-18',
      guesses: ['apfel'],
      won: true,
    })

    expect(status).toBe('ok')
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe(expectedAuth)
    expect(JSON.parse(init.body)).toEqual({
      name: 'Ada',
      date: '2026-07-18',
      guesses: ['apfel'],
      won: true,
    })
  })

  test('treats rate limiting as unavailable, not as a wrong passphrase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 429 })),
    )

    expect(await httpTransport.overallStandings(identity)).toEqual({
      status: 'unavailable',
    })
    expect(
      await httpTransport.submitResult(identity, {
        date: '2026-07-18',
        guesses: ['apfel'],
        won: true,
      }),
    ).toBe('unavailable')
  })

  test('reports a rejected submission and a network failure without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 401 })),
    )
    const result = { date: '2026-07-18', guesses: ['apfel'], won: true }
    expect(await httpTransport.submitResult(identity, result)).toBe(
      'unauthorized',
    )

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    expect(await httpTransport.submitResult(identity, result)).toBe(
      'unavailable',
    )
    expect(await httpTransport.dailyStandings(identity, '2026-07-18')).toEqual({
      status: 'unavailable',
    })
  })
})
