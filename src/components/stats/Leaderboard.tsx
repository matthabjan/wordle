import { useEffect, useState } from 'react'
import {
  LEADERBOARD_AVERAGE_LABEL,
  LEADERBOARD_CHANGE_IDENTITY_TEXT,
  LEADERBOARD_DAILY_TAB_TEXT,
  LEADERBOARD_EMPTY_TEXT,
  LEADERBOARD_GAMES_LABEL,
  LEADERBOARD_JOIN_BUTTON,
  LEADERBOARD_JOINING_TEXT,
  LEADERBOARD_LOST_LABEL,
  LEADERBOARD_MISSING_FIELDS_MESSAGE,
  LEADERBOARD_NAME_LABEL,
  LEADERBOARD_OVERALL_EMPTY_TEXT,
  LEADERBOARD_OVERALL_TAB_TEXT,
  LEADERBOARD_PASSPHRASE_LABEL,
  LEADERBOARD_POINTS_LABEL,
  LEADERBOARD_SETUP_INTRO,
  LEADERBOARD_TITLE,
  LEADERBOARD_UNAVAILABLE_TEXT,
  LEADERBOARD_WINS_LABEL,
  LEADERBOARD_WRONG_PASSPHRASE_MESSAGE,
  LEADERBOARD_YOU_SUFFIX,
} from '../../constants/strings'
import {
  clearLeaderboardIdentity,
  fetchLeaderboard,
  fetchOverallLeaderboard,
  getLeaderboardIdentity,
  setLeaderboardIdentity,
  type LeaderboardEntry,
  type LeaderboardIdentity,
  type OverallLeaderboardEntry,
} from '../../lib/leaderboard'
import { generateEmojiGrid } from '../../lib/share'

type Props = {
  date: string
  solution: string
  isOpen: boolean
  isGameWon: boolean
  isGameLost: boolean
}

const inputClass =
  'w-full rounded-xl border border-nature-stone-300 bg-nature-stone-50 px-3 py-2 text-sm text-nature-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] dark:border-nature-stone-600 dark:bg-nature-stone-900 dark:text-nature-stone-50'

const numberFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 2,
})

