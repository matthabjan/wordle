import Countdown from 'react-countdown'
import {
  GUESS_DISTRIBUTION_TEXT,
  NEW_WORD_TEXT,
  SHARE_SPOILER_TEXT,
  SHARE_TEXT,
  STATISTICS_TITLE,
} from '../../constants/strings'
import { GameStats } from '../../lib/localStorage'
import { shareStatus, shareStatusWithBBCode } from '../../lib/share'
import { Histogram } from '../stats/Histogram'
import { StatBar } from '../stats/StatBar'
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
  const shareButtonClass =
    'mt-2 w-full rounded-xl border border-transparent px-4 py-3 text-base font-medium text-white shadow-soft bg-nature-emerald-600 hover:bg-nature-emerald-700 focus:outline-none focus:ring-2 focus:ring-nature-emerald-500 focus:ring-offset-2 sm:text-sm dark:focus:ring-offset-nature-stone-800'

  if (gameStats.totalGames <= 0) {
    return (
      <BaseModal
        title={STATISTICS_TITLE}
        isOpen={isOpen}
        handleClose={handleClose}
      >
        <StatBar gameStats={gameStats} />
      </BaseModal>
    )
  }

  return (
    <BaseModal
      title={STATISTICS_TITLE}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <StatBar gameStats={gameStats} />
      <h4 className="mt-4 font-display text-lg leading-6 font-medium text-nature-stone-900 dark:text-nature-stone-50">
        {GUESS_DISTRIBUTION_TEXT}
      </h4>
      <Histogram gameStats={gameStats} />
      {(isGameLost || isGameWon) && (
        <div className="mt-4 dark:text-nature-stone-50">
          <div className="mb-2">
            <h5 className="text-sm text-nature-stone-600 dark:text-nature-stone-300">
              {NEW_WORD_TEXT}
            </h5>
            <Countdown
              className="font-display text-lg font-medium text-nature-stone-900 dark:text-nature-stone-50"
              date={tomorrow}
              daysInHours={true}
            />
          </div>
          <div>
            <button
              type="button"
              className={shareButtonClass}
              onClick={async () => {
                try {
                  const result = await shareStatus(
                    guesses,
                    isGameLost,
                    isHardMode,
                    solutionIndex,
                    solution,
                  )
                  if (result === 'copied') {
                    handleShare()
                  }
                } catch {
                  handleShareFailure()
                }
              }}
            >
              {SHARE_TEXT}
            </button>
            <button
              type="button"
              className={`${shareButtonClass} bg-nature-stone-600 hover:bg-nature-stone-700`}
              onClick={async () => {
                try {
                  await shareStatusWithBBCode(
                    guesses,
                    isGameLost,
                    isHardMode,
                    solutionIndex,
                    solution,
                  )
                  handleShare()
                } catch {
                  handleShareFailure()
                }
              }}
            >
              {SHARE_SPOILER_TEXT}
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  )
}
