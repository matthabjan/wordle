import { afterEach, vi } from 'vitest'
import {
  fetchLeaderboard,
  fetchOverallLeaderboard,
  submitLeaderboardResult,
} from './leaderboard'

const identity = { name: 'Ada', passphrase: 'Wörtchen 100%' }
const expectedAuth = `Bearer ${encodeURIComponent(identity.passphrase)}`

const okResponse = () =>
  new Response('[]', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('leaderboard requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('send the passphrase as a header, never in the URL', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => okResponse())
    vi.stubGlobal('fetch', fetchMock)

    await fetchLeaderboard({ identity, date: '2026-07-18' })
    await fetchOverallLeaderboard({ identity })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).not.toMatch(/passphrase/i)
      expect(String(url)).not.toContain(encodeURIComponent(identity.passphrase))
      expect(init.headers.Authorization).toBe(expectedAuth)
    }
  })

  test('submit sends the passphrase as a header, not in the body', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await submitLeaderboardResult({
      identity,
      date: '2026-07-18',
      guesses: ['apfel'],
      won: true,
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe(expectedAuth)
    expect(JSON.parse(init.body)).toEqual({
      name: 'Ada',
      date: '2026-07-18',
      guesses: ['apfel'],
      won: true,
    })
  })

  test('treat rate limiting as unavailable, not as a wrong passphrase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 429 })),
    )

    expect(await fetchOverallLeaderboard({ identity })).toEqual({
      status: 'unavailable',
    })
  })
})
