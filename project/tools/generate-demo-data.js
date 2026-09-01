// Build-time tool. NOT part of the application.
//
// Run once with:  node tools/generate-demo-data.js
//
// ---------------------------------------------------------------------------
// Why this exists
// ---------------------------------------------------------------------------
// The problem statement requires a 10-hotel / 15-place city whose numbers
// satisfy six "story" conditions all at the same time. Hand-picking ~175
// numbers that happen to satisfy all six is impractical, and asking an AI to
// reason the numbers out produces plausible-looking values that quietly break
// one of the conditions — because checking condition 2 ("the single best hotel
// overall must be the one just out of budget") means comparing every hotel
// against every other hotel, which is not something to do in your head.
//
// So instead of guessing numbers, this generates random candidates and CHECKS
// all six conditions in code, throwing away anything that fails and retrying
// until one passes. The check is the valuable part; the randomness is just how
// candidates get proposed.
//
// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------
// * The app never runs this and never randomises anything. The winning output
//   was pasted into src/data/demoCity.js as fixed constants, so the same city
//   materialises on every load and every reset.
// * Only IDs and numbers come out of here. The fictional display names were
//   mapped onto those IDs afterwards, so renaming could never disturb a
//   verified number.
// * This script checking its own output is NOT the independent verification
//   the spec asks for. That is done separately in tests/demoCity.test.js,
//   which re-derives every expected value with its own arithmetic and compares
//   against a recorded oracle table.
//
// ---------------------------------------------------------------------------
// What actually happened when this was run
// ---------------------------------------------------------------------------
// First attempt used wider ranges — stay costs 2000-9000, travel times 5-180 —
// and found nothing in 200,000 tries. The reason: condition 6 needs one
// place's importance change to flip the winner, and a single place can only
// shift a hotel's total by at most (5-1) x its travel time. With times up to
// 180 the totals were spread far too widely for one place to ever bridge the
// gap between the top two hotels.
//
// Narrowing to costs 3000-7000 and times 10-140 tightened the spread and made
// near-ties common. It then found a valid dataset in 5,754 attempts, 0.1s.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const NUM_HOTELS = 10
const NUM_PLACES = 15

const HOTEL_IDS = Array.from({ length: NUM_HOTELS }, (_, i) => `HOTEL_${String.fromCharCode(65 + i)}`)
const PLACE_IDS = Array.from({ length: NUM_PLACES }, (_, i) => `PLACE_${String.fromCharCode(65 + i)}`)

// Type does not affect any calculation, so it is assigned rather than searched.
// Alternating gives 8 attractions and 7 food stops — comfortably past the
// "at least three of each" requirement.
const PLACE_TYPES = PLACE_IDS.map((_, i) => (i % 2 === 0 ? 'attraction' : 'food'))

function weightedTravelTotal(row, importances) {
  let total = 0
  for (let p = 0; p < NUM_PLACES; p++) total += importances[p] * row[p]
  return total
}

/**
 * Check one candidate against all six conditions.
 * Returns the winning details, or null if the candidate fails any of them.
 */
