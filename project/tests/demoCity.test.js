import { describe, it, expect } from 'vitest'
import { PLACES, HOTELS, INITIAL_BUDGET } from '../src/data/demoCity.js'

// ---------------------------------------------------------------------------
// Independently documented expected results (the "oracle").
// These were worked out separately from the application's ranking engine.
// Nothing in src/ is imported to produce them — this file does its own
// arithmetic, so it acts as a second calculation path, not a self-check.
// ---------------------------------------------------------------------------
const EXPECTED_IMPORTANCE_TOTAL = 49

const EXPECTED_WEIGHTED_TOTALS = {
  GILDED_ANCHOR: 4286,
  LANTERN_COURT: 2821,
  DOCKSIDE: 3687,
  MAPLE_VINE: 3697,
  RIDGEVIEW: 3499,
  COPPERLINE: 2959,
  SALTWIND: 3005,
  MERIDIAN: 2815,
  FOXGLOVE: 3702,
  HARBOUR_GATE: 3857,
}

// The full oracle: all five fields the acceptance criteria ask for, per hotel,
// worked out ahead of time and recorded here as plain constants — not derived
// from anything in src/engine. `remaining` is left in the budget when
// affordable, `shortfall` is how far over when not; exactly one of the two
// applies per hotel. `rank` is null for every hotel that is not affordable.
const EXPECTED_RESULTS = {
  GILDED_ANCHOR: { total: 4286, average: '87.5', affordable: false, remaining: null, shortfall: 701, rank: null },
  LANTERN_COURT: { total: 2821, average: '57.6', affordable: true, remaining: 1540, shortfall: null, rank: 1 },
  DOCKSIDE: { total: 3687, average: '75.2', affordable: true, remaining: 1670, shortfall: null, rank: 4 },
  MAPLE_VINE: { total: 3697, average: '75.4', affordable: true, remaining: 922, shortfall: null, rank: 5 },
  RIDGEVIEW: { total: 3499, average: '71.4', affordable: false, remaining: null, shortfall: 1201, rank: null },
  COPPERLINE: { total: 2959, average: '60.4', affordable: true, remaining: 233, shortfall: null, rank: 2 },
  SALTWIND: { total: 3005, average: '61.3', affordable: true, remaining: 1239, shortfall: null, rank: 3 },
  MERIDIAN: { total: 2815, average: '57.4', affordable: false, remaining: null, shortfall: 2060, rank: null },
  FOXGLOVE: { total: 3702, average: '75.6', affordable: true, remaining: 935, shortfall: null, rank: 6 },
  HARBOUR_GATE: { total: 3857, average: '78.7', affordable: true, remaining: 0, shortfall: null, rank: 7 },
}

// Local, deliberately independent helpers — NOT imported from src/engine.
// The average here uses plain floating-point rounding rather than the
// engine's integer round-half-up formula, so this is a genuinely different
// calculation path, not the same formula copied into a second file.
const importanceTotal = (places) => places.reduce((sum, p) => sum + p.importance, 0)
const weightedTotal = (hotel, places) =>
  places.reduce((sum, p) => sum + p.importance * hotel.round_trip_minutes[p.id], 0)
const roundedAverage = (total, impTotal) => (Math.round((total / impTotal) * 10) / 10).toFixed(1)
const affordableIn = (budget) => HOTELS.filter((h) => h.stay_cost <= budget)
const bestBy = (hotels, places) =>
  hotels.reduce((best, h) => (weightedTotal(h, places) < weightedTotal(best, places) ? h : best))

