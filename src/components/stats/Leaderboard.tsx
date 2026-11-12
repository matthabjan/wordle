import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { TrophyIcon } from '@heroicons/react/24/outline'
import { FormEvent, useEffect, useState } from 'react'
import { MAX_CHALLENGES } from '../../constants/settings'
import {
  CANCEL_TEXT,
  LEADERBOARD_ALL_TIME_TITLE,
  LEADERBOARD_ARCHIVE_EMPTY_TEXT,
  LEADERBOARD_ARCHIVE_TAB_TEXT,
  LEADERBOARD_AVERAGE_LABEL,
  LEADERBOARD_BACK_TEXT,
  LEADERBOARD_DAILY_TAB_TEXT,
  LEADERBOARD_EMPTY_TEXT,
  LEADERBOARD_GAMES_LABEL,
  LEADERBOARD_JOIN_BUTTON,
  LEADERBOARD_JOINING_TEXT,
  LEADERBOARD_LEAVE_CONFIRM_TEXT,
  LEADERBOARD_LEAVE_TEXT,
  LEADERBOARD_LOADING_TEXT,
  LEADERBOARD_LOST_LABEL,
  LEADERBOARD_MISSING_FIELDS_MESSAGE,
  LEADERBOARD_NAME_LABEL,
  LEADERBOARD_NEW_ROUND_TEXT,
  LEADERBOARD_OVERALL_EMPTY_TEXT,
  LEADERBOARD_OVERALL_TAB_TEXT,
  LEADERBOARD_PASSPHRASE_LABEL,
  LEADERBOARD_POINTS_LABEL,
  LEADERBOARD_ROUND_WINNER_TEXT,
  LEADERBOARD_SETUP_INTRO,
  LEADERBOARD_SIGNED_IN_AS,
  LEADERBOARD_TITLE,
  LEADERBOARD_UNAVAILABLE_TEXT,
  LEADERBOARD_WINS_LABEL,
  LEADERBOARD_WRONG_PASSPHRASE_MESSAGE,
  LEADERBOARD_YOU_SUFFIX,
} from '../../constants/strings'
import {
  ALL_ROUNDS,
  leaderboard as defaultLeaderboard,
  type Leaderboard as LeaderboardParticipation,
  type LeaderboardEntry,
  type LeaderboardIdentity,
  type LeaderboardRound,
  type OverallLeaderboardEntry,
} from '../../lib/leaderboard'
import { Tabs } from '../tabs/Tabs'
import { MiniGrid } from './MiniGrid'

type Props = {
  // Local YYYY-MM-DD of today's puzzle; its year is the running round.
  date: string
  solution: string
  isOpen: boolean
  isGameWon: boolean
  isGameLost: boolean
  leaderboard?: LeaderboardParticipation
}

type View = 'daily' | 'round' | 'archive'

type Rounds = { mode: 'year' | 'none'; rounds: LeaderboardRound[] }

type Standings =
  | { status: 'loading' | 'unauthorized' | 'unavailable' }
  // `request` names what was asked for, so a table that has not been replaced
  // yet is never shown under another tab.
  | {
      status: 'ok'
      request: string
      kind: 'daily'
      entries: LeaderboardEntry[]
    }
  | {
      status: 'ok'
      request: string
      kind: 'overall'
      entries: OverallLeaderboardEntry[]
    }

const TAB_ID_PREFIX = 'leaderboard'
const NO_ROUNDS: Rounds = { mode: 'none', rounds: [] }

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-800'
// 16px text: smaller inputs make iOS zoom the page on focus.
const inputClass = `mt-1 w-full rounded-xl border border-nature-stone-300 bg-white px-3 py-2.5 text-base text-nature-stone-900 select-text dark:border-nature-stone-600 dark:bg-nature-stone-900 dark:text-nature-stone-50 ${focusRing}`
const labelClass =
  'block text-left text-sm font-medium text-nature-stone-700 dark:text-nature-stone-200'
const cardClass =
  'rounded-xl bg-nature-stone-100 px-3 py-2.5 dark:bg-nature-stone-700/60'
const mutedClass = 'text-nature-stone-500 dark:text-nature-stone-400'
const strongClass = 'text-nature-stone-900 dark:text-nature-stone-50'
const textButtonClass = `min-h-11 rounded-lg px-3 text-sm font-medium text-nature-stone-700 hover:bg-nature-stone-200/70 dark:text-nature-stone-200 dark:hover:bg-nature-stone-700 ${focusRing}`

const numberFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 2,
})

const Skeleton = () => (
  <div
    role="status"
    aria-label={LEADERBOARD_LOADING_TEXT}
    className="animate-pulse space-y-2"
  >
    {[0, 1, 2].map((row) => (
      <div
        key={row}
        className="h-12 rounded-xl bg-nature-stone-100 dark:bg-nature-stone-700/60"
      />
    ))}
  </div>
)