function evaluate(stayCosts, matrix, importances) {
  const totals = stayCosts.map((_, h) => weightedTravelTotal(matrix[h], importances))

  // --- condition 2, part 1: the best hotel overall must be UNIQUELY best ----
  let bestIdx = 0
  for (let h = 1; h < NUM_HOTELS; h++) if (totals[h] < totals[bestIdx]) bestIdx = h
  if (totals.filter((t) => t === totals[bestIdx]).length !== 1) return null

  // The budget has to sit below the best hotel's price, otherwise it would be
  // affordable and condition 2 fails. Trying each cheaper hotel's price as the
  // budget also guarantees the budget lands exactly on some hotel's cost,
  // which conveniently demonstrates the "equal to budget is affordable" rule.
  const candidateBudgets = [...new Set(stayCosts.filter((c) => c < stayCosts[bestIdx]))].sort((a, b) => b - a)

  for (const budget of candidateBudgets) {
    const affordableIdx = []
    for (let h = 0; h < NUM_HOTELS; h++) if (stayCosts[h] <= budget) affordableIdx.push(h)

    // --- condition 1: 4 to 7 hotels affordable -----------------------------
    if (affordableIdx.length < 4 || affordableIdx.length > 7) continue

    // --- condition 2, part 2: the best hotel is NOT affordable -------------
    if (affordableIdx.includes(bestIdx)) continue

    let recIdx = affordableIdx[0]
    for (const h of affordableIdx) if (totals[h] < totals[recIdx]) recIdx = h
    let cheapIdx = affordableIdx[0]
    for (const h of affordableIdx) if (stayCosts[h] < stayCosts[cheapIdx]) cheapIdx = h

    // --- condition 3: the winner is not simply the cheapest one ------------
    if (recIdx === cheapIdx) continue

    // --- condition 4: affordable hotels on both sides of 90 minutes --------
    const maxTrip = (h) => Math.max(...matrix[h])
    if (!affordableIdx.some((h) => maxTrip(h) <= 90)) continue
    if (!affordableIdx.some((h) => maxTrip(h) > 90)) continue

    // --- condition 6: one importance change (1-5) flips the winner ---------
    let flip = null
    for (let p = 0; p < NUM_PLACES && !flip; p++) {
      for (let v = 1; v <= 5 && !flip; v++) {
        if (v === importances[p]) continue
        const alt = importances.slice()
        alt[p] = v
        const altTotals = stayCosts.map((_, h) => weightedTravelTotal(matrix[h], alt))
        let altRec = affordableIdx[0]
        for (const h of affordableIdx) if (altTotals[h] < altTotals[altRec]) altRec = h
        if (altRec !== recIdx) flip = { placeIdx: p, newImportance: v, newRecommended: altRec }
      }
    }
    if (!flip) continue

    // --- condition 5 holds by construction ---------------------------------
    // bestIdx is the unique lowest total, so the moment the budget reaches its
    // price it becomes affordable and therefore rank 1. Nothing to check.

    return { bestIdx, budget, affordableIdx, recIdx, cheapIdx, totals, flip }
  }

  return null
}

function attempt() {
  const stayCosts = HOTEL_IDS.map(() => randInt(3000, 7000))
  const matrix = HOTEL_IDS.map(() => PLACE_IDS.map(() => randInt(10, 140)))

  // at least 3 distinct importance values is a hard requirement
  let importances
  do {
    importances = PLACE_IDS.map(() => randInt(1, 5))
  } while (new Set(importances).size < 3)

  const result = evaluate(stayCosts, matrix, importances)
  return result ? { stayCosts, matrix, importances, result } : null
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

let found = null
let tries = 0
const MAX_TRIES = 2_000_000
const startedAt = Date.now()

while (!found && tries < MAX_TRIES) {
  tries++
  found = attempt()
}

if (!found) {
  console.log(`No valid dataset after ${tries} tries.`)
  console.log('Narrow the value ranges in attempt() and run again — a tighter')
  console.log('spread of travel times makes the condition-6 flip far more likely.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const { stayCosts, matrix, importances, result } = found
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)

console.log(`Found a valid dataset after ${tries.toLocaleString()} attempts (${elapsed}s).\n`)

console.log('--- Places ---')
PLACE_IDS.forEach((id, i) => console.log(`${id}: type=${PLACE_TYPES[i]}, importance=${importances[i]}`))

console.log('\n--- Hotels ---')
HOTEL_IDS.forEach((id, h) =>
  console.log(`${id}: stay_cost=${stayCosts[h]}, weighted_travel_total=${result.totals[h]}`),
)

console.log('\n--- Story conditions this dataset satisfies ---')
console.log(`1. affordable at the initial budget: ${result.affordableIdx.length} hotels`)
console.log(`2. uniquely most accessible: ${HOTEL_IDS[result.bestIdx]} — over budget by ${stayCosts[result.bestIdx] - result.budget}`)
console.log(`3. recommended ${HOTEL_IDS[result.recIdx]} is not the cheapest affordable (${HOTEL_IDS[result.cheapIdx]})`)
console.log(`4. longest trips straddle the 90-minute line among affordable hotels`)
console.log(`5. raising the budget to ${stayCosts[result.bestIdx]} makes ${HOTEL_IDS[result.bestIdx]} the recommendation`)
console.log(`6. ${PLACE_IDS[result.flip.placeIdx]} importance ${importances[result.flip.placeIdx]} -> ${result.flip.newImportance} flips the winner to ${HOTEL_IDS[result.flip.newRecommended]}`)
console.log(`\nInitial budget: ${result.budget}`)

console.log('\n--- round_trip_minutes matrix (JSON) ---')
const matrixObject = {}
HOTEL_IDS.forEach((id, h) => {
  matrixObject[id] = {}
  PLACE_IDS.forEach((placeId, p) => {
    matrixObject[id][placeId] = matrix[h][p]
  })
})
console.log(JSON.stringify(matrixObject, null, 2))