export const Leaderboard = ({
  date,
  solution,
  isOpen,
  isGameWon,
  isGameLost,
}: Props) => {
  const [identity, setIdentity] = useState<LeaderboardIdentity | null>(() =>
    getLeaderboardIdentity(),
  )
  const [nameInput, setNameInput] = useState('')
  const [passphraseInput, setPassphraseInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)

  const [activeView, setActiveView] = useState<'daily' | 'overall'>('daily')
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [overallEntries, setOverallEntries] = useState<
    OverallLeaderboardEntry[] | null
  >(null)
  const [leaderboardStatus, setLeaderboardStatus] = useState<
    'idle' | 'loading' | 'ok' | 'unauthorized' | 'unavailable'
  >('idle')

  useEffect(() => {
    if (!isOpen || !identity) return

    let cancelled = false
    setLeaderboardStatus('loading')

    if (activeView === 'daily') {
      fetchLeaderboard({ identity, date }).then((result) => {
        if (cancelled) return
        if (result.status === 'ok') {
          setEntries(result.entries)
          setLeaderboardStatus('ok')
        } else {
          setEntries(null)
          setLeaderboardStatus(result.status)
        }
      })
    } else {
      fetchOverallLeaderboard({ identity }).then((result) => {
        if (cancelled) return
        if (result.status === 'ok') {
          setOverallEntries(result.entries)
          setLeaderboardStatus('ok')
        } else {
          setOverallEntries(null)
          setLeaderboardStatus(result.status)
        }
      })
    }

    return () => {
      cancelled = true
    }
  }, [isOpen, identity, date, isGameWon, isGameLost, activeView])

  const handleJoin = async () => {
    const name = nameInput.trim()
    const passphrase = passphraseInput.trim()
    if (!name || !passphrase) {
      setSetupError(LEADERBOARD_MISSING_FIELDS_MESSAGE)
      return
    }

    setIsJoining(true)
    setSetupError(null)

    const candidate = { name, passphrase }
    const result = await fetchLeaderboard({ identity: candidate, date })
    setIsJoining(false)

    if (result.status === 'unauthorized') {
      setSetupError(LEADERBOARD_WRONG_PASSPHRASE_MESSAGE)
      return
    }

    setLeaderboardIdentity(candidate)
    setIdentity(candidate)

    if (result.status === 'ok') {
      setEntries(result.entries)
      setLeaderboardStatus('ok')
    } else {
      setLeaderboardStatus('unavailable')
    }
  }

  const handleChangeIdentity = () => {
    clearLeaderboardIdentity()
    setIdentity(null)
    setEntries(null)
    setOverallEntries(null)
    setLeaderboardStatus('idle')
    setActiveView('daily')
    setNameInput('')
    setPassphraseInput('')
  }

  return (
    <div className="mt-4 border-t border-nature-stone-200 pt-4 dark:border-nature-stone-700">
      <h4 className="font-display text-lg leading-6 font-semibold text-nature-stone-900 dark:text-nature-stone-50">
        {LEADERBOARD_TITLE}
      </h4>

      {!identity ? (
        <div className="mt-2">
          <p className="text-sm text-nature-stone-600 dark:text-nature-stone-300">
            {LEADERBOARD_SETUP_INTRO}
          </p>
          <div className="mt-3 space-y-2">
            <input
              type="text"
              className={inputClass}
              placeholder={LEADERBOARD_NAME_LABEL}
              aria-label={LEADERBOARD_NAME_LABEL}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={40}
            />
            <input
              type="password"
              className={inputClass}
              placeholder={LEADERBOARD_PASSPHRASE_LABEL}
              aria-label={LEADERBOARD_PASSPHRASE_LABEL}
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
            />
            {setupError && (
              <p className="text-sm text-[var(--danger-bg-color)]">
                {setupError}
              </p>
            )}
            <button
              type="button"
              className="w-full rounded-xl border border-transparent bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white shadow-soft hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-nature-stone-800"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? LEADERBOARD_JOINING_TEXT : LEADERBOARD_JOIN_BUTTON}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div
            className="mb-3 grid grid-cols-2 rounded-xl bg-nature-stone-100 p-1 dark:bg-nature-stone-700/60"
            role="tablist"
            aria-label={LEADERBOARD_TITLE}
          >
            {(
              [
                ['daily', LEADERBOARD_DAILY_TAB_TEXT],
                ['overall', LEADERBOARD_OVERALL_TAB_TEXT],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                id={`leaderboard-${view}-tab`}
                type="button"
                role="tab"
                aria-selected={activeView === view}
                aria-controls={`leaderboard-${view}-panel`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeView === view
                    ? 'bg-white text-nature-stone-900 shadow-sm dark:bg-nature-stone-800 dark:text-nature-stone-50'
                    : 'text-nature-stone-500 hover:text-nature-stone-700 dark:text-nature-stone-400 dark:hover:text-nature-stone-200'
                }`}
                onClick={() => setActiveView(view)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id={`leaderboard-${activeView}-panel`}
            role="tabpanel"
            aria-labelledby={`leaderboard-${activeView}-tab`}
          >
            {leaderboardStatus === 'unauthorized' && (
              <p className="text-sm text-[var(--danger-bg-color)]">
                {LEADERBOARD_WRONG_PASSPHRASE_MESSAGE}
              </p>
            )}
            {leaderboardStatus === 'unavailable' && (
              <p className="text-sm text-nature-stone-500 dark:text-nature-stone-400">
                {LEADERBOARD_UNAVAILABLE_TEXT}
              </p>
            )}
            {activeView === 'daily' &&
              leaderboardStatus === 'ok' &&
              entries &&
              entries.length === 0 && (
                <p className="text-sm text-nature-stone-500 dark:text-nature-stone-400">
                  {LEADERBOARD_EMPTY_TEXT}
                </p>
              )}
            {activeView === 'daily' &&
              leaderboardStatus === 'ok' &&
              entries &&
              entries.length > 0 && (
                <ul className="space-y-2">
                  {entries.map((entry) => (
                    <li
                      key={entry.name}
                      className="rounded-xl bg-nature-stone-100 px-3 py-2 dark:bg-nature-stone-700/60"
                    >
                      <div className="flex items-center justify-between text-sm font-medium text-nature-stone-900 dark:text-nature-stone-50">
                        <span>
                          {entry.name}
                          {entry.name === identity.name && (
                            <span className="ml-1 font-normal text-nature-stone-500 dark:text-nature-stone-400">
                              {LEADERBOARD_YOU_SUFFIX}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums">
                          {entry.won
                            ? `${entry.guessCount}/6`
                            : LEADERBOARD_LOST_LABEL}
                        </span>
                      </div>
                      {entry.guesses && (
                        <pre className="mt-1 text-xs leading-tight">
                          {generateEmojiGrid(entry.guesses, solution)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            {activeView === 'overall' &&
              leaderboardStatus === 'ok' &&
              overallEntries &&
              overallEntries.length === 0 && (
                <p className="text-sm text-nature-stone-500 dark:text-nature-stone-400">
                  {LEADERBOARD_OVERALL_EMPTY_TEXT}
                </p>
              )}
            {activeView === 'overall' &&
              leaderboardStatus === 'ok' &&
              overallEntries &&
              overallEntries.length > 0 && (
                <ol className="space-y-2">
                  {overallEntries.map((entry, index) => (
                    <li
                      key={entry.name}
                      className="rounded-xl bg-nature-stone-100 px-3 py-2 dark:bg-nature-stone-700/60"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-nature-stone-900 dark:text-nature-stone-50">
                        <span className="w-5 shrink-0 text-right tabular-nums text-nature-stone-500 dark:text-nature-stone-400">
                          {index + 1}.
                        </span>
                        <span className="min-w-0 grow truncate">
                          {entry.name}
                          {entry.name === identity.name && (
                            <span className="ml-1 font-normal text-nature-stone-500 dark:text-nature-stone-400">
                              {LEADERBOARD_YOU_SUFFIX}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {entry.points} {LEADERBOARD_POINTS_LABEL}
                        </span>
                      </div>
                      <p className="mt-1 ml-7 text-xs text-nature-stone-500 dark:text-nature-stone-400">
                        {entry.gamesPlayed} {LEADERBOARD_GAMES_LABEL} ·{' '}
                        {entry.wins} {LEADERBOARD_WINS_LABEL} (
                        {numberFormatter.format(entry.winRate)} %) ·{' '}
                        {LEADERBOARD_AVERAGE_LABEL}:{' '}
                        {entry.averageGuesses === null
                          ? '–'
                          : numberFormatter.format(entry.averageGuesses)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-nature-stone-500 underline hover:text-nature-stone-700 dark:text-nature-stone-400 dark:hover:text-nature-stone-200"
            onClick={handleChangeIdentity}
          >
            {LEADERBOARD_CHANGE_IDENTITY_TEXT}
          </button>
        </div>
      )}
    </div>
  )
}
