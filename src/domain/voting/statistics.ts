import type { Estimate, RoundStatistics } from '../room/types'

export function calculateRoundStatistics(
  estimates: readonly Estimate[],
): RoundStatistics {
  const numericEstimates = estimates
    .filter((estimate): estimate is Exclude<Estimate, '?'> => estimate !== '?')
    .sort((left, right) => left - right)

  const numericVoteCount = numericEstimates.length
  const unknownVoteCount = estimates.length - numericVoteCount

  if (numericVoteCount === 0) {
    return {
      min: null,
      max: null,
      average: null,
      median: null,
      numericVoteCount,
      unknownVoteCount,
      totalVoteCount: estimates.length,
    }
  }

  const sum = numericEstimates.reduce((total, estimate) => total + estimate, 0)
  const middleIndex = Math.floor(numericVoteCount / 2)
  const median =
    numericVoteCount % 2 === 0
      ? (numericEstimates[middleIndex - 1] + numericEstimates[middleIndex]) / 2
      : numericEstimates[middleIndex]

  return {
    min: numericEstimates[0],
    max: numericEstimates[numericVoteCount - 1],
    average: sum / numericVoteCount,
    median,
    numericVoteCount,
    unknownVoteCount,
    totalVoteCount: estimates.length,
  }
}
