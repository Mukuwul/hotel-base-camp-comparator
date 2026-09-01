import { describe, it, expect } from 'vitest'
import {
  contributionOf,
  weightedTravelTotalOf,
  importanceTotalOf,
  weightedAverageTenthsOf,
  formatTenths,
  rankHotels,
  explainHotel,
  sortedByRank,
  overBudget,
} from '../src/engine/ranking.js'
import { HOTELS, PLACES, INITIAL_BUDGET } from '../src/data/demoCity.js'

const place = (id, importance, type = 'attraction') => ({
  id, name: `Place ${id}`, type, importance, x: 50, y: 50,
})

const hotel = (id, stayCost, minutesByPlace, name = `Hotel ${id}`) => ({
  id, name, stay_cost: stayCost, x: 50, y: 50, round_trip_minutes: minutesByPlace,
})

describe('ranking — the arithmetic from the problem statement', () => {
  // The spec's own worked example: CLOCK has importance 3 with a 20-minute
  // round trip, MARKET has importance 2 with a 40-minute round trip.
  // It states the answers are 140 importance-minutes and 28.0 minutes.
  const specPlaces = [place('CLOCK', 3), place('MARKET', 2, 'food')]
  const specHotel = hotel('H_SPEC', 1, { CLOCK: 20, MARKET: 40 })

  it('reproduces the spec example: (3 x 20) + (2 x 40) = 140', () => {
    expect(weightedTravelTotalOf(specHotel, specPlaces)).toBe(140)
  })

  it('reproduces the spec example average: 140 / 5 = 28.0', () => {
    const total = weightedTravelTotalOf(specHotel, specPlaces)
    const importance = importanceTotalOf(specPlaces)
    expect(importance).toBe(5)
    expect(formatTenths(weightedAverageTenthsOf(total, importance))).toBe('28.0')
  })

  it('multiplies one place correctly', () => {
    expect(contributionOf(specHotel, specPlaces[0])).toBe(60)
    expect(contributionOf(specHotel, specPlaces[1])).toBe(80)
  })

  it('sums importance across every place', () => {
    expect(importanceTotalOf(PLACES)).toBe(49)
  })
})

describe('ranking — round-half-up display', () => {
  it('rounds a value sitting exactly on the halfway mark UP', () => {
    // 5 / 4 = 1.25 minutes -> 12.5 tenths -> must become 13, not 12
    expect(weightedAverageTenthsOf(5, 4)).toBe(13)
    expect(formatTenths(weightedAverageTenthsOf(5, 4))).toBe('1.3')
  })

  it('rounds a value below the halfway mark down', () => {
    // 5 / 6 = 0.8333 -> 8.33 tenths -> 8
    expect(weightedAverageTenthsOf(5, 6)).toBe(8)
    expect(formatTenths(weightedAverageTenthsOf(5, 6))).toBe('0.8')
  })

  it('always shows exactly one decimal place, including a trailing zero', () => {
    expect(formatTenths(280)).toBe('28.0')
    expect(formatTenths(50)).toBe('5.0')
  })

  it('never lets the rounded average decide the order', () => {
    // Two hotels whose averages BOTH display as 5.0, but whose exact totals
    // differ by 1. The smaller exact total has to win.
    const places = [place('A', 5), place('B', 5), place('C', 5), place('D', 4), place('E', 1, 'food')]
    const lower = hotel('H_LOWER', 100, { A: 5, B: 5, C: 5, D: 5, E: 4 })   // total 99
    const higher = hotel('H_HIGHER', 100, { A: 5, B: 5, C: 5, D: 6, E: 1 }) // total 100

    const result = rankHotels({ hotels: [higher, lower], places, budget: 500 })
    const rows = Object.fromEntries(result.rows.map((row) => [row.hotelId, row]))

    expect(rows.H_LOWER.weightedTravelTotal).toBe(99)
    expect(rows.H_HIGHER.weightedTravelTotal).toBe(100)
    expect(rows.H_LOWER.weightedAverageDisplay).toBe('5.0')
    expect(rows.H_HIGHER.weightedAverageDisplay).toBe('5.0') // identical on screen
    expect(rows.H_LOWER.rank).toBe(1) // but the exact total still decides
    expect(rows.H_HIGHER.rank).toBe(2)
  })
})