const PlayerName = ({ name, isYou }: { name: string; isYou: boolean }) => (
  <span className="min-w-0 grow truncate text-left">
    {name}
    {isYou && (
      <span className={`ml-1 font-normal ${mutedClass}`}>
        {LEADERBOARD_YOU_SUFFIX}
      </span>
    )}
  </span>
)

const DailyList = ({
  entries,
  solution,
  you,
}: {
  entries: LeaderboardEntry[]
  solution: string
  you: string
}) => (
  <ul className="space-y-2">
    {entries.map((entry) => (
      <li key={entry.name} className={`${cardClass} flex items-center gap-3`}>
        <div
          className={`flex min-w-0 grow items-center gap-2 text-sm font-medium ${strongClass}`}
        >
          <PlayerName name={entry.name} isYou={entry.name === you} />
          <span className="shrink-0 tabular-nums">
            {entry.won
              ? `${entry.guessCount}/${MAX_CHALLENGES}`
              : LEADERBOARD_LOST_LABEL}
          </span>
        </div>
        {entry.guesses && (
          <MiniGrid guesses={entry.guesses} solution={solution} />
        )}
      </li>
    ))}
  </ul>
)

const StandingsList = ({
  entries,
  you,
}: {
  entries: OverallLeaderboardEntry[]
  you: string
}) => (
  <ol className="space-y-2">
    {entries.map((entry, index) => (
      <li key={entry.name} className={cardClass}>
        <div
          className={`flex items-center gap-2 text-sm font-medium ${strongClass}`}
        >
          <span
            className={`w-5 shrink-0 text-right tabular-nums ${mutedClass}`}
          >
            {index + 1}.
          </span>
          <PlayerName name={entry.name} isYou={entry.name === you} />
          <span className="shrink-0 tabular-nums">
            {entry.points} {LEADERBOARD_POINTS_LABEL}
          </span>
        </div>
        <p className={`mt-1 ml-7 text-left text-xs ${mutedClass}`}>
          {entry.gamesPlayed} {LEADERBOARD_GAMES_LABEL} · {entry.wins}{' '}
          {LEADERBOARD_WINS_LABEL} ({numberFormatter.format(entry.winRate)} %) ·{' '}
          {LEADERBOARD_AVERAGE_LABEL}:{' '}
          {entry.averageGuesses === null
            ? '–'
            : numberFormatter.format(entry.averageGuesses)}
        </p>
      </li>
    ))}
  </ol>
)

// A round's podium; opens the round's full standings.
const RoundCard = ({
  title,
  top,
  you,
  onOpen,
}: {
  title: string
  top: OverallLeaderboardEntry[]
  you: string
  onOpen: () => void
}) => (
  <button
    type="button"
    className={`${cardClass} block w-full text-left ${focusRing}`}
    onClick={onOpen}
  >
    <span className="flex items-center justify-between">
      <span className={`font-display text-base font-semibold ${strongClass}`}>
        {title}
      </span>
      <ChevronRightIcon
        className={`h-5 w-5 ${mutedClass}`}
        aria-hidden="true"
      />
    </span>
    {top.map((entry, index) => (
      <span
        key={entry.name}
        className={`mt-1 flex items-center gap-2 text-sm ${strongClass}`}
      >
        <span className={`w-5 shrink-0 text-right tabular-nums ${mutedClass}`}>
          {index + 1}.
        </span>
        <PlayerName name={entry.name} isYou={entry.name === you} />
        <span className="shrink-0 tabular-nums">
          {entry.points} {LEADERBOARD_POINTS_LABEL}
        </span>
      </span>
    ))}
  </button>
)

