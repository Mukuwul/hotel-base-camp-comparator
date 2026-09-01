// The two things the user can change: the budget, and how much each place
// matters to the group. Plus Reset.
//
// There is no Submit button anywhere here, on purpose. Every keystroke calls
// straight back up to App, which recomputes and redraws immediately. That
// removes a whole category of bug — a screen showing results that no longer
// match the numbers in the boxes.
//
// Nothing is validated in this file. A value of 9, or an empty box, is passed
// upward exactly as typed so the engine can reject it and the user can see the
// reason. Silently fixing input here would hide mistakes.

const TYPE_MARKS = {
  attraction: { symbol: '◆', label: 'attraction' },
  food: { symbol: '●', label: 'food' },
}

export default function Controls({
  budgetText,
  onBudgetChange,
  places,
  importanceText,
  onImportanceChange,
  onReset,
}) {
  // What the box should show: the user's typed text if they have touched this
  // place, otherwise the value from the city data.
  const valueFor = (place) =>
    Object.hasOwn(importanceText, place.id) ? importanceText[place.id] : String(place.importance)

  // A place counts as edited only if the text actually differs from the
  // original — typing 4 over a 4 is not a change.
  const isEdited = (place) =>
    Object.hasOwn(importanceText, place.id) &&
    String(importanceText[place.id]).trim() !== String(place.importance)

  const editedCount = places.filter(isEdited).length

  return (
    <section className="controls" aria-label="Trip settings">
      <div className="controls-row">
        <label className="budget-field">
          <span className="field-label">Budget for the whole stay</span>
          <input
            className="budget-input"
            type="number"
            min="0"
            max="1000000"
            value={budgetText}
            onChange={(event) => onBudgetChange(event.target.value)}
            aria-describedby="budget-hint"
          />
        </label>
        <p id="budget-hint" className="field-hint">
          A hotel is affordable when its price is at or below this. Changes apply as you type.
        </p>

        <button type="button" className="reset-button" onClick={onReset}>
          Reset trip
        </button>
      </div>

      <details className="importance-panel" open>
        <summary>
          How much each place matters (1–5)
          {editedCount > 0 && <span className="edited-badge"> · {editedCount} changed</span>}
        </summary>

        <ul className="importance-grid">
          {places.map((place) => {
            const mark = TYPE_MARKS[place.type] ?? { symbol: '?', label: place.type }
            return (
              <li key={place.id} className={isEdited(place) ? 'importance-item edited' : 'importance-item'}>
                <label>
                  <span className="place-name">
                    {/* symbol AND word, so the type never depends on colour alone */}
                    <span className="type-mark" aria-hidden="true">
                      {mark.symbol}
                    </span>
                    {place.name}
                    <span className="type-word"> ({mark.label})</span>
                  </span>
                  <input
                    className="importance-input"
                    type="number"
                    min="1"
                    max="5"
                    value={valueFor(place)}
                    onChange={(event) => onImportanceChange(place.id, event.target.value)}
                  />
                </label>
                {isEdited(place) && (
                  <span className="was-value">was {place.importance}</span>
                )}
              </li>
            )
          })}
        </ul>
      </details>
    </section>
  )
}
