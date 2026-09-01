# Implementation Plan — Hotel Base-Camp Comparator

Five ordered stages. Each one only starts once the previous stage's checkpoint is actually met — not just "written," but verified.

## Stage 1 — Data + Validation

**Do:** Turn the already-generated, already-verified dataset (10 hotels, 15 places, the 150-cell travel-time matrix, starting budget, importances — currently kept aside) into `src/data/demoCity.js` by layering fictional hotel/place names onto the existing IDs and numbers, without touching any number. Write `src/engine/validate.js`: unique IDs matching the required pattern, non-empty names, place `type` in `{attraction, food}`, importance `1–5`, `stay_cost` and travel times in range, a complete hotel→place time mapping with no missing or unknown place IDs, budget in range.

**Depends on:** nothing — this is the starting point.

**Checkpoint:** a small test file with (a) the full main scenario passing validation cleanly, and (b) at least two different broken scenarios each rejected with the correct identified field — e.g. a duplicate hotel ID, and a hotel missing one place's travel time.

## Stage 2 — Ranking Engine + Independent Verification

**Do:** Write `src/engine/ranking.js`: `contribution(hotel, place)`, `weightedTravelTotal(hotel)`, `weightedAverageMinutes` (display-only, round-half-up), affordability check, the three-level tie-break sort (total → cost → ID), rank assignment, and the `NO_AFFORDABLE_HOTEL` case.

**Depends on:** Stage 1's validated data shape — this engine assumes its input already passed validation.

**Checkpoint:** two-part proof, not one — (a) a test reproducing the spec's own tiny worked example exactly (`CLOCK`/`MARKET`, totals `140`/`21.5`... the mint/coral-style numbers from the problem statement) to prove the formula is implemented correctly in isolation; (b) hand- or spreadsheet-verify at least 3 hotels from the real 10-hotel dataset independently, and assert the engine's output matches before trusting the rest of the dataset's documented story conditions.

## Stage 3 — State Layer (plain useState in App.jsx, no submit button)

**Do:** Write `src/engine/computeComparison.js` — a plain function composing `validate` then `rank`, taking `(originalScenario, budget, importanceOverrides)` and returning `{ ranking }` or `{ error }`. State itself (`budget`, `importanceOverrides`, `selectedHotelId`, plus the untouched `originalScenario` for Reset) lives directly in `App.jsx` via plain `useState` — no custom hook, since there's only one consumer of this state. Every render calls `computeComparison(...)` fresh (live recompute, no submit button).

**Depends on:** Stage 2's engine functions being correct and already tested — `computeComparison` just composes them, it doesn't add new calculation logic.

**Checkpoint:** before writing any visible UI, test `computeComparison` directly with plain function calls — change the `budget` argument, confirm ranking updates; change one importance override, confirm it updates; call it with the original values again, confirm it matches the documented starting state.

## Stage 4 — UI Layer

**Do:** Build `CityMap.jsx` (SVG, all 25 markers, highlight only the selected hotel's 15 links), `RankedList.jsx` (ranks, Recommended label, "Over budget by X" for excluded hotels), `HotelDetail.jsx` (per-place breakdown for the selected hotel), `Controls.jsx` (budget input + per-place importance inputs), all reading from the Stage 3 state in `App.jsx`.

**Depends on:** Stage 3's `computeComparison` already proven correct — the UI is a pure rendering layer on top of it.

**Checkpoint:** run the app in a browser and manually walk the whole documented story end to end — load the city, see the initial ranking, click a hotel and see its 15 highlighted links with correct numbers, raise the budget across the documented boundary and see the recommendation change, change the documented place's importance and see the second recommendation flip, hit Reset and confirm everything returns exactly to the start.

## Stage 5 — Full Test Sweep + Live-Modification Rehearsal

**Do:** Fill out the remaining required tests (both tie-breaks, budget-equality edge case, `NO_AFFORDABLE_HOTEL`, each validation category, edit-then-reset), write the running instructions, and rehearse two or three plausible live-modification requests end to end with the AI assistant.

**Depends on:** Stages 1–4 all complete and individually checkpointed — this stage is verification and rehearsal, not new features.

**Checkpoint:** the full test suite passes from a clean install; a cold `npm run dev` reaches a working demo in well under a minute; each rehearsed live modification is completed within the 10-minute budget the interview allows.

---

*Changes from this plan, if any occur while building, get recorded in `POINTS_TO_REMEMBER.md` — what changed, why, and whether it affects any goal.*
