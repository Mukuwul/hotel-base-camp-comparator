# Architecture & Tech Stack — Hotel Base-Camp Comparator

## Tech stack, with the reasoning behind each choice

| Choice | Why |
|---|---|
| **Vite** | Instant dev server, near-zero config, `npm run dev` to a working app in seconds — matters directly for the "quick startup" and live-modification requirements. |
| **React 19, plain JavaScript (no TypeScript)** | Several visible pieces (map, ranked list, detail panel, controls) must all stay in sync with the same few numbers changing — React's re-render-on-state-change model is exactly that. TypeScript is deliberately skipped: its setup and type-authoring cost isn't repaid in a 6–8 hour build; correctness instead comes from `validate.js` plus tests, not from static types. |
| **Plain CSS, no UI kit** | Nothing here needs a design system. Tailwind/MUI/etc. would be one more thing to configure and explain for no functional benefit. |
| **Inline SVG, no map/charting library** | Hotels and places are circles, comparison links are lines — native SVG does this directly. A mapping or charting library would be solving a problem this app doesn't have. |
| **Vitest** | Ships with Vite, Jest-like API most people already know, zero extra config. |
| **No state-management library** (Redux/Zustand/etc.) | The entire app's state is three `useState` values in `App.jsx`. Adding a state library here is exactly the "unnecessary layers for the given scope" the Student Guide warns against. |
| **No backend, no database** | The problem statement itself excludes these. Everything runs locally in the browser from a fixed in-memory dataset. |

## Folder structure

```
src/
  engine/
    validate.js         → validateScenario(hotels, places, budget) → { ok } | { ok:false, code, detail }
    ranking.js           → contribution, weightedTravelTotal, weightedAverageMinutes, rank(...)
                            pure functions only — no React, no DOM, fully unit-testable in isolation
    computeComparison.js  → composes validate + rank into one call: (scenario, budget, importanceOverrides) → { ranking } | { error }
                            also a plain function — this is what makes the state layer below trivial and testable
  data/
    demoCity.js          → the fixed 10 hotels / 15 places / travel-time matrix / starting budget & importances
  ui/
    App.jsx              → owns state directly via plain useState (budget, importanceOverrides, selectedHotelId,
                            plus the untouched original scenario for Reset); calls computeComparison() each render
    CityMap.jsx           → SVG, 25 markers, highlights only the selected hotel's 15 links
    RankedList.jsx         → ranked affordable hotels + "Over budget by X" for excluded ones
    HotelDetail.jsx         → per-place breakdown for the selected hotel
    Controls.jsx             → budget input + per-place importance inputs
tests/
  validate.test.js       → validation rules, one test per rejection category
  ranking.test.js         → spec's own worked example, tie-breaks, rounding, the real dataset
  computeComparison.test.js → budget change, importance change, invalid-input handling — plain function calls, no rendering
```

## The one architectural rule everything else follows

**`engine/` never imports React. `App.jsx` never contains calculation logic — only `useState` and JSX.** `computeComparison()` is the only bridge between them, called directly, every render. This is what makes:
- **Reset** trivial — restore the state values from `originalScenario`, nothing else to unwind.
- **Live edits safe** — changing budget or an importance value just changes state; the same `computeComparison()` call runs every time, so there's no separate "edit mode" logic to get wrong.
- **The live-modification interview requirement low-risk** — a plausible request ("also show each hotel's cheapest trip," "sort by X instead") almost always lands entirely inside `engine/`, never needing to touch `App.jsx` at all.
- **Testing boundaries obvious** — all of `engine/`, including `computeComparison`, is tested with plain function calls and no rendering; `App.jsx` itself is thin enough that it barely needs its own tests.

## Data flow, in one line

State lives directly in `App.jsx` (`budget`, `importanceOverrides`, `selectedHotelId`, plus the untouched `originalScenario`) → every render calls `computeComparison(originalScenario, budget, importanceOverrides)` fresh → every component renders only from that result, never from its own stored copy. No submit button; live recompute.

