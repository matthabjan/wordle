import {
  ALL_ROUNDS,
  type LeaderboardEntry,
  type LeaderboardIdentity,
  type LeaderboardTransport,
  type OverallLeaderboardEntry,
  type SubmittedResult,
} from './leaderboard'

// In-memory stand-in for the leaderboard backend, for tests. Mirrors the
// server rules the client depends on: the passphrase gate, one row per
// (date, name), and guess grids revealed only to players who have submitted
// for that date. `server/index.test.js` remains the source of truth for the
// real rules. `rounds` mirrors LEADERBOARD_ROUNDS; `unsupported` stands for a
// server from before rounds existed.
export const createInMemoryTransport = (
  passphrase: string,
  { rounds = 'year' }: { rounds?: 'year' | 'none' | 'unsupported' } = {},
) => {
  const rows = new Map<string, SubmittedResult & { name: string }>()
  const calls: string[] = []
  let online = true

  const failure = (identity: LeaderboardIdentity) => {
    if (!online) return 'unavailable' as const
    return identity.passphrase === passphrase ? null : ('unauthorized' as const)
  }

  const transport: LeaderboardTransport = {
    submitResult: async (identity, result) => {
      calls.push('submit')
      const failed = failure(identity)
      if (failed) return failed
      rows.set(`${result.date}\n${identity.name}`, {
        ...result,
        name: identity.name,
      })
      return 'ok'
    },

    dailyStandings: async (identity, date) => {
      calls.push('daily')
      const failed = failure(identity)
      if (failed) return { status: failed }

      const today = [...rows.values()].filter((row) => row.date === date)
      const viewerFinished = today.some((row) => row.name === identity.name)
      const entries = today
        .map((row): LeaderboardEntry => ({
          name: row.name,
          won: row.won,
          guessCount: row.guesses.length,
          ...(viewerFinished ? { guesses: row.guesses } : {}),
        }))
        .sort((a, b) =>
          a.won !== b.won ? (a.won ? -1 : 1) : a.guessCount - b.guessCount,
        )
      return { status: 'ok', entries }
    },

    overallStandings: async (identity, round) => {
      calls.push('overall')
      const failed = failure(identity)
      if (failed) return { status: failed }
      return { status: 'ok', entries: standingsFor(round) }
    },

    rounds: async (identity) => {
      const failed = failure(identity)
      if (failed) return { status: failed }
      if (rounds !== 'year') return { status: 'ok', mode: 'none', rounds: [] }

      const years = new Set(
        [...rows.values()].map((row) => row.date.slice(0, 4)),
      )
      return {
        status: 'ok',
        mode: 'year',
        rounds: [...years]
          .sort()
          .reverse()
          .map((id) => ({ id, top: standingsFor(id).slice(0, 3) })),
      }
    },
  }

  // Unlike the real server this takes no clock: without `round` it ranks
  // everything, which tests that care about rounds avoid by passing one.
  const standingsFor = (round?: string): OverallLeaderboardEntry[] => {
    const inRound = [...rows.values()].filter(
      (row) =>
        rounds !== 'year' ||
        !round ||
        round === ALL_ROUNDS ||
        row.date.startsWith(`${round}-`),
    )
    const byName = new Map<string, SubmittedResult[]>()
    for (const row of inRound) {
      byName.set(row.name, [...(byName.get(row.name) ?? []), row])
    }
    const entries = [...byName].map(([name, results]) => {
      const wins = results.filter((r) => r.won)
      const guessTotal = wins.reduce((sum, r) => sum + r.guesses.length, 0)
      return {
        name,
        points: wins.reduce((sum, r) => sum + 7 - r.guesses.length, 0),
        gamesPlayed: results.length,
        wins: wins.length,
        winRate: (100 * wins.length) / results.length,
        averageGuesses: wins.length ? guessTotal / wins.length : null,
      } satisfies OverallLeaderboardEntry
    })
    return entries.sort((a, b) => b.points - a.points)
  }

  return {
    transport,
    // Requests received so far, in order: 'submit' | 'daily' | 'overall'.
    calls,
    setOnline: (value: boolean) => {
      online = value
    },
    // Seeds another player's result directly.
    seed: (name: string, result: SubmittedResult) => {
      rows.set(`${result.date}\n${name}`, { ...result, name })
    },
  }
}
