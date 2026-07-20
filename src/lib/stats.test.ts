import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_CHALLENGES } from '../constants/settings'
import { addStatsForCompletedGame, loadStats } from './stats'

describe('addStatsForCompletedGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not mutate the original winDistribution array', () => {
    const stats = loadStats()
    const originalDist = stats.winDistribution
    const originalCopy = [...originalDist]

    const next = addStatsForCompletedGame(stats, 2, 10)

    expect(originalDist).toEqual(originalCopy)
    expect(next.winDistribution).not.toBe(originalDist)
    expect(next.winDistribution[2]).toBe(1)
  })

  it('increments streak on win and resets on loss', () => {
    let stats = loadStats()
    stats = addStatsForCompletedGame(stats, 1, 5)
    expect(stats.currentStreak).toBe(1)
    expect(stats.bestStreak).toBe(1)

    stats = addStatsForCompletedGame(stats, 0, 6)
    expect(stats.currentStreak).toBe(2)
    expect(stats.bestStreak).toBe(2)

    stats = addStatsForCompletedGame(stats, MAX_CHALLENGES, 7)
    expect(stats.currentStreak).toBe(0)
    expect(stats.gamesFailed).toBe(1)
  })

  it('resets streak when a day was skipped', () => {
    let stats = loadStats()
    stats = addStatsForCompletedGame(stats, 1, 5)
    expect(stats.currentStreak).toBe(1)

    // skip day 6 → play day 8
    stats = addStatsForCompletedGame(stats, 1, 8)
    expect(stats.currentStreak).toBe(1)
    expect(stats.lastPlayedSolutionIndex).toBe(8)
  })
})