## Alternatives considered and rejected

- **A custom `useComparator` hook wrapping the state** — considered and dropped. The only justification for extracting a hook is reuse across multiple components, and there's exactly one consumer (`App.jsx`) here. Without a reuse case, the hook was an extra file and an extra concept for no real benefit — the isolated-testability it offered comes just as well from `computeComparison()` being a plain function, without needing the state itself to move anywhere. Kept: state as plain `useState` directly in `App.jsx`, matching what's simplest to read and explain.
- **A charting/graphing library for the map** — rejected; 25 static circles and up to 15 lines don't need one.
- **React Router** — rejected; this is one screen, no navigation.
- **Class components** — rejected; hooks (the built-in ones, `useState`) are the modern, more familiar default for anyone learning React today.
- **Storing `ranking` as its own state, updated via a `useEffect`** — rejected; deriving it fresh every render is simpler, has no sync-timing bugs, and is cheap enough at this data size (150 cells) that memoizing isn't even necessary.

## Why this fits the Student Guide specifically

- **Simplicity:** no framework beyond React itself, no libraries doing work the app doesn't need.
- **Familiarity:** every technology here (React, plain CSS, SVG, Vitest) is mainstream and well-documented — nothing exotic to debug alone during the interview.
- **Fits one day:** the whole stack is "install once, run forever" — no backend to stand up, no database to seed, no build pipeline beyond what Vite gives for free.
- **Explainable under pressure:** the engine/UI split means any question ("why does this number change," "where would X go") has a one-sentence answer pointing at one file.

*(Note: this covers the "Design before coding" step. The separate "Design Summary" deliverable — AI influence and trade-offs written up for the interview itself — can build directly on this file rather than redoing the analysis.)*

---

## How the demonstration data was created (the generator script)

The problem statement requires a 10-hotel / 15-place city whose numbers simultaneously satisfy six "story" conditions. Hand-picking ~175 numbers that all hold at once is impractical, and asking an AI to *reason out* the numbers is unreliable — it produces plausible-looking values that quietly break one condition.

**Approach taken instead:** a throwaway Node script that brute-force searches. It generates random stay costs, importances, and a 10×15 travel-time matrix, then checks all six conditions *in code*, discarding any candidate that fails and retrying until one passes.

The six conditions it verifies programmatically:

1. 4–7 hotels affordable at the initial budget
2. the unique lowest-accessibility-total hotel is over budget
3. the recommended affordable hotel is not the cheapest affordable hotel
4. at least one affordable hotel with every round trip ≤ 90 min, and another with at least one > 90 min
5. raising the budget to the best hotel's stay cost makes it the recommendation
6. one place whose importance, changed within 1–5, flips the recommended affordable hotel

**Result:** found a fully valid dataset in **5,754 attempts / 0.1 seconds**. Search ranges that worked: stay costs `3000–7000`, travel times `10–140` minutes, importances `1–5` with at least 3 distinct values. (An initial run with wider ranges — costs `2000–9000`, times `5–180` — failed after 200,000 attempts; narrowing the spread was what made solutions common enough to find. Worth mentioning as a debugging example for the interview.)

