// "Why did this hotel score what it scored?" — the working, shown.
//
// One row per wishlist place, in the order the places were listed, with the
// supplied round-trip time, how much the group cares, and what those two
// multiply to. The rows add up to the travel score used for ranking, so a
// sceptical friend can follow the arithmetic from top to bottom.
//
// Inspecting a hotel changes ONLY what is explained here. It never changes the
// ranking — which is why the breakdown is computed by its own function
// (explainHotel) rather than being folded into the ranking itself.

export default function HotelDetail({ hotel, row, explanation, importanceTotal }) {
  if (!explanation || !row) {
    return (
      <section className="hotel-detail" aria-label="Selected hotel breakdown">
        <h2>Breakdown</h2>
        <p className="empty-state">
          Nothing to break down while the scenario is invalid.
        </p>
      </section>
    )
  }

  // Used only to size the little bars — presentation, never a calculation.
  const largestContribution = Math.max(...explanation.lines.map((line) => line.contribution))

  return (
    <section className="hotel-detail" aria-label="Selected hotel breakdown">
      <h2>
        {hotel.name}
        {row.recommended && <span className="recommended-badge">★ Recommended</span>}
        {!row.affordable && <span className="excluded-badge">✕ Not ranked</span>}
      </h2>

      <div className="detail-summary">
        <div className="summary-cell">
          <span className="summary-label">Whole-stay price</span>
          <span className="summary-value">{row.stayCost.toLocaleString()}</span>
          <span className="summary-note">
            {row.affordable
              ? `${row.remainingBudget.toLocaleString()} left in the budget`
              : `Over budget by ${row.shortfall.toLocaleString()}`}
          </span>
        </div>

        <div className="summary-cell">
          <span className="summary-label">Travel score</span>
          <span className="summary-value">{row.weightedTravelTotal.toLocaleString()}</span>
          <span className="summary-note">importance-minutes · lower is better</span>
        </div>

        <div className="summary-cell">
          <span className="summary-label">Weighted average</span>
          <span className="summary-value">{row.weightedAverageDisplay} min</span>
          {/* the sum spelled out, so the displayed average is never a mystery */}
          <span className="summary-note">
            {row.weightedTravelTotal.toLocaleString()} ÷ {importanceTotal} importance
          </span>
        </div>

        <div className="summary-cell">
          <span className="summary-label">Position</span>
          <span className="summary-value">{row.rank === null ? '—' : `#${row.rank}`}</span>
          <span className="summary-note">
            {row.rank === null ? 'costs more than the budget' : 'among affordable hotels'}
          </span>
        </div>
      </div>

      <table className="contribution-table">
        <caption>
          Round trip from {hotel.name} to each place, weighted by how much it matters
        </caption>
        <thead>
          <tr>
            <th scope="col">Place</th>
            <th scope="col" className="numeric">Round trip</th>
            <th scope="col" className="numeric">Matters</th>
            <th scope="col" className="numeric">Contribution</th>
            <th scope="col">Share of the score</th>
          </tr>
        </thead>
        <tbody>
          {explanation.lines.map((line) => (
            <tr key={line.placeId}>
              <th scope="row" className="place-cell">
                {line.placeName}
                <span className="type-word"> ({line.type})</span>
              </th>
              <td className="numeric">
                {line.minutes} min
                {line.minutes > 90 && (
                  // flagged in words, not just colour — the 90-minute mark is
                  // the one the group actually argues about
                  <span className="long-trip"> · long</span>
                )}
              </td>
              <td className="numeric">{line.importance}</td>
              <td className="numeric">
                <strong>{line.contribution}</strong>
              </td>
              <td>
                <span
                  className="contribution-bar"
                  style={{ width: `${(line.contribution / largestContribution) * 100}%` }}
                  aria-hidden="true"
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Travel score</th>
            <td className="numeric muted">
              {explanation.lines.reduce((sum, line) => sum + line.minutes, 0)} min raw
            </td>
            <td className="numeric muted">{importanceTotal}</td>
            <td className="numeric">
              <strong>{explanation.weightedTravelTotal.toLocaleString()}</strong>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </section>
  )
}
