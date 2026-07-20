import {
  BEST_STREAK_TEXT,
  CURRENT_STREAK_TEXT,
  SUCCESS_RATE_TEXT,
  TOTAL_TRIES_TEXT,
} from '../../constants/strings'
import { GameStats } from '../../lib/localStorage'

type Props = {
  gameStats: GameStats
}

const StatItem = ({
  label,
  value,
}: {
  label: string
  value: string | number
}) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 text-center dark:text-nature-stone-50">
      <div className="font-display text-3xl font-bold tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-xs leading-tight text-nature-stone-600 dark:text-nature-stone-300">
        {label}
      </div>
    </div>
  )
}

export const StatBar = ({ gameStats }: Props) => {
  return (
    <div className="my-2 flex w-full gap-1">
      <StatItem label={TOTAL_TRIES_TEXT} value={gameStats.totalGames} />
      <StatItem label={SUCCESS_RATE_TEXT} value={`${gameStats.successRate}%`} />
      <StatItem label={CURRENT_STREAK_TEXT} value={gameStats.currentStreak} />
      <StatItem label={BEST_STREAK_TEXT} value={gameStats.bestStreak} />
    </div>
  )
}