describe('ranking — tie-breaks', () => {
  const places = [place('P1', 2), place('P2', 3, 'food')]

  it('breaks an accessibility tie with the lower stay cost', () => {
    const pricey = hotel('H_PRICEY', 900, { P1: 10, P2: 10 })
    const cheap = hotel('H_CHEAP', 400, { P1: 10, P2: 10 })

    const result = rankHotels({ hotels: [pricey, cheap], places, budget: 1000 })
    const rows = Object.fromEntries(result.rows.map((row) => [row.hotelId, row]))

    expect(rows.H_PRICEY.weightedTravelTotal).toBe(rows.H_CHEAP.weightedTravelTotal)
    expect(rows.H_CHEAP.rank).toBe(1)
    expect(result.recommendedHotelId).toBe('H_CHEAP')
  })

  it('breaks a complete tie with ASCII order of the hotel ID', () => {
    const later = hotel('H_BBB', 500, { P1: 10, P2: 10 })
    const earlier = hotel('H_AAA', 500, { P1: 10, P2: 10 })

    const result = rankHotels({ hotels: [later, earlier], places, budget: 1000 })
    expect(result.recommendedHotelId).toBe('H_AAA')
  })

  it('ignores display name and source order when breaking a complete tie', () => {
    // H_BBB is listed first AND named "Aardvark Inn"; neither may help it win.
    const listedFirst = hotel('H_BBB', 500, { P1: 10, P2: 10 }, 'Aardvark Inn')
    const listedSecond = hotel('H_AAA', 500, { P1: 10, P2: 10 }, 'Zebra Lodge')

    const result = rankHotels({ hotels: [listedFirst, listedSecond], places, budget: 1000 })
    expect(result.recommendedHotelId).toBe('H_AAA')
  })
})

describe('ranking — affordability', () => {
  it('counts a hotel priced exactly at the budget as affordable', () => {
    const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })
    const onBudget = result.rows.find((row) => row.hotelId === 'HARBOUR_GATE')

    expect(onBudget.stayCost).toBe(INITIAL_BUDGET)
    expect(onBudget.affordable).toBe(true)
    expect(onBudget.rank).not.toBeNull()
    expect(onBudget.remainingBudget).toBe(0)
  })

  it('excludes a hotel that is one currency unit over budget', () => {
    const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET - 1 })
    const justOver = result.rows.find((row) => row.hotelId === 'HARBOUR_GATE')

    expect(justOver.affordable).toBe(false)
    expect(justOver.rank).toBeNull()
    expect(justOver.shortfall).toBe(1)
    expect(justOver.remainingBudget).toBeNull()
  })

  it('keeps over-budget hotels visible with a shortfall and no rank', () => {
    const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })
    const excluded = overBudget(result.rows)

    expect(excluded.map((row) => row.hotelId)).toEqual(['GILDED_ANCHOR', 'RIDGEVIEW', 'MERIDIAN'])
    excluded.forEach((row) => {
      expect(row.rank).toBeNull()
      expect(row.recommended).toBe(false)
      expect(row.shortfall).toBeGreaterThan(0)
    })
  })

  it('never recommends an over-budget hotel even when it is the most accessible', () => {
    const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })
    const meridian = result.rows.find((row) => row.hotelId === 'MERIDIAN')
    const recommended = result.rows.find((row) => row.recommended)

    // MERIDIAN has the lowest total of all ten hotels...
    expect(Math.min(...result.rows.map((row) => row.weightedTravelTotal)))
      .toBe(meridian.weightedTravelTotal)
    // ...and is still not the recommendation, because it costs too much.
    expect(recommended.hotelId).toBe('LANTERN_COURT')
  })

  it('reports NO_AFFORDABLE_HOTEL with no recommendation when nothing fits', () => {
    const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: 0 })

    expect(result.status).toBe('NO_AFFORDABLE_HOTEL')
    expect(result.recommendedHotelId).toBeNull()
    expect(result.rows.every((row) => row.rank === null)).toBe(true)
    expect(result.rows.every((row) => row.recommended === false)).toBe(true)
    // shortfalls are still there, so the screen can say how far off each one is
    expect(result.rows.every((row) => row.shortfall > 0)).toBe(true)
  })
})

