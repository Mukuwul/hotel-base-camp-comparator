import { describe, it, expect } from 'vitest'
import { validateScenario } from '../src/engine/validate.js'
import { HOTELS, PLACES, INITIAL_BUDGET } from '../src/data/demoCity.js'

// The smallest scenario the rules allow: 3 places, 2 hotels.
// Every test starts from this and breaks exactly ONE thing, so whatever code
// comes back can only have been caused by that single change.
const basePlaces = () => [
  { id: 'ALPHA', name: 'Alpha Tower', type: 'attraction', importance: 3, x: 10, y: 10 },
  { id: 'BETA', name: 'Beta Bistro', type: 'food', importance: 5, x: 50, y: 50 },
  { id: 'GAMMA', name: 'Gamma Gallery', type: 'attraction', importance: 1, x: 90, y: 90 },
]

const baseHotels = () => [
  {
    id: 'INN_ONE', name: 'Inn One', stay_cost: 1000, x: 20, y: 20,
    round_trip_minutes: { ALPHA: 10, BETA: 20, GAMMA: 30 },
  },
  {
    id: 'INN_TWO', name: 'Inn Two', stay_cost: 2000, x: 80, y: 80,
    round_trip_minutes: { ALPHA: 40, BETA: 50, GAMMA: 60 },
  },
]

const scenario = (overrides = {}) => ({
  places: basePlaces(),
  hotels: baseHotels(),
  budget: 1500,
  ...overrides,
})

const expectFailure = (input, code) => {
  const result = validateScenario(input)
  expect(result.ok).toBe(false)
  expect(result.code).toBe(code)
  return result
}

describe('validateScenario — accepts valid input', () => {
  it('accepts the real demonstration city', () => {
    expect(validateScenario({ hotels: HOTELS, places: PLACES, budget: INITIAL_BUDGET })).toEqual({ ok: true })
  })

  it('accepts the smallest allowed scenario (3 places, 2 hotels)', () => {
    expect(validateScenario(scenario())).toEqual({ ok: true })
  })

  it('accepts a budget of 0 — no hotel is affordable, but that is a result, not an error', () => {
    expect(validateScenario(scenario({ budget: 0 }))).toEqual({ ok: true })
  })
})

describe('validateScenario — budget', () => {
  it('rejects a negative budget', () => {
    expectFailure(scenario({ budget: -1 }), 'INVALID_BUDGET')
  })

  it('rejects a budget above 1,000,000', () => {
    expectFailure(scenario({ budget: 1_000_001 }), 'INVALID_BUDGET')
  })

  it('rejects a fractional budget', () => {
    expectFailure(scenario({ budget: 1500.5 }), 'INVALID_BUDGET')
  })

  it('rejects a budget that is a string, even a numeric-looking one', () => {
    expectFailure(scenario({ budget: '1500' }), 'INVALID_BUDGET')
  })

  it('rejects NaN', () => {
    expectFailure(scenario({ budget: Number.NaN }), 'INVALID_BUDGET')
  })
})

describe('validateScenario — collection sizes', () => {
  it('rejects fewer than 3 places', () => {
    expectFailure(scenario({ places: basePlaces().slice(0, 2) }), 'INVALID_PLACE_COUNT')
  })

  it('rejects more than 15 places', () => {
    const tooMany = [...PLACES, { ...PLACES[0], id: 'EXTRA' }]
    expectFailure({ hotels: HOTELS, places: tooMany, budget: INITIAL_BUDGET }, 'INVALID_PLACE_COUNT')
  })

  it('rejects fewer than 2 hotels', () => {
    expectFailure(scenario({ hotels: baseHotels().slice(0, 1) }), 'INVALID_HOTEL_COUNT')
  })

  it('rejects more than 10 hotels', () => {
    const tooMany = [...HOTELS, { ...HOTELS[0], id: 'EXTRA_HOTEL' }]
    expectFailure({ hotels: tooMany, places: PLACES, budget: INITIAL_BUDGET }, 'INVALID_HOTEL_COUNT')
  })
})

describe('validateScenario — IDs', () => {
  it('rejects a place ID that does not start with a capital letter', () => {
    const places = basePlaces()
    places[1].id = 'beta'
    expectFailure(scenario({ places }), 'INVALID_ID')
  })

  it('rejects a place ID longer than 16 characters', () => {
    const places = basePlaces()
    places[0].id = 'A'.repeat(17)
    expectFailure(scenario({ places }), 'INVALID_ID')
  })

  it('rejects an ID containing a space', () => {
    const places = basePlaces()
    places[0].id = 'ALPHA TOWER'
    expectFailure(scenario({ places }), 'INVALID_ID')
  })

  it('rejects a malformed hotel ID', () => {
    const hotels = baseHotels()
    hotels[0].id = '1INN'
    expectFailure(scenario({ hotels }), 'INVALID_ID')
  })

  it('rejects a duplicated place ID', () => {
    const places = basePlaces()
    places[2].id = 'ALPHA'
    expectFailure(scenario({ places }), 'DUPLICATE_ID')
  })

  it('rejects a duplicated hotel ID', () => {
    const hotels = baseHotels()
    hotels[1].id = 'INN_ONE'
    expectFailure(scenario({ hotels }), 'DUPLICATE_ID')
  })

  it('rejects a hotel reusing a place ID — IDs are unique across the whole scenario', () => {
    const hotels = baseHotels()
    hotels[0].id = 'ALPHA'
    expectFailure(scenario({ hotels }), 'DUPLICATE_ID')
  })

  it('names the offending ID in the failure subject', () => {
    const places = basePlaces()
    places[2].id = 'ALPHA'
    const result = expectFailure(scenario({ places }), 'DUPLICATE_ID')
    expect(result.subject).toEqual({ placeId: 'ALPHA' })
  })
})

