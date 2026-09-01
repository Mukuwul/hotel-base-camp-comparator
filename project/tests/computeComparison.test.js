import { describe, it, expect } from 'vitest'
import { computeComparison, applyImportanceOverrides } from '../src/engine/computeComparison.js'
import { HOTELS, PLACES, INITIAL_BUDGET } from '../src/data/demoCity.js'

// This is the function App.jsx calls on every render, so these tests drive the
// whole application the way a user would — change the budget, change an
// importance, type something invalid, go back to the start — without rendering
// a single component.
const SCENARIO = { hotels: HOTELS, places: PLACES }

const at = (budget, overrides = {}) => computeComparison(SCENARIO, budget, overrides)

describe('computeComparison — the documented starting state', () => {
  const result = at(INITIAL_BUDGET)

  it('is valid and produces a ranking', () => {
    expect(result.ok).toBe(true)
    expect(result.error).toBeNull()
    expect(result.ranking.status).toBe('RANKED')
  })

  it('recommends Lantern Court Inn', () => {
    expect(result.ranking.recommendedHotelId).toBe('LANTERN_COURT')
  })

  it('leaves 7 hotels affordable and 3 over budget', () => {
    expect(result.ranking.rows.filter((row) => row.affordable)).toHaveLength(7)
    expect(result.ranking.rows.filter((row) => !row.affordable)).toHaveLength(3)
  })
})

describe('computeComparison — changing the budget', () => {
  it('makes The Meridian the recommendation once the budget reaches its price', () => {
    expect(at(6790).ranking.recommendedHotelId).toBe('MERIDIAN')
  })

  it('still excludes The Meridian one currency unit below its price', () => {
    const result = at(6789)
    expect(result.ranking.recommendedHotelId).toBe('LANTERN_COURT')
    expect(result.ranking.rows.find((row) => row.hotelId === 'MERIDIAN').affordable).toBe(false)
  })

  it('reports NO_AFFORDABLE_HOTEL at a budget of 0, with no leftover winner', () => {
    const result = at(0)
    expect(result.ok).toBe(true) // nothing affordable is a result, not an error
    expect(result.ranking.status).toBe('NO_AFFORDABLE_HOTEL')
    expect(result.ranking.recommendedHotelId).toBeNull()
  })

  it('changes only affordability, never the travel scores', () => {
    const scoresAt = (budget) =>
      Object.fromEntries(at(budget).ranking.rows.map((row) => [row.hotelId, row.weightedTravelTotal]))

    expect(scoresAt(9999)).toEqual(scoresAt(INITIAL_BUDGET))
    expect(scoresAt(0)).toEqual(scoresAt(INITIAL_BUDGET))
  })
})

describe('computeComparison — changing how much a place matters', () => {
  it('flips the recommendation to Copperline Lodge when Glasswing Gardens drops to 1', () => {
    expect(at(INITIAL_BUDGET, { GARDENS: 1 }).ranking.recommendedHotelId).toBe('COPPERLINE')
  })

  it('recalculates every travel score, not just the recommendation', () => {
    const before = at(INITIAL_BUDGET).ranking.rows.find((row) => row.hotelId === 'LANTERN_COURT')
    const after = at(INITIAL_BUDGET, { GARDENS: 1 }).ranking.rows.find((row) => row.hotelId === 'LANTERN_COURT')

    // Lantern Court is 13 minutes from Gardens; importance 4 -> 1 removes 3 x 13.
    expect(before.weightedTravelTotal - after.weightedTravelTotal).toBe(39)
  })

  it('changes the importance total that the average is divided by', () => {
    expect(at(INITIAL_BUDGET).ranking.importanceTotal).toBe(49)
    expect(at(INITIAL_BUDGET, { GARDENS: 1 }).ranking.importanceTotal).toBe(46)
  })

  it('goes back to the original recommendation when the edit is undone', () => {
    expect(at(INITIAL_BUDGET, { GARDENS: 4 }).ranking.recommendedHotelId).toBe('LANTERN_COURT')
  })
})

describe('computeComparison — invalid input clears everything', () => {
  it('rejects an importance above 5 and produces no ranking at all', () => {
    const result = at(INITIAL_BUDGET, { GARDENS: 9 })

    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('INVALID_IMPORTANCE')
    expect(result.ranking).toBeNull() // this is what wipes the stale result
  })

  it('rejects an emptied importance box rather than treating it as zero', () => {
    const result = at(INITIAL_BUDGET, { GARDENS: '' })
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('INVALID_IMPORTANCE')
    expect(result.ranking).toBeNull()
  })

  it('rejects a negative budget', () => {
    const result = at(-1)
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('INVALID_BUDGET')
    expect(result.ranking).toBeNull()
  })

  it('rejects an emptied budget box', () => {
    const result = at('')
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('INVALID_BUDGET')
    expect(result.ranking).toBeNull()
  })

  it('names the offending place so the screen can point at it', () => {
    expect(at(INITIAL_BUDGET, { GARDENS: 9 }).error.subject).toEqual({ placeId: 'GARDENS' })
  })

  it('still returns the places, so the map keeps its markers while erroring', () => {
    const result = at(INITIAL_BUDGET, { GARDENS: 9 })
    expect(result.places).toHaveLength(15)
  })
})

describe('computeComparison — reset', () => {
  it('restores the documented result exactly by calling with the original values', () => {
    const start = at(INITIAL_BUDGET)

    // wander around: bad budget, importance edits, a huge budget
    at(-1)
    at(INITIAL_BUDGET, { GARDENS: 1, NIGHTMARKET: 2 })
    at(999999)

    const afterReset = at(INITIAL_BUDGET, {})

    expect(afterReset.ranking.recommendedHotelId).toBe(start.ranking.recommendedHotelId)
    expect(afterReset.ranking.importanceTotal).toBe(start.ranking.importanceTotal)
    expect(afterReset.ranking.rows).toEqual(start.ranking.rows)
  })
})

describe('applyImportanceOverrides — the original data is never touched', () => {
  it('leaves the source places untouched when an override is applied', () => {
    const before = PLACES.find((p) => p.id === 'GARDENS').importance
    applyImportanceOverrides(PLACES, { GARDENS: 1 })
    expect(PLACES.find((p) => p.id === 'GARDENS').importance).toBe(before)
  })

  it('returns a copy carrying the new value', () => {
    const merged = applyImportanceOverrides(PLACES, { GARDENS: 1 })
    expect(merged.find((p) => p.id === 'GARDENS').importance).toBe(1)
    expect(merged).not.toBe(PLACES)
  })

  it('leaves places that were not edited exactly as they were', () => {
    const merged = applyImportanceOverrides(PLACES, { GARDENS: 1 })
    const untouched = merged.filter((p) => p.id !== 'GARDENS')
    expect(untouched).toEqual(PLACES.filter((p) => p.id !== 'GARDENS'))
  })

  it('hands back the same array when there is nothing to override', () => {
    expect(applyImportanceOverrides(PLACES, {})).toBe(PLACES)
    expect(applyImportanceOverrides(PLACES)).toBe(PLACES)
  })

  it('passes odd values straight through so the validator can reject them', () => {
    const merged = applyImportanceOverrides(PLACES, { GARDENS: 'abc' })
    expect(merged.find((p) => p.id === 'GARDENS').importance).toBe('abc')
  })
})
