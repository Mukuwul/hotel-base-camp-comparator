// The answer: affordable hotels in order, and the ones that were left out.
//
// Two rules from the spec shape this whole component:
//
//   1. An over-budget hotel is never hidden. It stays on screen with a plain
//      reason ("Over budget by 701") and no rank number, so the group can see
//      what they are missing rather than wondering where a hotel went.
//   2. "No hotel is affordable" is a legitimate answer, not an error. It gets
//      its own clear message, and crucially no leftover winner from before.
//
// Everything shown here comes from the ranking object handed down by App. This
// component stores nothing and calculates nothing.

import { sortedByRank, overBudget } from '../engine/ranking.js'

export default function RankedList({ ranking, selectedHotelId, onSelectHotel }) {
  // ranking is null while the scenario is invalid. Showing nothing here is
  // what clears a stale result — there is no separate "wipe the list" step.
  if (!ranking) {
    return (
      <section className="ranked-list" aria-label="Hotel ranking">
        <h2>Ranking</h2>
        <p className="empty-state">
          No ranking to show. Fix the highlighted problem above and it will come back.
        </p>
      </section>
    )
  }

  const ranked = sortedByRank(ranking.rows)
  const excluded = overBudget(ranking.rows)
  const noneAffordable = ranking.status === 'NO_AFFORDABLE_HOTEL'

  return (
    <section className="ranked-list" aria-label="Hotel ranking">
      <h2>
        Ranking
        <span className="section-note"> · lower travel score is better</span>
      </h2>

      {noneAffordable ? (
        <p className="no-affordable" role="status">
          <strong>NO_AFFORDABLE_HOTEL</strong>
          <br />
          Nothing fits this budget, so there is no recommendation. Every hotel below shows how
          much short you are.
        </p>
      ) : (
        <ol className="hotel-rows">
          {ranked.map((row) => (
            <li key={row.hotelId}>
              <button
                type="button"
                className={[
                  'hotel-row',
                  row.recommended ? 'recommended' : '',
                  row.hotelId === selectedHotelId ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectHotel(row.hotelId)}
                aria-pressed={row.hotelId === selectedHotelId}
              >
                <span className="rank-number" aria-label={`Rank ${row.rank}`}>
                  {row.rank}
                </span>

                <span className="hotel-main">
                  <span className="hotel-name">
                    {row.name}
                    {/* star AND the word, so the winner never reads as colour alone */}
                    {row.recommended && (
                      <span className="recommended-badge">★ Recommended</span>
                    )}
                  </span>
                  <span className="hotel-numbers">
                    travel score <strong>{row.weightedTravelTotal}</strong>
                    <span className="muted"> · avg {row.weightedAverageDisplay} min</span>
                  </span>
                </span>

                <span className="hotel-cost">
                  <span className="cost-value">{row.stayCost.toLocaleString()}</span>
                  <span className="muted">{row.remainingBudget.toLocaleString()} left</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {excluded.length > 0 && (
        <div className="excluded-block">
          <h3>
            Not ranked
            <span className="section-note"> · {excluded.length} over budget</span>
          </h3>
          <ul className="hotel-rows">
            {excluded.map((row) => (
              <li key={row.hotelId}>
                <button
                  type="button"
                  className={[
                    'hotel-row',
                    'excluded',
                    row.hotelId === selectedHotelId ? 'selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelectHotel(row.hotelId)}
                  aria-pressed={row.hotelId === selectedHotelId}
                >
                  {/* a dash where the rank would be, so the column still lines up */}
                  <span className="rank-number excluded-mark" aria-hidden="true">
                    —
                  </span>

                  <span className="hotel-main">
                    <span className="hotel-name">{row.name}</span>
                    <span className="hotel-numbers">
                      travel score <strong>{row.weightedTravelTotal}</strong>
                      <span className="muted"> · avg {row.weightedAverageDisplay} min</span>
                    </span>
                  </span>

                  <span className="hotel-cost">
                    <span className="cost-value">{row.stayCost.toLocaleString()}</span>
                    <span className="shortfall">
                      Over budget by {row.shortfall.toLocaleString()}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
