// The whole application state lives here, and it is deliberately small:
// three values, all held with plain useState.
//
//   budgetText       - exactly what is typed in the budget box
//   importanceText   - exactly what is typed in each importance box
//   selectedHotelId  - which hotel is currently being inspected
//
// Nothing else is stored. The ranking, the recommendation, the highlighted
// links and the breakdown are all worked out fresh on every render by calling
// computeComparison(). Because there is only one source of truth, no part of
// the screen can ever show a stale result.
//
// This file contains no comparison maths of its own. Its job is to hold state,
// hand it to the engine, and pass the answer down to the components.

import { useState } from 'react'
import { HOTELS, PLACES, INITIAL_BUDGET } from '../data/demoCity.js'
import { computeComparison } from '../engine/computeComparison.js'
import { explainHotel } from '../engine/ranking.js'
import Controls from './Controls.jsx'
import CityMap from './CityMap.jsx'
import RankedList from './RankedList.jsx'
import HotelDetail from './HotelDetail.jsx'

// The city as loaded. Never modified — Reset falls back to this.
const SCENARIO = { hotels: HOTELS, places: PLACES }
const DEFAULT_HOTEL_ID = HOTELS[0].id

/**
 * Turn what someone typed into a value for the engine.
 *
 * Text boxes always hand back strings. A string of digits becomes a real
 * number; anything else — an empty box, "abc", "12abc" — is passed through
 * unchanged so the validator rejects it and the user sees why.
 *
 * This is input handling, not comparison logic: it decides what the typed
 * characters mean, never what the answer is.
 */
const toNumberOrRaw = (text) => {
  const trimmed = String(text).trim()
  if (trimmed === '') return trimmed
  const asNumber = Number(trimmed)
  return Number.isNaN(asNumber) ? trimmed : asNumber
}

export default function App() {
  const [budgetText, setBudgetText] = useState(String(INITIAL_BUDGET))
  const [importanceText, setImportanceText] = useState({})
  const [selectedHotelId, setSelectedHotelId] = useState(DEFAULT_HOTEL_ID)

  // --- everything below is derived, never stored -----------------------------

  const budget = toNumberOrRaw(budgetText)
  const importanceOverrides = Object.fromEntries(
    Object.entries(importanceText).map(([placeId, text]) => [placeId, toNumberOrRaw(text)]),
  )

  const result = computeComparison(SCENARIO, budget, importanceOverrides)

  const selectedHotel = HOTELS.find((hotel) => hotel.id === selectedHotelId)
  // Only explain a hotel when the scenario is valid — there is nothing
  // meaningful to break down while the data is being rejected.
  const explanation = result.ok ? explainHotel(selectedHotel, result.places) : null
  const selectedRow = result.ranking?.rows.find((row) => row.hotelId === selectedHotelId) ?? null

  // --- handlers --------------------------------------------------------------

  const handleImportanceChange = (placeId, text) => {
    setImportanceText((previous) => ({ ...previous, [placeId]: text }))
  }

  // Reset is three setState calls and nothing more. Because no derived value is
  // stored anywhere, putting the inputs back to their starting values is enough
  // to restore the entire screen.
  const handleReset = () => {
    setBudgetText(String(INITIAL_BUDGET))
    setImportanceText({})
    setSelectedHotelId(DEFAULT_HOTEL_ID)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hotel Base-Camp Comparator</h1>
        <p className="subtitle">
          Calderra city trip · {HOTELS.length} hotels · {PLACES.length} wishlist places
        </p>
      </header>

      <Controls
        budgetText={budgetText}
        onBudgetChange={setBudgetText}
        places={SCENARIO.places}
        importanceText={importanceText}
        onImportanceChange={handleImportanceChange}
        onReset={handleReset}
      />

      {!result.ok && (
        <div className="error-banner" role="alert">
          <span className="error-mark" aria-hidden="true">
            !
          </span>
          <span>
            <strong>{result.error.code}</strong> — {result.error.message}
            <br />
            <span className="error-note">
              No ranking is shown while the scenario is invalid. Fix the value above to continue.
            </span>
          </span>
        </div>
      )}

      <div className="workspace">
        <CityMap
          places={result.places}
          hotels={SCENARIO.hotels}
          ranking={result.ranking}
          selectedHotelId={selectedHotelId}
          onSelectHotel={setSelectedHotelId}
        />

        <RankedList
          ranking={result.ranking}
          selectedHotelId={selectedHotelId}
          onSelectHotel={setSelectedHotelId}
        />
      </div>

      <HotelDetail
        hotel={selectedHotel}
        row={selectedRow}
        explanation={explanation}
        importanceTotal={result.ranking?.importanceTotal ?? null}
      />
    </div>
  )
}
