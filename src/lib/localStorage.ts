import { MAX_CHALLENGES } from '../constants/settings'

const gameStateKey = 'gameState'
const gameStatKey = 'gameStats'
const highContrastKey = 'highContrast'
const themeKey = 'theme'
const gameModeKey = 'gameMode'

type StoredGameState = {
  guesses: string[]
  solution: string
}

export type GameStats = {
  winDistribution: number[]
  gamesFailed: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  successRate: number
  lastPlayedSolutionIndex?: number
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

export const saveGameStateToLocalStorage = (gameState: StoredGameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState))
}

export const loadGameStateFromLocalStorage = (): StoredGameState | null => {
  const state = localStorage.getItem(gameStateKey)
  if (!state) return null

  try {
    const parsed = JSON.parse(state) as Partial<StoredGameState>
    if (
      parsed &&
      isStringArray(parsed.guesses) &&
      typeof parsed.solution === 'string'
    ) {
      return { guesses: parsed.guesses, solution: parsed.solution }
    }
  } catch {
    return null
  }

  return null
}

export const saveStatsToLocalStorage = (gameStats: GameStats) => {
  localStorage.setItem(gameStatKey, JSON.stringify(gameStats))
}

export const loadStatsFromLocalStorage = (): GameStats | null => {
  const stats = localStorage.getItem(gameStatKey)
  if (!stats) return null

  try {
    const parsed = JSON.parse(stats) as Partial<GameStats>
    if (
      !parsed ||
      !isNumberArray(parsed.winDistribution) ||
      typeof parsed.gamesFailed !== 'number' ||
      typeof parsed.currentStreak !== 'number' ||
      typeof parsed.bestStreak !== 'number' ||
      typeof parsed.totalGames !== 'number' ||
      typeof parsed.successRate !== 'number'
    ) {
      return null
    }

    const winDistribution = [...parsed.winDistribution]
    while (winDistribution.length < MAX_CHALLENGES) {
      winDistribution.push(0)
    }

    return {
      winDistribution: winDistribution.slice(0, MAX_CHALLENGES),
      gamesFailed: parsed.gamesFailed,
      currentStreak: parsed.currentStreak,
      bestStreak: parsed.bestStreak,
      totalGames: parsed.totalGames,
      successRate: parsed.successRate,
      lastPlayedSolutionIndex:
        typeof parsed.lastPlayedSolutionIndex === 'number'
          ? parsed.lastPlayedSolutionIndex
          : undefined,
    }
  } catch {
    return null
  }
}

export const setStoredIsHighContrastMode = (isHighContrast: boolean) => {
  if (isHighContrast) {
    localStorage.setItem(highContrastKey, '1')
  } else {
    localStorage.removeItem(highContrastKey)
  }
}

export const getStoredIsHighContrastMode = () => {
  return localStorage.getItem(highContrastKey) === '1'
}

export const setStoredTheme = (isDark: boolean) => {
  localStorage.setItem(themeKey, isDark ? 'dark' : 'light')
}

export const getStoredTheme = (): boolean | null => {
  const theme = localStorage.getItem(themeKey)
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return null
}

export const setStoredGameMode = (isHard: boolean) => {
  localStorage.setItem(gameModeKey, isHard ? 'hard' : 'normal')
}

export const getStoredGameMode = (): boolean => {
  return localStorage.getItem(gameModeKey) === 'hard'
}