// Independent ranking: sort every affordable hotel by total asc, then cost
// asc, then ID ascending, and number them 1..n. This mirrors the spec's rule
// in plain code rather than importing rankHotels from src/engine.
const rankAllIndependently = (hotels, places, budget) => {
  const affordable = hotels
    .filter((h) => h.stay_cost <= budget)
    .sort((a, b) =>
      weightedTotal(a, places) - weightedTotal(b, places) ||
      a.stay_cost - b.stay_cost ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
  const rankOf = Object.fromEntries(affordable.map((h, i) => [h.id, i + 1]))
  return (hotelId) => rankOf[hotelId] ?? null
}

describe('demoCity — structural rules from the problem statement', () => {
  it('has exactly 10 hotels and 15 places', () => {
    expect(HOTELS).toHaveLength(10)
    expect(PLACES).toHaveLength(15)
  })

  it('has at least 3 attractions and 3 food stops', () => {
    expect(PLACES.filter((p) => p.type === 'attraction').length).toBeGreaterThanOrEqual(3)
    expect(PLACES.filter((p) => p.type === 'food').length).toBeGreaterThanOrEqual(3)
  })

  it('uses at least 3 different importance values, all whole numbers 1-5', () => {
    const values = PLACES.map((p) => p.importance)
    expect(new Set(values).size).toBeGreaterThanOrEqual(3)
    values.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(5)
    })
  })

  it('gives every hotel and place a unique ID matching [A-Z][A-Z0-9_-]{0,15}', () => {
    const ids = [...HOTELS.map((h) => h.id), ...PLACES.map((p) => p.id)]
    expect(new Set(ids).size).toBe(25)
    ids.forEach((id) => expect(id).toMatch(/^[A-Z][A-Z0-9_-]{0,15}$/))
  })

  it('gives every hotel and place a non-empty display name', () => {
    ;[...HOTELS, ...PLACES].forEach((item) => {
      expect(item.name.trim().length).toBeGreaterThan(0)
    })
  })

  it('gives every hotel a complete travel-time mapping with no missing or unknown places', () => {
    const placeIds = PLACES.map((p) => p.id).sort()
    HOTELS.forEach((hotel) => {
      expect(Object.keys(hotel.round_trip_minutes).sort()).toEqual(placeIds)
    })
  })

  it('keeps every travel time a whole number from 1 to 600', () => {
    HOTELS.forEach((hotel) => {
      Object.values(hotel.round_trip_minutes).forEach((minutes) => {
        expect(Number.isInteger(minutes)).toBe(true)
        expect(minutes).toBeGreaterThanOrEqual(1)
        expect(minutes).toBeLessThanOrEqual(600)
      })
    })
  })

  it('keeps every stay cost a whole number from 1 to 1,000,000', () => {
    HOTELS.forEach((hotel) => {
      expect(Number.isInteger(hotel.stay_cost)).toBe(true)
      expect(hotel.stay_cost).toBeGreaterThanOrEqual(1)
      expect(hotel.stay_cost).toBeLessThanOrEqual(1_000_000)
    })
  })

  it('keeps all map coordinates within 0-100 (presentation only)', () => {
    ;[...HOTELS, ...PLACES].forEach((item) => {
      expect(item.x).toBeGreaterThanOrEqual(0)
      expect(item.x).toBeLessThanOrEqual(100)
      expect(item.y).toBeGreaterThanOrEqual(0)
      expect(item.y).toBeLessThanOrEqual(100)
    })
  })
})

describe('demoCity — matches the independently documented totals', () => {
  it('sums importance to the documented total', () => {
    expect(importanceTotal(PLACES)).toBe(EXPECTED_IMPORTANCE_TOTAL)
  })

  it.each(HOTELS.map((h) => [h.id, h]))(
    '%s reproduces its documented weighted travel total',
    (id, hotel) => {
      expect(weightedTotal(hotel, PLACES)).toBe(EXPECTED_WEIGHTED_TOTALS[id])
    },
  )
})