```javascript
// tools/generate-demo-data.js — run once with `node tools/generate-demo-data.js`
// NOT part of the app; a build-time tool whose output is pasted into src/data/demoCity.js

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const NUM_HOTELS = 10, NUM_PLACES = 15;
const HOTEL_IDS = Array.from({ length: NUM_HOTELS }, (_, i) => `HOTEL_${String.fromCharCode(65 + i)}`);
const PLACE_IDS = Array.from({ length: NUM_PLACES }, (_, i) => `PLACE_${String.fromCharCode(65 + i)}`);
const PLACE_TYPES = PLACE_IDS.map((_, i) => (i % 2 === 0 ? 'attraction' : 'food'));

function weightedTravelTotal(row, importances) {
  let total = 0;
  for (let p = 0; p < NUM_PLACES; p++) total += importances[p] * row[p];
  return total;
}

function evaluate(stayCosts, matrix, importances) {
  const totals = stayCosts.map((_, h) => weightedTravelTotal(matrix[h], importances));

  // condition 2 (part 1): the global best must be unique
  let bestIdx = 0;
  for (let h = 1; h < NUM_HOTELS; h++) if (totals[h] < totals[bestIdx]) bestIdx = h;
  if (totals.filter((t) => t === totals[bestIdx]).length !== 1) return null;

  const candidateBudgets = [...new Set(stayCosts.filter((c) => c < stayCosts[bestIdx]))].sort((a, b) => b - a);
  for (const budget of candidateBudgets) {
    const affordableIdx = [];
    for (let h = 0; h < NUM_HOTELS; h++) if (stayCosts[h] <= budget) affordableIdx.push(h);

    if (affordableIdx.length < 4 || affordableIdx.length > 7) continue;   // condition 1
    if (affordableIdx.includes(bestIdx)) continue;                        // condition 2 (part 2)

    let recIdx = affordableIdx[0];
    for (const h of affordableIdx) if (totals[h] < totals[recIdx]) recIdx = h;
    let cheapIdx = affordableIdx[0];
    for (const h of affordableIdx) if (stayCosts[h] < stayCosts[cheapIdx]) cheapIdx = h;
    if (recIdx === cheapIdx) continue;                                    // condition 3

    const maxTrip = (h) => Math.max(...matrix[h]);
    if (!affordableIdx.some((h) => maxTrip(h) <= 90)) continue;           // condition 4a
    if (!affordableIdx.some((h) => maxTrip(h) > 90)) continue;            // condition 4b

    // condition 6: find a place whose importance change flips the recommendation
    let flip = null;
    for (let p = 0; p < NUM_PLACES && !flip; p++) {
      for (let v = 1; v <= 5 && !flip; v++) {
        if (v === importances[p]) continue;
        const alt = importances.slice(); alt[p] = v;
        const altTotals = stayCosts.map((_, h) => weightedTravelTotal(matrix[h], alt));
        let altRec = affordableIdx[0];
        for (const h of affordableIdx) if (altTotals[h] < altTotals[altRec]) altRec = h;
        if (altRec !== recIdx) flip = { placeIdx: p, newImportance: v, newRecommended: altRec };
      }
    }
    if (!flip) continue;

    // condition 5 holds by construction: bestIdx is the unique global best,
    // so raising the budget to stayCosts[bestIdx] necessarily makes it rank 1.
    return { bestIdx, budget, affordableIdx, recIdx, cheapIdx, totals, flip };
  }
  return null;
}

function attempt() {
  const stayCosts = HOTEL_IDS.map(() => randInt(3000, 7000));
  const matrix = HOTEL_IDS.map(() => PLACE_IDS.map(() => randInt(10, 140)));
  let importances;
  do { importances = PLACE_IDS.map(() => randInt(1, 5)); } while (new Set(importances).size < 3);

  const result = evaluate(stayCosts, matrix, importances);
  return result ? { stayCosts, matrix, importances, result } : null;
}

let found = null, tries = 0;
while (!found && tries < 2000000) { tries++; found = attempt(); }
if (!found) { console.log(`No solution after ${tries} tries. Narrow the value ranges and retry.`); process.exit(1); }

// ...prints the winning hotels, places, matrix, budget, and the documented story outcomes
```

### Important boundaries on this script

- **It is a build-time tool, not application code.** It lives in `tools/`, runs once, and its output is pasted into `src/data/demoCity.js` as fixed constants. The app itself never randomizes anything — the same dataset materializes on every load and every reset, as the spec demands.
- **Numbers first, names second.** The script only produces IDs and numbers. Fictional city/hotel/place display names are mapped onto those IDs *afterwards*, so renaming can never accidentally disturb a verified number.
- **Its self-check is not the required independent verification.** The script checks its own output, which is circular. The spec requires verifying results "through a separate calculation path" — so a handful of hotels' weighted totals still get confirmed by hand/spreadsheet before the dataset is documented as the expected answer.
