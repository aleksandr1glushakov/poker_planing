import { describe, expect, it } from 'vitest'

import { calculateRoundStatistics } from './statistics'

describe('calculateRoundStatistics', () => {
  it('calculates statistics for an odd number of estimates', () => {
    expect(calculateRoundStatistics([12, 4, 8])).toEqual({
      min: 4,
      max: 12,
      average: 8,
      median: 8,
      numericVoteCount: 3,
      unknownVoteCount: 0,
      totalVoteCount: 3,
    })
  })

  it('calculates the median for an even number of estimates', () => {
    const result = calculateRoundStatistics([0.5, 1, 4, 8])

    expect(result.median).toBe(2.5)
    expect(result.average).toBe(3.375)
  })

  it('excludes unknown estimates from numeric statistics', () => {
    expect(calculateRoundStatistics(['?', 4, '?', 8])).toEqual({
      min: 4,
      max: 8,
      average: 6,
      median: 6,
      numericVoteCount: 2,
      unknownVoteCount: 2,
      totalVoteCount: 4,
    })
  })

  it('returns null numeric values when there are no numeric estimates', () => {
    expect(calculateRoundStatistics(['?', '?'])).toEqual({
      min: null,
      max: null,
      average: null,
      median: null,
      numericVoteCount: 0,
      unknownVoteCount: 2,
      totalVoteCount: 2,
    })
  })
})
