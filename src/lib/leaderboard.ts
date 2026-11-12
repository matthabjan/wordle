import type { GameResult } from './game'
import { getDateForSolutionIndex } from './words'

const NAME_KEY = 'leaderboardName'
const PASSPHRASE_KEY = 'leaderboardPassphrase'

export type LeaderboardIdentity = {
  name: string
  passphrase: string
}

export type LeaderboardEntry = {
  name: string
  won: boolean
  guessCount: number
  guesses?: string[]
}

export type OverallLeaderboardEntry = {
  name: string
  points: number
  gamesPlayed: number
  wins: number
  winRate: number
  averageGuesses: number | null
}

type Failure = { status: 'unauthorized' } | { status: 'unavailable' }

export type LeaderboardResult =
  { status: 'ok'; entries: LeaderboardEntry[] } | Failure

export type OverallLeaderboardResult =
  { status: 'ok'; entries: OverallLeaderboardEntry[] } | Failure

export type SubmittedResult = {
  date: string
  guesses: string[]
  won: boolean
}

// The seam to the leaderboard backend. Adapters never throw: every failure is
// reported as `unauthorized` or `unavailable`.
export type LeaderboardTransport = {
  submitResult: (
    identity: LeaderboardIdentity,
    result: SubmittedResult,
  ) => Promise<'ok' | Failure['status']>
  dailyStandings: (
    identity: LeaderboardIdentity,
    date: string,
  ) => Promise<LeaderboardResult>
  overallStandings: (
    identity: LeaderboardIdentity,
  ) => Promise<OverallLeaderboardResult>
}

const API_BASE = '/api'

// Sent as a header (not in the URL) so it stays out of access logs, history and
// referrers. Encoded because header values must be Latin-1.
const authHeaders = (passphrase: string) => ({
  Authorization: `Bearer ${encodeURIComponent(passphrase)}`,
})

const getEntries = async <T>(
  path: string,
  query: Record<string, string>,
  passphrase: string,
): Promise<{ status: 'ok'; entries: T[] } | Failure> => {
  try {
    const url = new URL(`${API_BASE}${path}`, window.location.origin)
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url.toString(), {
      headers: authHeaders(passphrase),
    })
    if (response.status === 401) return { status: 'unauthorized' }
    if (!response.ok) return { status: 'unavailable' }

    return { status: 'ok', entries: (await response.json()) as T[] }
  } catch {
    return { status: 'unavailable' }
  }
}

export const httpTransport: LeaderboardTransport = {
  submitResult: async (identity, result) => {
    try {
      const response = await fetch(`${API_BASE}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(identity.passphrase),
        },
        body: JSON.stringify({ name: identity.name, ...result }),
      })
      if (response.status === 401) return 'unauthorized'
      return response.ok ? 'ok' : 'unavailable'
    } catch {
      return 'unavailable'
    }
  },
  dailyStandings: (identity, date) =>
    getEntries<LeaderboardEntry>(
      '/leaderboard',
      { date, name: identity.name },
      identity.passphrase,
    ),
  overallStandings: (identity) =>
    getEntries<OverallLeaderboardEntry>(
      '/leaderboard/overall',
      { name: identity.name },
      identity.passphrase,
    ),
}

const readIdentity = (): LeaderboardIdentity | null => {
  const name = localStorage.getItem(NAME_KEY)
  const passphrase = localStorage.getItem(PASSPHRASE_KEY)
  if (!name || !passphrase) return null
  return { name, passphrase }
}

// A player's participation in the leaderboard: who they are, whether today's
// result has reached the server, and the standings they may see.
//
// Best-effort throughout — the core game must work even if the backend is
// unreachable, so nothing here throws and failed submissions are simply
// retried the next time standings are requested.
export const createLeaderboard = (transport: LeaderboardTransport) => {
  let finished: SubmittedResult | null = null
  // `name` + date of the submission the server has accepted, if any.
  let confirmed: string | null = null
  let pending: Promise<void> | null = null

  const submitIfUnconfirmed = async (): Promise<void> => {
    const identity = readIdentity()
    if (!identity || !finished) return

    const key = `${identity.name}\n${finished.date}`
    if (confirmed === key) return

    if (!pending) {
      const result = finished
      pending = transport
        .submitResult(identity, result)
        .then((status) => {
          if (status === 'ok') confirmed = key
        })
        .catch(() => undefined)
        .finally(() => {
          pending = null
        })
    }
    await pending
  }

  return {
    getIdentity: readIdentity,

    // Checks the passphrase against the server before storing the identity, so
    // a wrong one is never kept. An unreachable server does not block joining.
    join: async (
      candidate: LeaderboardIdentity,
      date: string,
    ): Promise<{ status: 'joined' | 'unauthorized' }> => {
      const check = await transport
        .dailyStandings(candidate, date)
        .catch((): Failure => ({ status: 'unavailable' }))
      if (check.status === 'unauthorized') return { status: 'unauthorized' }

      localStorage.setItem(NAME_KEY, candidate.name)
      localStorage.setItem(PASSPHRASE_KEY, candidate.passphrase)
      return { status: 'joined' }
    },

    leave: () => {
      localStorage.removeItem(NAME_KEY)
      localStorage.removeItem(PASSPHRASE_KEY)
      confirmed = null
    },

    // Tells the leaderboard that today's game is finished. Safe to call
    // repeatedly and before joining: the result is remembered and submitted
    // once there is an identity.
    reportResult: (result: GameResult) => {
      finished = {
        date: getDateForSolutionIndex(result.solutionIndex),
        guesses: result.guesses,
        won: result.won,
      }
      void submitIfUnconfirmed()
    },

    // Standings are only fetched once a finished game has been submitted (or
    // the attempt has failed), so the player's own entry and the grids the
    // server reveals to finished players are included.
    dailyStandings: async (date: string): Promise<LeaderboardResult> => {
      await submitIfUnconfirmed()
      const identity = readIdentity()
      if (!identity) return { status: 'unavailable' }
      return transport
        .dailyStandings(identity, date)
        .catch((): Failure => ({ status: 'unavailable' }))
    },

    overallStandings: async (): Promise<OverallLeaderboardResult> => {
      await submitIfUnconfirmed()
      const identity = readIdentity()
      if (!identity) return { status: 'unavailable' }
      return transport
        .overallStandings(identity)
        .catch((): Failure => ({ status: 'unavailable' }))
    },
  }
}

export type Leaderboard = ReturnType<typeof createLeaderboard>

export const leaderboard = createLeaderboard(httpTransport)
