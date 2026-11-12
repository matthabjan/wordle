import { useEffect, useState } from 'react'
import Countdown from 'react-countdown'
import { MAX_CHALLENGES } from '../../constants/settings'
import {
  CORRECT_WORD_MESSAGE,
  GUESS_DISTRIBUTION_TEXT,
  LEADERBOARD_TITLE,
  NEW_WORD_TEXT,
  NO_STATS_TEXT,
  RESULT_TAB_TEXT,
  RESULT_WON_TEXT,
  SHARE_SPOILER_TEXT,
  SHARE_TEXT,
  STATISTICS_TITLE,
} from '../../constants/strings'
import { GameStats } from '../../lib/localStorage'
import { shareStatus, shareStatusWithBBCode } from '../../lib/share'
import { getDateForSolutionIndex } from '../../lib/words'
import { Histogram } from '../stats/Histogram'
import { Leaderboard } from '../stats/Leaderboard'
import { MiniGrid } from '../stats/MiniGrid'
import { StatBar } from '../stats/StatBar'
import { Tabs } from '../tabs/Tabs'
import { BaseModal } from './BaseModal'

type Props = {
  isOpen: boolean
  handleClose: () => void
  guesses: string[]
  gameStats: GameStats
  isGameLost: boolean
  isGameWon: boolean
  handleShare: () => void
  handleShareFailure: () => void
  isHardMode: boolean
  tomorrow: number
  solution: string
  solutionIndex: number
}

type Tab = 'result' | 'stats' | 'board'

const TAB_ID_PREFIX = 'stats-sheet'

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-nature-stone-800'

export const StatsModal = ({
  isOpen,
  handleClose,
  guesses,
  gameStats,
  isGameLost,
  isGameWon,
  handleShare,
  handleShareFailure,
  isHardMode,
  tomorrow,
  solution,
  solutionIndex,
}: Props) => {
  const isFinished = isGameWon || isGameLost
  const [tab, setTab] = useState<Tab>(isFinished ? 'result' : 'stats')

  // Every opening starts on the result once there is one.
  useEffect(() => {
    if (isOpen) setTab(isFinished ? 'result' : 'stats')
  }, [isOpen, isFinished])

  const tabs = [
    ...(isFinished ? [{ id: 'result', label: RESULT_TAB_TEXT } as const] : []),
    { id: 'stats', label: STATISTICS_TITLE },
    { id: 'board', label: LEADERBOARD_TITLE },
  ] as const

  const share = async (withSpoilers: boolean) => {
    const args = [
      guesses,
      isGameLost,
      isHardMode,
      solutionIndex,
      solution,
    ] as const
    try {
      const result = withSpoilers
        ? await shareStatusWithBBCode(...args)
        : await shareStatus(...args)
      if (result === 'copied') handleShare()
    } catch {
      handleShareFailure()
    }
  }

  return (
    <BaseModal
      title={STATISTICS_TITLE}
      header={
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={setTab}
          label={STATISTICS_TITLE}
          idPrefix={TAB_ID_PREFIX}
          variant="underline"
        />
      }
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div
        id={`${TAB_ID_PREFIX}-${tab}-panel`}
        role="tabpanel"
        aria-labelledby={`${TAB_ID_PREFIX}-${tab}-tab`}
        className="min-h-[22.5rem] pt-3"
      >
        {tab === 'result' && (
          <div className="flex flex-col items-center">
            <p className="font-display text-3xl font-bold text-nature-stone-900 tabular-nums dark:text-nature-stone-50">
              {isGameWon ? guesses.length : 'X'}/{MAX_CHALLENGES}
            </p>
            <p className="mt-1 text-base text-nature-stone-700 dark:text-nature-stone-200">
              {isGameWon
                ? RESULT_WON_TEXT(guesses.length)
                : CORRECT_WORD_MESSAGE(solution)}
            </p>
            <div className="mt-4">
              <MiniGrid guesses={guesses} solution={solution} size="lg" />
            </div>
            <button
              type="button"
              className={`mt-5 min-h-12 w-full rounded-xl bg-[var(--accent-color)] px-4 text-base font-medium text-white shadow-soft hover:brightness-110 ${focusRing}`}
              onClick={() => share(false)}
            >
              {SHARE_TEXT}
            </button>
            <button
              type="button"
              className={`mt-1 min-h-11 w-full rounded-xl px-4 text-sm font-medium text-nature-stone-700 hover:bg-nature-stone-200/70 dark:text-nature-stone-200 dark:hover:bg-nature-stone-700 ${focusRing}`}
              onClick={() => share(true)}
            >
              {SHARE_SPOILER_TEXT}
            </button>
            <p className="mt-3 text-sm text-nature-stone-600 dark:text-nature-stone-300">
              {NEW_WORD_TEXT}{' '}
              <Countdown
                className="font-display font-semibold text-nature-stone-900 tabular-nums dark:text-nature-stone-50"
                date={tomorrow}
                daysInHours={true}
              />
            </p>
          </div>
        )}
        {tab === 'stats' && (
          <>
            <StatBar gameStats={gameStats} />
            {gameStats.totalGames > 0 ? (
              <>
                <h3 className="mt-4 font-display text-base leading-6 font-semibold text-nature-stone-900 dark:text-nature-stone-50">
                  {GUESS_DISTRIBUTION_TEXT}
                </h3>
                <Histogram gameStats={gameStats} />
              </>
            ) : (
              <p className="mt-4 text-nature-stone-500 dark:text-nature-stone-400">
                {NO_STATS_TEXT}
              </p>
            )}
          </>
        )}
        {tab === 'board' && (
          <Leaderboard
            date={getDateForSolutionIndex(solutionIndex)}
            solution={solution}
            isOpen={isOpen}
            isGameWon={isGameWon}
            isGameLost={isGameLost}
          />
        )}
      </div>
    </BaseModal>
  )
}
