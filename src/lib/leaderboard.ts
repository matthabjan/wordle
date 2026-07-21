const API_BASE = '/api'

const NAME_KEY = 'leaderboardName'
const PASSPHRASE_KEY = 'leaderboardPassphrase'

export type LeaderboardIdentity = {
  name: string
  passphrase: string
}

export const getLeaderboardIdentity = (): LeaderboardIdentity | null => {
  const name = localStorage.getItem(NAME_KEY)
  const passphrase = localStorage.getItem(PASSPHRASE_KEY)
  if (!name || !passphrase) return null
  return { name, passphrase }
}

export const setLeaderboardIdentity = (identity: LeaderboardIdentity) => {
  localStorage.setItem(NAME_KEY, identity.name)
  localStorage.setItem(PASSPHRASE_KEY, identity.passphrase)
}

export const clearLeaderboardIdentity = () => {
  localStorage.removeItem(NAME_KEY)
  localStorage.removeItem(PASSPHRASE_KEY)
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

// Best-effort — the core single-player game must work even if this backend
// is unreachable, so submission failures (offline, server down) are swallowed.
export const submitLeaderboardResult = async (params: {
  identity: LeaderboardIdentity
  date: string
  guesses: string[]
  won: boolean
}): Promise<void> => {
  try {
    await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passphrase: params.identity.passphrase,
        name: params.identity.name,
        date: params.date,
        guesses: params.guesses,
        won: params.won,
      }),
    })
  } catch {
    // Backend unreachable — leaderboard entry is missing for today, which is fine.
  }
}

export type LeaderboardResult =
  | { status: 'ok'; entries: LeaderboardEntry[] }
  | { status: 'unauthorized' }
  | { status: 'unavailable' }

export type OverallLeaderboardResult =
  | { status: 'ok'; entries: OverallLeaderboardEntry[] }
  | { status: 'unauthorized' }
  | { status: 'unavailable' }

export const fetchLeaderboard = async (params: {
  identity: LeaderboardIdentity
  date: string
}): Promise<LeaderboardResult> => {
  try {
    const url = new URL(`${API_BASE}/leaderboard`, window.location.origin)
    url.searchParams.set('date', params.date)
    url.searchParams.set('name', params.identity.name)
    url.searchParams.set('passphrase', params.identity.passphrase)

    const response = await fetch(url.toString())
    if (response.status === 401) return { status: 'unauthorized' }
    if (!response.ok) return { status: 'unavailable' }

    const entries = (await response.json()) as LeaderboardEntry[]
    return { status: 'ok', entries }
  } catch {
    return { status: 'unavailable' }
  }
}

export const fetchOverallLeaderboard = async (params: {
  identity: LeaderboardIdentity
}): Promise<OverallLeaderboardResult> => {
  try {
    const url = new URL(
      `${API_BASE}/leaderboard/overall`,
      window.location.origin,
    )
    url.searchParams.set('name', params.identity.name)
    url.searchParams.set('passphrase', params.identity.passphrase)

    const response = await fetch(url.toString())
    if (response.status === 401) return { status: 'unauthorized' }
    if (!response.ok) return { status: 'unavailable' }

    const entries = (await response.json()) as OverallLeaderboardEntry[]
    return { status: 'ok', entries }
  } catch {
    return { status: 'unavailable' }
  }
}
