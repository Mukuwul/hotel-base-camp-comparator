// Validation for one complete comparison scenario.
//
// Everything is checked BEFORE any ranking happens. The app must never show a
// partial ranking assembled from the records that happened to look valid, so
// this returns on the first problem it finds and the caller shows nothing.
//
// The order of checks is fixed and documented below, which means the same bad
// scenario always reports the same first error — that keeps tests stable and
// keeps the on-screen message predictable.
//
//   1. budget
//   2. collection sizes
//   3. places, in source order
//   4. hotels, in source order
//   5. hotel-to-place travel-time mappings

const ID_PATTERN = /^[A-Z][A-Z0-9_-]{0,15}$/
const PLACE_TYPES = ['attraction', 'food']

const LIMITS = {
  hotels: { min: 2, max: 10 },
  places: { min: 3, max: 15 },
  budget: { min: 0, max: 1_000_000 },
  stayCost: { min: 1, max: 1_000_000 },
  importance: { min: 1, max: 5 },
  travelMinutes: { min: 1, max: 600 },
}

const ok = () => ({ ok: true })
const fail = (code, message, subject = null) => ({ ok: false, code, message, subject })

const isWholeNumberInRange = (value, { min, max }) =>
  Number.isInteger(value) && value >= min && value <= max

const hasText = (value) => typeof value === 'string' && value.trim().length > 0

export function validateScenario({ hotels, places, budget }) {
  // 1. Budget ---------------------------------------------------------------
  if (!isWholeNumberInRange(budget, LIMITS.budget)) {
    return fail(
      'INVALID_BUDGET',
      `Budget must be a whole number from ${LIMITS.budget.min} to ${LIMITS.budget.max}.`,
      { budget },
    )
  }

  // 2. Collection sizes -----------------------------------------------------
  if (!Array.isArray(places) || !isWholeNumberInRange(places.length, LIMITS.places)) {
    return fail(
      'INVALID_PLACE_COUNT',
      `Expected ${LIMITS.places.min}-${LIMITS.places.max} wishlist places, found ${places?.length ?? 0}.`,
    )
  }
  if (!Array.isArray(hotels) || !isWholeNumberInRange(hotels.length, LIMITS.hotels)) {
    return fail(
      'INVALID_HOTEL_COUNT',
      `Expected ${LIMITS.hotels.min}-${LIMITS.hotels.max} hotels, found ${hotels?.length ?? 0}.`,
    )
  }

  // IDs must be unique across the WHOLE scenario, not just within each list,
  // so hotels and places share one set.
  const seenIds = new Set()

  // 3. Places, in source order ----------------------------------------------
  for (const place of places) {
    if (!ID_PATTERN.test(place?.id ?? '')) {
      return fail('INVALID_ID', `Place ID "${place?.id}" must match ${ID_PATTERN}.`, { placeId: place?.id })
    }
    if (seenIds.has(place.id)) {
      return fail('DUPLICATE_ID', `ID "${place.id}" is used more than once in this scenario.`, { placeId: place.id })
    }
    seenIds.add(place.id)

    if (!hasText(place.name)) {
      return fail('EMPTY_NAME', `Place "${place.id}" has an empty display name.`, { placeId: place.id })
    }
    if (!PLACE_TYPES.includes(place.type)) {
      return fail(
        'INVALID_PLACE_TYPE',
        `Place "${place.id}" has type "${place.type}"; expected ${PLACE_TYPES.join(' or ')}.`,
        { placeId: place.id },
      )
    }
    if (!isWholeNumberInRange(place.importance, LIMITS.importance)) {
      return fail(
        'INVALID_IMPORTANCE',
        `Place "${place.id}" has importance ${place.importance}; expected a whole number from ${LIMITS.importance.min} to ${LIMITS.importance.max}.`,
        { placeId: place.id },
      )
    }
  }

  // 4. Hotels, in source order ----------------------------------------------
  for (const hotel of hotels) {
    if (!ID_PATTERN.test(hotel?.id ?? '')) {
      return fail('INVALID_ID', `Hotel ID "${hotel?.id}" must match ${ID_PATTERN}.`, { hotelId: hotel?.id })
    }
    if (seenIds.has(hotel.id)) {
      return fail('DUPLICATE_ID', `ID "${hotel.id}" is used more than once in this scenario.`, { hotelId: hotel.id })
    }
    seenIds.add(hotel.id)

    if (!hasText(hotel.name)) {
      return fail('EMPTY_NAME', `Hotel "${hotel.id}" has an empty display name.`, { hotelId: hotel.id })
    }
    if (!isWholeNumberInRange(hotel.stay_cost, LIMITS.stayCost)) {
      return fail(
        'INVALID_STAY_COST',
        `Hotel "${hotel.id}" has stay cost ${hotel.stay_cost}; expected a whole number from ${LIMITS.stayCost.min} to ${LIMITS.stayCost.max}.`,
        { hotelId: hotel.id },
      )
    }
  }

  // 5. Travel-time mappings -------------------------------------------------
  // Every hotel needs a time for every place: no gaps, and nothing extra.
  const placeIds = places.map((place) => place.id)

  for (const hotel of hotels) {
    const mapping = hotel.round_trip_minutes

    if (mapping === null || typeof mapping !== 'object') {
      return fail(
        'INCOMPLETE_TRAVEL_MAP',
        `Hotel "${hotel.id}" has no round_trip_minutes mapping.`,
        { hotelId: hotel.id },
      )
    }

    for (const placeId of placeIds) {
      if (!Object.hasOwn(mapping, placeId)) {
        return fail(
          'INCOMPLETE_TRAVEL_MAP',
          `Hotel "${hotel.id}" is missing a travel time for place "${placeId}".`,
          { hotelId: hotel.id, placeId },
        )
      }
    }

    for (const key of Object.keys(mapping)) {
      if (!placeIds.includes(key)) {
        return fail(
          'UNKNOWN_TRAVEL_PLACE',
          `Hotel "${hotel.id}" has a travel time for "${key}", which is not a wishlist place.`,
          { hotelId: hotel.id, placeId: key },
        )
      }
    }

    for (const placeId of placeIds) {
      if (!isWholeNumberInRange(mapping[placeId], LIMITS.travelMinutes)) {
        return fail(
          'INVALID_TRAVEL_TIME',
          `Hotel "${hotel.id}" has travel time ${mapping[placeId]} for "${placeId}"; expected a whole number from ${LIMITS.travelMinutes.min} to ${LIMITS.travelMinutes.max}.`,
          { hotelId: hotel.id, placeId },
        )
      }
    }
  }

  return ok()
}