describe('ranking — rank numbering', () => {
  const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })

  it('numbers affordable hotels 1, 2, 3... with no gaps', () => {
    const ranks = sortedByRank(result.rows).map((row) => row.rank)
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('marks exactly one hotel as recommended, and it is rank 1', () => {
    const recommended = result.rows.filter((row) => row.recommended)
    expect(recommended).toHaveLength(1)
    expect(recommended[0].rank).toBe(1)
    expect(recommended[0].hotelId).toBe(result.recommendedHotelId)
  })

  it('orders the demonstration city as documented', () => {
    expect(sortedByRank(result.rows).map((row) => row.hotelId)).toEqual([
      'LANTERN_COURT', 'COPPERLINE', 'SALTWIND', 'DOCKSIDE', 'MAPLE_VINE', 'FOXGLOVE', 'HARBOUR_GATE',
    ])
  })

  it('returns rows in source order, whatever the ranks turn out to be', () => {
    expect(result.rows.map((row) => row.hotelId)).toEqual(HOTELS.map((h) => h.id))
  })
})

describe('ranking — input order cannot change the answer', () => {
  const forwards = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })

  it('gives the same ranking when the hotels are listed in reverse', () => {
    const reversed = rankHotels({ hotels: [...HOTELS].reverse(), places: PLACES, budget: INITIAL_BUDGET })

    expect(reversed.recommendedHotelId).toBe(forwards.recommendedHotelId)
    expect(sortedByRank(reversed.rows).map((row) => row.hotelId))
      .toEqual(sortedByRank(forwards.rows).map((row) => row.hotelId))
  })

  it('gives the same totals when the places are listed in reverse', () => {
    const reversed = rankHotels({ hotels: HOTELS, places: [...PLACES].reverse(), budget: INITIAL_BUDGET })
    const totalsOf = (result) =>
      Object.fromEntries(result.rows.map((row) => [row.hotelId, row.weightedTravelTotal]))

    expect(totalsOf(reversed)).toEqual(totalsOf(forwards))
    expect(reversed.recommendedHotelId).toBe(forwards.recommendedHotelId)
  })
})

describe('explainHotel — the per-place breakdown', () => {
  const lantern = HOTELS.find((h) => h.id === 'LANTERN_COURT')
  const explanation = explainHotel(lantern, PLACES)

  it('returns one line per place, in source order', () => {
    expect(explanation.lines).toHaveLength(15)
    expect(explanation.lines.map((line) => line.placeId)).toEqual(PLACES.map((p) => p.id))
  })

  it('shows the supplied time and the weighted contribution on each line', () => {
    const clocktower = explanation.lines.find((line) => line.placeId === 'CLOCKTOWER')
    expect(clocktower.minutes).toBe(70)
    expect(clocktower.importance).toBe(4)
    expect(clocktower.contribution).toBe(280)
  })

  it('has contributions that add up to the hotel travel score used for ranking', () => {
    const result = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })
    const row = result.rows.find((r) => r.hotelId === 'LANTERN_COURT')

    const summed = explanation.lines.reduce((sum, line) => sum + line.contribution, 0)
    expect(summed).toBe(explanation.weightedTravelTotal)
    expect(summed).toBe(row.weightedTravelTotal)
    expect(summed).toBe(2821)
  })

  it('does not change the ranking when a different hotel is inspected', () => {
    const before = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })
    explainHotel(HOTELS.find((h) => h.id === 'MERIDIAN'), PLACES)
    const after = rankHotels({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })

    expect(after.recommendedHotelId).toBe(before.recommendedHotelId)
    expect(sortedByRank(after.rows).map((r) => r.hotelId))
      .toEqual(sortedByRank(before.rows).map((r) => r.hotelId))
  })
})
