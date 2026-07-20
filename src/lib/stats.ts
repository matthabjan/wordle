import { MAX_CHALLENGES } from '../constants/settings'
import {
  GameStats,
  loadStatsFromLocalStorage,
  saveStatsToLocalStorage,
} from './localStorage'

const defaultStats: GameStats = {
  winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
}

export const addStatsForCompletedGame = (
  gameStats: GameStats,
  count: number,
  solutionIndex: number,
) => {
  // Count is number of incorrect guesses before end.
  const stats: GameStats = {
    ...gameStats,
    winDistribution: [...gameStats.winDistribution],
  }

  // Reset streak if a calendar day was skipped (solutionIndex jumped by > 1)
  if (
    typeof stats.lastPlayedSolutionIndex === 'number' &&
    solutionIndex > stats.lastPlayedSolutionIndex + 1
  ) {
    stats.currentStreak = 0
  }

  stats.totalGames += 1

  if (count >= MAX_CHALLENGES) {
    stats.currentStreak = 0
    stats.gamesFailed += 1
  } else {
    stats.winDistribution[count] += 1
    stats.currentStreak += 1

    if (stats.bestStreak < stats.currentStreak) {
      stats.bestStreak = stats.currentStreak
    }
  }

  stats.lastPlayedSolutionIndex = solutionIndex
  stats.successRate = getSuccessRate(stats)

  saveStatsToLocalStorage(stats)
  return stats
}

export const loadStats = () => {
  return (
    loadStatsFromLocalStorage() || {
      ...defaultStats,
      winDistribution: [...defaultStats.winDistribution],
    }
  )
}

const getSuccessRate = (gameStats: GameStats) => {
  const { totalGames, gamesFailed } = gameStats

  return Math.round(
    (100 * (totalGames - gamesFailed)) / Math.max(totalGames, 1),
  )
}