const JoinForm = ({
  leaderboard,
  date,
  onJoined,
}: {
  leaderboard: LeaderboardParticipation
  date: string
  onJoined: () => void
}) => {
  const [name, setName] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const candidate = { name: name.trim(), passphrase: passphrase.trim() }
    if (!candidate.name || !candidate.passphrase) {
      setError(LEADERBOARD_MISSING_FIELDS_MESSAGE)
      return
    }

    setIsJoining(true)
    setError(null)
    const { status } = await leaderboard.join(candidate, date)
    setIsJoining(false)

    if (status === 'unauthorized') {
      setError(LEADERBOARD_WRONG_PASSPHRASE_MESSAGE)
      return
    }
    // Loading the standings (and submitting an already finished game first)
    // is picked up by the parent.
    onJoined()
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      <p className="text-left text-sm text-nature-stone-600 dark:text-nature-stone-300">
        {LEADERBOARD_SETUP_INTRO}
      </p>
      <label className={labelClass}>
        {LEADERBOARD_NAME_LABEL}
        <input
          type="text"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="nickname"
          autoCapitalize="words"
          enterKeyHint="next"
        />
      </label>
      <label className={labelClass}>
        {LEADERBOARD_PASSPHRASE_LABEL}
        <input
          type="password"
          className={inputClass}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoComplete="off"
          enterKeyHint="go"
        />
      </label>
      {error && (
        <p
          role="alert"
          className="text-left text-sm text-[var(--danger-bg-color)]"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        className={`min-h-12 w-full rounded-xl bg-[var(--accent-color)] px-4 text-base font-medium text-white shadow-soft hover:brightness-110 disabled:opacity-60 ${focusRing}`}
        disabled={isJoining}
      >
        {isJoining ? LEADERBOARD_JOINING_TEXT : LEADERBOARD_JOIN_BUTTON}
      </button>
    </form>
  )
}

const SignedInFooter = ({
  name,
  onLeave,
}: {
  name: string
  onLeave: () => void
}) => {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isConfirming) {
    return (
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`min-w-0 truncate text-xs ${mutedClass}`}>
          {LEADERBOARD_SIGNED_IN_AS(name)}
        </span>
        <button
          type="button"
          className={`${textButtonClass} shrink-0`}
          onClick={() => setIsConfirming(true)}
        >
          {LEADERBOARD_LEAVE_TEXT}
        </button>
      </div>
    )
  }

  return (
    <div className={`${cardClass} mt-3 text-left`}>
      <p className="text-sm">{LEADERBOARD_LEAVE_CONFIRM_TEXT}</p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          className={textButtonClass}
          onClick={() => setIsConfirming(false)}
        >
          {CANCEL_TEXT}
        </button>
        <button
          type="button"
          className={`min-h-11 rounded-lg bg-[var(--danger-bg-color)] px-4 text-sm font-medium text-white ${focusRing}`}
          onClick={onLeave}
        >
          {LEADERBOARD_LEAVE_TEXT}
        </button>
      </div>
    </div>
  )
}