describe('demoCity — the full independently recorded oracle (all 5 required fields)', () => {
  const rankOf = rankAllIndependently(HOTELS, PLACES, INITIAL_BUDGET)

  it.each(HOTELS.map((h) => [h.id, h]))(
    '%s matches every documented field: total, average, affordability, remaining/shortfall, rank',
    (id, hotel) => {
      const expected = EXPECTED_RESULTS[id]
      const total = weightedTotal(hotel, PLACES)
      const affordable = hotel.stay_cost <= INITIAL_BUDGET

      expect(total).toBe(expected.total)
      expect(roundedAverage(total, importanceTotal(PLACES))).toBe(expected.average)
      expect(affordable).toBe(expected.affordable)
      expect(affordable ? INITIAL_BUDGET - hotel.stay_cost : null).toBe(expected.remaining)
      expect(affordable ? null : hotel.stay_cost - INITIAL_BUDGET).toBe(expected.shortfall)
      expect(rankOf(id)).toBe(expected.rank)
    },
  )

  it('agrees with the engine on every field for every hotel', async () => {
    const { rankHotels } = await import('../src/engine/ranking.js')
    const engineResult = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })

    HOTELS.forEach((hotel) => {
      const expected = EXPECTED_RESULTS[hotel.id]
      const row = engineResult.rows.find((r) => r.hotelId === hotel.id)

      expect(row.weightedTravelTotal).toBe(expected.total)
      expect(row.weightedAverageDisplay).toBe(expected.average)
      expect(row.affordable).toBe(expected.affordable)
      expect(row.remainingBudget).toBe(expected.remaining)
      expect(row.shortfall).toBe(expected.shortfall)
      expect(row.rank).toBe(expected.rank)
    })
  })
})

describe('demoCity — the six required story conditions', () => {
  it('1. leaves 4-7 hotels affordable at the initial budget', () => {
    expect(affordableIn(INITIAL_BUDGET).length).toBeGreaterThanOrEqual(4)
    expect(affordableIn(INITIAL_BUDGET).length).toBeLessThanOrEqual(7)
  })

  it('2. puts the uniquely most accessible hotel (MERIDIAN) over budget', () => {
    const best = bestBy(HOTELS, PLACES)
    expect(best.id).toBe('MERIDIAN')

    const bestTotal = weightedTotal(best, PLACES)
    const tied = HOTELS.filter((h) => weightedTotal(h, PLACES) === bestTotal)
    expect(tied).toHaveLength(1) // the lowest total must be unique

    expect(best.stay_cost).toBeGreaterThan(INITIAL_BUDGET)
  })

  it('3. recommends an affordable hotel that is not the cheapest affordable one', () => {
    const affordable = affordableIn(INITIAL_BUDGET)
    const recommended = bestBy(affordable, PLACES)
    const cheapest = affordable.reduce((c, h) => (h.stay_cost < c.stay_cost ? h : c))

    expect(recommended.id).toBe('LANTERN_COURT')
    expect(cheapest.id).toBe('DOCKSIDE')
    expect(recommended.id).not.toBe(cheapest.id)
  })

  it('4. has affordable hotels on both sides of the 90-minute boundary', () => {
    const affordable = affordableIn(INITIAL_BUDGET)
    const longestTrip = (h) => Math.max(...Object.values(h.round_trip_minutes))

    expect(affordable.some((h) => longestTrip(h) <= 90)).toBe(true)
    expect(affordable.some((h) => longestTrip(h) > 90)).toBe(true)
  })

  it('5. makes MERIDIAN the recommendation once the budget reaches its stay cost', () => {
    const meridian = HOTELS.find((h) => h.id === 'MERIDIAN')
    const raisedBudget = meridian.stay_cost

    expect(bestBy(affordableIn(raisedBudget), PLACES).id).toBe('MERIDIAN')
    // one currency unit lower and it must still be excluded
    expect(affordableIn(raisedBudget - 1).some((h) => h.id === 'MERIDIAN')).toBe(false)
  })

  it("6. changing GARDENS' importance from 4 to 1 flips the recommendation to COPPERLINE", () => {
    const affordable = affordableIn(INITIAL_BUDGET)
    expect(bestBy(affordable, PLACES).id).toBe('LANTERN_COURT')

    const tweaked = PLACES.map((p) => (p.id === 'GARDENS' ? { ...p, importance: 1 } : p))
    expect(bestBy(affordable, tweaked).id).toBe('COPPERLINE')
  })
})

describe('demoCity — free edge case built into the main scenario', () => {
  it('has a hotel priced exactly at the budget, which counts as affordable', () => {
    const onBudget = HOTELS.find((h) => h.stay_cost === INITIAL_BUDGET)
    expect(onBudget.id).toBe('HARBOUR_GATE')
    expect(affordableIn(INITIAL_BUDGET).map((h) => h.id)).toContain('HARBOUR_GATE')
  })
})
