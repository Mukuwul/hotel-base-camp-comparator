// The single entry point the screen talks to.
//
// App.jsx holds three pieces of state (budget, importanceOverrides,
// selectedHotelId) and calls this on every render. Everything shown on screen
// comes out of the one object returned here — no component keeps its own copy
// of a ranking, so nothing can ever drift out of sync.
//
// The order is always the same: apply the user's importance edits, validate
// the whole scenario, and only rank if validation passed. A scenario that
// fails validation produces NO ranking at all — not a partial one — which is
// exactly what the spec requires.

import { validateScenario } from './validate.js'
import { rankHotels } from './ranking.js'

/**
 * Lay the user's importance edits over the original places.
 *
 * Values are copied across exactly as the user typed them, with no cleaning up
 * or coercion. That is deliberate: if someone types an importance of 9, it has
 * to reach validateScenario() and be rejected on screen. Quietly clamping it
 * to 5 here would hide a mistake the user needs to see.
 *
 * The original places array is never modified — a new array is built instead,
 * so Reset can always fall back to the untouched original.
 */
export function applyImportanceOverrides(places, overrides = {}) {
  const ids = Object.keys(overrides ?? {})
  if (ids.length === 0) return places

  return places.map((place) =>
    Object.hasOwn(overrides, place.id) ? { ...place, importance: overrides[place.id] } : place,
  )
}

/**
 * Work out everything the screen needs, from scratch, for the current budget
 * and importance edits.
 *
 * scenario           - { hotels, places } exactly as loaded, never modified
 * budget             - the current budget from the input box
 * importanceOverrides- { placeId: importance } for places the user has edited
 *
 * Returns one of two shapes, never both:
 *
 *   { ok: true,  error: null,   ranking, places }
 *   { ok: false, error: {...},  ranking: null, places }
 *
 * `places` comes back either way so the map can keep drawing its markers even
 * while an error is on screen. `ranking` being null is what clears the ranked
 * list, the recommendation and the highlighted links — the components read
 * from it, so when it is null they have nothing to draw and stale results
 * cannot survive.
 *
 * Reset is simply calling this again with the original budget and no
 * overrides; there is no separate reset path to keep in step.
 */
export function computeComparison(scenario, budget, importanceOverrides = {}) {
  const places = applyImportanceOverrides(scenario.places, importanceOverrides)

  const validation = validateScenario({ hotels: scenario.hotels, places, budget })
  if (!validation.ok) {
    return { ok: false, error: validation, ranking: null, places }
  }

  return {
    ok: true,
    error: null,
    ranking: rankHotels({ hotels: scenario.hotels, places, budget }),
    places,
  }
}