export const Leaderboard = ({
  date,
  solution,
  isOpen,
  isGameWon,
  isGameLost,
  leaderboard = defaultLeaderboard,
}: Props) => {
  const [identity, setIdentity] = useState<LeaderboardIdentity | null>(() =>
    leaderboard.getIdentity(),
  )
  const [rounds, setRounds] = useState<Rounds | null>(null)
  const [view, setView] = useState<View>('daily')
  // In the archive: the round whose full standings are open, if any.
  const [archiveRound, setArchiveRound] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<Standings>({ status: 'loading' })

  const currentRound = date.slice(0, 4)
  const request = `${view}:${archiveRound ?? ''}`
  const standings: Standings =
    loaded.status === 'ok' && loaded.request !== request
      ? { status: 'loading' }
      : loaded
  const hasRounds = rounds?.mode === 'year'

  useEffect(() => {
    if (!isOpen || !identity) return

    let cancelled = false
    leaderboard.rounds().then((result) => {
      // Without round information the ranking is shown as one overall table.
      if (!cancelled) setRounds(result.status === 'ok' ? result : NO_ROUNDS)
    })
    return () => {
      cancelled = true
    }
  }, [leaderboard, isOpen, identity])

  useEffect(() => {
    if (!isOpen || !identity || !rounds) return

    let cancelled = false
    setLoaded({ status: 'loading' })

    const load = async (): Promise<Standings> => {
      if (view === 'daily') {
        const result = await leaderboard.dailyStandings(date)
        return result.status === 'ok'
          ? { ...result, request, kind: 'daily' }
          : result
      }
      const round =
        view === 'archive'
          ? (archiveRound ?? ALL_ROUNDS)
          : rounds.mode === 'year'
            ? currentRound
            : undefined
      const result = await leaderboard.overallStandings(round)
      return result.status === 'ok'
        ? { ...result, request, kind: 'overall' }
        : result
    }

    load().then((result) => {
      if (!cancelled) setLoaded(result)
    })

    return () => {
      cancelled = true
    }
  }, [
    leaderboard,
    isOpen,
    identity,
    rounds,
    date,
    currentRound,
    isGameWon,
    isGameLost,
    view,
    archiveRound,
    request,
  ])

  if (!identity) {
    return (
      <JoinForm
        leaderboard={leaderboard}
        date={date}
        onJoined={() => setIdentity(leaderboard.getIdentity())}
      />
    )
  }

  const handleLeave = () => {
    leaderboard.leave()
    setIdentity(null)
    setRounds(null)
    setView('daily')
    setArchiveRound(null)
  }

  if (!rounds) return <Skeleton />

  const selectView = (next: View) => {
    setView(next)
    setArchiveRound(null)
  }
  const openArchive = (round: string) => {
    setView('archive')
    setArchiveRound(round)
  }

  const dailyEntries =
    standings.status === 'ok' && standings.kind === 'daily'
      ? standings.entries
      : null
  const overallEntries =
    standings.status === 'ok' && standings.kind === 'overall'
      ? standings.entries
      : null

  const pastRounds = rounds.rounds.filter((round) => round.id !== currentRound)
  // Throughout January the fresh table is introduced by last year's podium.
  const previousRound =
    date.slice(5, 7) === '01'
      ? rounds.rounds.find(
          (round) =>
            round.id === String(Number(currentRound) - 1) &&
            round.top.length > 0,
        )
      : undefined

  const tabs = [
    { id: 'daily', label: LEADERBOARD_DAILY_TAB_TEXT },
    {
      id: 'round',
      label: hasRounds ? currentRound : LEADERBOARD_OVERALL_TAB_TEXT,
    },
    ...(hasRounds
      ? [{ id: 'archive', label: LEADERBOARD_ARCHIVE_TAB_TEXT } as const]
      : []),
  ] as const

  return (
    <div>
      <Tabs
        tabs={tabs}
        active={view}
        onChange={selectView}
        label={LEADERBOARD_TITLE}
        idPrefix={TAB_ID_PREFIX}
      />
      <div
        id={`${TAB_ID_PREFIX}-${view}-panel`}
        role="tabpanel"
        aria-labelledby={`${TAB_ID_PREFIX}-${view}-tab`}
        className="mt-3"
      >
        {view === 'archive' && archiveRound && (
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              className={`${textButtonClass} -ml-2 flex items-center gap-1`}
              onClick={() => setArchiveRound(null)}
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              {LEADERBOARD_BACK_TEXT}
            </button>
            <h3
              className={`grow pr-16 font-display text-base font-semibold ${strongClass}`}
            >
              {archiveRound === ALL_ROUNDS
                ? LEADERBOARD_ALL_TIME_TITLE
                : archiveRound}
            </h3>
          </div>
        )}

        {view === 'round' && previousRound && (
          <>
            <button
              type="button"
              className={`${cardClass} mb-2 flex w-full items-center gap-2 text-left text-sm font-medium ${strongClass} ${focusRing}`}
              onClick={() => openArchive(previousRound.id)}
            >
              <TrophyIcon
                className="h-5 w-5 shrink-0 text-[var(--accent-color)]"
                aria-hidden="true"
              />
              <span className="min-w-0 grow">
                {LEADERBOARD_ROUND_WINNER_TEXT(
                  previousRound.id,
                  previousRound.top.map((entry) => entry.name),
                )}
              </span>
              <ChevronRightIcon
                className={`h-5 w-5 shrink-0 ${mutedClass}`}
                aria-hidden="true"
              />
            </button>
            <p className={`mb-2 text-left text-xs ${mutedClass}`}>
              {LEADERBOARD_NEW_ROUND_TEXT}
            </p>
          </>
        )}

        {standings.status === 'loading' && <Skeleton />}
        {standings.status === 'unauthorized' && (
          <p className="text-sm text-[var(--danger-bg-color)]">
            {LEADERBOARD_WRONG_PASSPHRASE_MESSAGE}
          </p>
        )}
        {standings.status === 'unavailable' && (
          <p className={`text-sm ${mutedClass}`}>
            {LEADERBOARD_UNAVAILABLE_TEXT}
          </p>
        )}

        {view === 'daily' &&
          dailyEntries &&
          (dailyEntries.length === 0 ? (
            <p className={`text-sm ${mutedClass}`}>{LEADERBOARD_EMPTY_TEXT}</p>
          ) : (
            <DailyList
              entries={dailyEntries}
              solution={solution}
              you={identity.name}
            />
          ))}

        {(view === 'round' || archiveRound) &&
          overallEntries &&
          (overallEntries.length === 0 ? (
            <p className={`text-sm ${mutedClass}`}>
              {LEADERBOARD_OVERALL_EMPTY_TEXT}
            </p>
          ) : (
            <StandingsList entries={overallEntries} you={identity.name} />
          ))}

        {view === 'archive' && !archiveRound && overallEntries && (
          <div className="space-y-2">
            <RoundCard
              title={LEADERBOARD_ALL_TIME_TITLE}
              top={overallEntries.slice(0, 3)}
              you={identity.name}
              onOpen={() => setArchiveRound(ALL_ROUNDS)}
            />
            {pastRounds.map((round) => (
              <RoundCard
                key={round.id}
                title={round.id}
                top={round.top}
                you={identity.name}
                onOpen={() => setArchiveRound(round.id)}
              />
            ))}
            {pastRounds.length === 0 && (
              <p className={`pt-1 text-sm ${mutedClass}`}>
                {LEADERBOARD_ARCHIVE_EMPTY_TEXT}
              </p>
            )}
          </div>
        )}
      </div>
      <SignedInFooter name={identity.name} onLeave={handleLeave} />
    </div>
  )
}
