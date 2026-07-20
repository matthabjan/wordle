import { describe, expect, it } from 'vitest'
import { getGuessStatuses, getStatuses } from './statuses'

describe('getGuessStatuses', () => {
  it('marks correct letters', () => {
    expect(getGuessStatuses('ABCDE', 'ABCDE')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('handles duplicate letters correctly', () => {
    // solution has one A; first A in guess is present, second absent
    expect(getGuessStatuses('AAXYZ', 'ABCDE')).toEqual([
      'correct',
      'absent',
      'absent',
      'absent',
      'absent',
    ])
  })

  it('marks present before consuming correct duplicates', () => {
    // solution ERASE has two E's and one S; no letter of SPEED is in the correct spot
    expect(getGuessStatuses('SPEED', 'ERASE')).toEqual([
      'present',
      'absent',
      'present',
      'present',
      'absent',
    ])
  })
})

describe('getStatuses', () => {
  it('never downgrades correct to present', () => {
    const statuses = getStatuses(['ABXXX', 'AXXBX'], 'ABXDE')
    expect(statuses['A']).toBe('correct')
    expect(statuses['B']).toBe('correct')
  })
})