describe('validateScenario — names and types', () => {
  it('rejects an empty place name', () => {
    const places = basePlaces()
    places[0].name = ''
    expectFailure(scenario({ places }), 'EMPTY_NAME')
  })

  it('rejects a place name that is only whitespace', () => {
    const places = basePlaces()
    places[0].name = '   '
    expectFailure(scenario({ places }), 'EMPTY_NAME')
  })

  it('rejects an empty hotel name', () => {
    const hotels = baseHotels()
    hotels[1].name = '  '
    expectFailure(scenario({ hotels }), 'EMPTY_NAME')
  })

  it('rejects a place type that is neither attraction nor food', () => {
    const places = basePlaces()
    places[1].type = 'museum'
    expectFailure(scenario({ places }), 'INVALID_PLACE_TYPE')
  })
})

describe('validateScenario — numeric ranges', () => {
  it('rejects importance of 0', () => {
    const places = basePlaces()
    places[0].importance = 0
    expectFailure(scenario({ places }), 'INVALID_IMPORTANCE')
  })

  it('rejects importance of 6', () => {
    const places = basePlaces()
    places[0].importance = 6
    expectFailure(scenario({ places }), 'INVALID_IMPORTANCE')
  })

  it('rejects fractional importance', () => {
    const places = basePlaces()
    places[0].importance = 3.5
    expectFailure(scenario({ places }), 'INVALID_IMPORTANCE')
  })

  it('rejects a stay cost of 0 — the minimum is 1', () => {
    const hotels = baseHotels()
    hotels[0].stay_cost = 0
    expectFailure(scenario({ hotels }), 'INVALID_STAY_COST')
  })

  it('rejects a fractional stay cost', () => {
    const hotels = baseHotels()
    hotels[0].stay_cost = 1000.5
    expectFailure(scenario({ hotels }), 'INVALID_STAY_COST')
  })
})

describe('validateScenario — travel-time mappings', () => {
  it('rejects a hotel missing a travel time for one place', () => {
    const hotels = baseHotels()
    delete hotels[0].round_trip_minutes.BETA
    const result = expectFailure(scenario({ hotels }), 'INCOMPLETE_TRAVEL_MAP')
    expect(result.subject).toEqual({ hotelId: 'INN_ONE', placeId: 'BETA' })
  })

  it('rejects a hotel with no mapping at all', () => {
    const hotels = baseHotels()
    delete hotels[1].round_trip_minutes
    expectFailure(scenario({ hotels }), 'INCOMPLETE_TRAVEL_MAP')
  })

  it('rejects a travel time for a place that is not on the wishlist', () => {
    const hotels = baseHotels()
    hotels[0].round_trip_minutes.DELTA = 25
    const result = expectFailure(scenario({ hotels }), 'UNKNOWN_TRAVEL_PLACE')
    expect(result.subject).toEqual({ hotelId: 'INN_ONE', placeId: 'DELTA' })
  })

  it('rejects a travel time of 0 — the minimum is 1', () => {
    const hotels = baseHotels()
    hotels[0].round_trip_minutes.ALPHA = 0
    expectFailure(scenario({ hotels }), 'INVALID_TRAVEL_TIME')
  })

  it('rejects a travel time above 600', () => {
    const hotels = baseHotels()
    hotels[0].round_trip_minutes.ALPHA = 601
    expectFailure(scenario({ hotels }), 'INVALID_TRAVEL_TIME')
  })

  it('rejects a fractional travel time', () => {
    const hotels = baseHotels()
    hotels[0].round_trip_minutes.GAMMA = 30.5
    expectFailure(scenario({ hotels }), 'INVALID_TRAVEL_TIME')
  })
})

describe('validateScenario — reporting order is fixed', () => {
  // A scenario can be broken in several ways at once. The documented order is
  // budget -> counts -> places -> hotels -> travel maps, and these tests pin
  // that down so the reported error never drifts between runs or refactors.

  it('reports the budget problem before a duplicate ID', () => {
    const places = basePlaces()
    places[2].id = 'ALPHA'
    expectFailure(scenario({ places, budget: -1 }), 'INVALID_BUDGET')
  })

  it('reports the count problem before a bad place type', () => {
    const places = basePlaces().slice(0, 2)
    places[0].type = 'museum'
    expectFailure(scenario({ places }), 'INVALID_PLACE_COUNT')
  })

  it('reports a place problem before a hotel problem', () => {
    const places = basePlaces()
    const hotels = baseHotels()
    places[0].importance = 9
    hotels[0].stay_cost = 0
    expectFailure(scenario({ places, hotels }), 'INVALID_IMPORTANCE')
  })

  it('reports a hotel field problem before a travel-map problem', () => {
    const hotels = baseHotels()
    hotels[0].stay_cost = 0
    delete hotels[0].round_trip_minutes.BETA
    expectFailure(scenario({ hotels }), 'INVALID_STAY_COST')
  })
})
