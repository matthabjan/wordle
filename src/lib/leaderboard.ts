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

// A round is one calendar year of the overall ranking, identified by the year
// (`2026`). `ALL_ROUNDS` asks for the all-time ranking instead.
export const ALL_ROUNDS = 'all'

export type LeaderboardRound = {
  id: string
  // The first three of the round's standings.
  top: OverallLeaderboardEntry[]
}

// `mode: 'none'` means the server keeps one never-resetting ranking — either
// by configuration or because it predates rounds.
export type RoundsResult =
  { status: 'ok'; mode: 'year' | 'none'; rounds: LeaderboardRound[] } | Failure

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
  // Without `round` the server picks: the running round, or all-time when it
  // has no rounds.
  overallStandings: (
    identity: LeaderboardIdentity,
    round?: string,
  ) => Promise<OverallLeaderboardResult>
  rounds: (identity: LeaderboardIdentity) => Promise<RoundsResult>
}

const API_BASE = '/api'

// Sent as a header (not in the URL) so it stays out of access logs, history and
// referrers. Encoded because header values must be Latin-1.
const authHeaders = (passphrase: string) => ({
  Authorization: `Bearer ${encodeURIComponent(passphrase)}`,
})

const getJson = async <T>(
  path: string,
  query: Record<string, string>,
  passphrase: string,
): Promise<{ status: 'ok'; data: T } | { status: 'not_found' } | Failure> => {
  try {
    const url = new URL(`${API_BASE}${path}`, window.location.origin)
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url.toString(), {
      headers: authHeaders(passphrase),
    })
    if (response.status === 401) return { status: 'unauthorized' }
    if (response.status === 404) return { status: 'not_found' }
    if (!response.ok) return { status: 'unavailable' }

    return { status: 'ok', data: (await response.json()) as T }
  } catch {
    return { status: 'unavailable' }
  }
}

const getEntries = async <T>(
  path: string,
  query: Record<string, string>,
  passphrase: string,
): Promise<{ status: 'ok'; entries: T[] } | Failure> => {
  const result = await getJson<T[]>(path, query, passphrase)
  if (result.status === 'ok') return { status: 'ok', entries: result.data }
  return result.status === 'not_found' ? { status: 'unavailable' } : result
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
  overallStandings: (identity, round) =>
    getEntries<OverallLeaderboardEntry>(
      '/leaderboard/overall',
      round ? { name: identity.name, round } : { name: identity.name },
      identity.passphrase,
    ),
  rounds: async (identity) => {
    const result = await getJson<{
      mode?: unknown
      rounds?: LeaderboardRound[]
    }>('/leaderboard/rounds', { name: identity.name }, identity.passphrase)
    // A server from before rounds has no such route.
    if (result.status === 'not_found') {
      return { status: 'ok', mode: 'none', rounds: [] }
    }
    if (result.status !== 'ok') return result
    return result.data.mode === 'year' && Array.isArray(result.data.rounds)
      ? { status: 'ok', mode: 'year', rounds: result.data.rounds }
      : { status: 'ok', mode: 'none', rounds: [] }
  },
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

    overallStandings: async (
      round?: string,
    ): Promise<OverallLeaderboardResult> => {
      await submitIfUnconfirmed()
      const identity = readIdentity()
      if (!identity) return { status: 'unavailable' }
      return transport
        .overallStandings(identity, round)
        .catch((): Failure => ({ status: 'unavailable' }))
    },

    rounds: async (): Promise<RoundsResult> => {
      const identity = readIdentity()
      if (!identity) return { status: 'unavailable' }
      return transport
        .rounds(identity)
        .catch((): Failure => ({ status: 'unavailable' }))
    },
  }
}

export type Leaderboard = ReturnType<typeof createLeaderboard>

export const leaderboard = createLeaderboard(httpTransport)
