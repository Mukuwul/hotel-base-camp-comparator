// The comparison maths: how accessible each hotel is, which ones fit the
// budget, and what order they come in.
//
// This assumes the scenario has ALREADY passed validateScenario(). Keeping the
// two apart means this file can stay focused on arithmetic and never has to
// second-guess its input.
//
// The formulas, straight from the problem statement:
//
//   contribution(hotel, place) = importance(place) x round_trip_minutes(hotel, place)
//   importance_total           = sum of every place's importance
//   weighted_travel_total(h)   = sum of every contribution for that hotel
//   weighted_average_minutes(h)= weighted_travel_total(h) / importance_total
//
// weighted_travel_total is a whole number and is the ONLY value used for
// comparing hotels. The average exists purely to be shown on screen.

export const importanceTotalOf = (places) =>
  places.reduce((sum, place) => sum + place.importance, 0)

export const contributionOf = (hotel, place) =>
  place.importance * hotel.round_trip_minutes[place.id]

export const weightedTravelTotalOf = (hotel, places) =>
  places.reduce((sum, place) => sum + contributionOf(hotel, place), 0)

/**
 * Round-half-up to one decimal place, done entirely in whole numbers.
 *
 * The obvious version — Math.round(total / importanceTotal * 10) / 10 — goes
 * through floating point, where a value that should sit exactly on .05 can
 * land a hair below it and round the wrong way. Staying in integers avoids
 * that completely.
 *
 * The identity: round(10T / I) with halves going up is the same as
 * floor((20T + I) / (2I)).
 *
 * Returns TENTHS as a whole number: 576 means 57.6 minutes.
 */
export const weightedAverageTenthsOf = (weightedTravelTotal, importanceTotal) =>
  Math.floor((20 * weightedTravelTotal + importanceTotal) / (2 * importanceTotal))

export const formatTenths = (tenths) => (tenths / 10).toFixed(1)

/**
 * Order for affordable hotels:
 *   1. lower weighted_travel_total wins
 *   2. then lower stay_cost wins
 *   3. then the ID that sorts earlier in ASCII wins
 *
 * Note the plain < and > on IDs rather than localeCompare(). localeCompare is
 * locale-dependent and would sort differently on different machines; the spec
 * asks for ASCII order specifically, which is what < and > give for IDs made
 * of A-Z, 0-9, underscore and hyphen.
 *
 * Deliberately absent from this comparison: display names, the order hotels
 * appear in the source data, map coordinates, and the rounded average. None
 * of them may influence the result.
 */
const compareForRanking = (a, b) =>
  a.weightedTravelTotal - b.weightedTravelTotal ||
  a.stayCost - b.stayCost ||
  (a.hotelId < b.hotelId ? -1 : a.hotelId > b.hotelId ? 1 : 0)

/**
 * Rank every hotel against the wishlist at the given budget.
 *
 * Returns rows in the SAME ORDER the hotels were supplied in, each carrying
 * its own rank. Source order is the stable, predictable thing to hand back;
 * any part of the UI that wants rank order can sort a copy.
 */
export function rankHotels({ hotels, places, budget }) {
  const importanceTotal = importanceTotalOf(places)

  const rows = hotels.map((hotel) => {
    const weightedTravelTotal = weightedTravelTotalOf(hotel, places)
    const affordable = hotel.stay_cost <= budget // equality counts as affordable
    const tenths = weightedAverageTenthsOf(weightedTravelTotal, importanceTotal)

    return {
      hotelId: hotel.id,
      name: hotel.name,
      stayCost: hotel.stay_cost,
      weightedTravelTotal,
      weightedAverageTenths: tenths,
      weightedAverageDisplay: formatTenths(tenths),
      affordable,
      // Exactly one of these is a number; the other is null.
      remainingBudget: affordable ? budget - hotel.stay_cost : null,
      shortfall: affordable ? null : hotel.stay_cost - budget,
      rank: null, // filled in below, for affordable hotels only
      recommended: false,
    }
  })

  // Ranks go to affordable hotels only, numbered 1, 2, 3... with no gaps.
  // Over-budget hotels stay in the results with a shortfall and no rank, so
  // the UI can keep showing them with a reason instead of hiding them.
  const ranked = rows.filter((row) => row.affordable).sort(compareForRanking)
  ranked.forEach((row, index) => {
    row.rank = index + 1
  })

  const recommended = ranked[0] ?? null
  if (recommended) recommended.recommended = true

  return {
    status: ranked.length > 0 ? 'RANKED' : 'NO_AFFORDABLE_HOTEL',
    importanceTotal,
    recommendedHotelId: recommended?.hotelId ?? null,
    rows,
  }
}

/**
 * The place-by-place breakdown for ONE hotel, used by the detail panel and the
 * highlighted map links.
 *
 * Kept separate from rankHotels on purpose: inspecting a hotel changes only
 * what is explained on screen, never the ranking itself.
 *
 * Places come back in source order, so the breakdown always reads the same way.
 */
export function explainHotel(hotel, places) {
  const lines = places.map((place) => ({
    placeId: place.id,
    placeName: place.name,
    type: place.type,
    importance: place.importance,
    minutes: hotel.round_trip_minutes[place.id],
    contribution: contributionOf(hotel, place),
  }))

  return {
    hotelId: hotel.id,
    lines,
    weightedTravelTotal: lines.reduce((sum, line) => sum + line.contribution, 0),
  }
}

/** Convenience for the ranked list: affordable hotels in rank order. */
export const sortedByRank = (rows) =>
  rows.filter((row) => row.rank !== null).sort((a, b) => a.rank - b.rank)

/** The hotels that were excluded, kept in source order with their shortfalls. */
export const overBudget = (rows) => rows.filter((row) => !row.affordable)
