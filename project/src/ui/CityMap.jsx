// The schematic city: all 10 hotels and all 15 places, always visible.
//
// The single most important thing about this file: the x/y coordinates are
// DECORATION. They decide where a dot is drawn and nothing else. Every travel
// time comes from the data, never from measuring a line — a hotel drawn right
// next to a place can still be an hour away from it. The spec is explicit that
// pixel distance must never influence a result, and keeping every calculation
// out of this file is how that is guaranteed rather than merely intended.
//
// Only the inspected hotel's 15 links are drawn. Showing all ten hotels' links
// at once would be 150 lines and unreadable.

const WIDTH = 1000
const HEIGHT = 640
const PAD = 46

// The data uses a 0-100 space; these stretch it across the drawing area.
const sx = (x) => PAD + (x / 100) * (WIDTH - PAD * 2)
const sy = (y) => PAD + (y / 100) * (HEIGHT - PAD * 2)

export default function CityMap({ places, hotels, ranking, selectedHotelId, onSelectHotel }) {
  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId)
  const rowFor = (hotelId) => ranking?.rows.find((row) => row.hotelId === hotelId) ?? null

  // Look up importance from the CURRENT places, so an edited importance shows
  // up in the link labels straight away.
  const importanceOf = (placeId) => places.find((place) => place.id === placeId)?.importance

  return (
    <section className="city-map" aria-label="City map">
      <h2>
        Calderra
        <span className="section-note">
          {selectedHotel ? ` · showing links from ${selectedHotel.name}` : ''}
        </span>
      </h2>

      <svg
        className="map-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={
          selectedHotel
            ? `Schematic map of 10 hotels and 15 places, with comparison links from ${selectedHotel.name}`
            : 'Schematic map of 10 hotels and 15 places'
        }
      >
        {/* --- comparison links, only for the inspected hotel ---------------- */}
        {selectedHotel && (
          <g className="links">
            {places.map((place) => {
              const minutes = selectedHotel.round_trip_minutes[place.id]
              const importance = importanceOf(place.id)
              const contribution = Number.isFinite(minutes * importance)
                ? minutes * importance
                : null
              const midX = (sx(selectedHotel.x) + sx(place.x)) / 2
              const midY = (sy(selectedHotel.y) + sy(place.y)) / 2

              return (
                <g key={place.id} className={minutes > 90 ? 'link long' : 'link'}>
                  <line
                    x1={sx(selectedHotel.x)}
                    y1={sy(selectedHotel.y)}
                    x2={sx(place.x)}
                    y2={sy(place.y)}
                  >
                    {/* hover tooltip: the full sum for this one link */}
                    <title>
                      {`${place.name} — ${minutes} min × importance ${importance} = ${contribution}`}
                    </title>
                  </line>
                  <text className="link-label" x={midX} y={midY}>
                    {minutes}
                  </text>
                </g>
              )
            })}
          </g>
        )}

        {/* --- places ------------------------------------------------------- */}
        <g className="places">
          {places.map((place) => (
            <g key={place.id} className={`place ${place.type}`}>
              {place.type === 'attraction' ? (
                // diamond for attractions, circle for food: the shape carries
                // the meaning, so it survives being printed in black and white
                <rect
                  x={sx(place.x) - 7}
                  y={sy(place.y) - 7}
                  width="14"
                  height="14"
                  transform={`rotate(45 ${sx(place.x)} ${sy(place.y)})`}
                />
              ) : (
                <circle cx={sx(place.x)} cy={sy(place.y)} r="7.5" />
              )}
              <text className="marker-label" x={sx(place.x)} y={sy(place.y) - 13}>
                {place.name}
              </text>
            </g>
          ))}
        </g>

        {/* --- hotels ------------------------------------------------------- */}
        <g className="hotels">
          {hotels.map((hotel) => {
            const row = rowFor(hotel.id)
            const isSelected = hotel.id === selectedHotelId
            const classes = [
              'hotel-marker',
              isSelected ? 'selected' : '',
              row?.recommended ? 'recommended' : '',
              row && !row.affordable ? 'excluded' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <g
                key={hotel.id}
                className={classes}
                onClick={() => onSelectHotel(hotel.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectHotel(hotel.id)
                  }
                }}
                aria-label={`${hotel.name}, ${
                  row ? (row.affordable ? `rank ${row.rank}` : 'over budget') : 'no ranking'
                }`}
              >
                <rect x={sx(hotel.x) - 9} y={sy(hotel.y) - 9} width="18" height="18" rx="3" />

                {/* a symbol on the marker itself, so status is never colour-only */}
                {row?.recommended && (
                  <text className="hotel-mark" x={sx(hotel.x)} y={sy(hotel.y) + 5}>
                    ★
                  </text>
                )}
                {row && !row.affordable && (
                  <text className="hotel-mark" x={sx(hotel.x)} y={sy(hotel.y) + 5}>
                    ✕
                  </text>
                )}
                {row?.affordable && !row.recommended && (
                  <text className="hotel-mark" x={sx(hotel.x)} y={sy(hotel.y) + 5}>
                    {row.rank}
                  </text>
                )}

                <text className="marker-label hotel-label" x={sx(hotel.x)} y={sy(hotel.y) + 26}>
                  {hotel.name}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <ul className="map-legend">
        <li>
          <span aria-hidden="true">◆</span> attraction
        </li>
        <li>
          <span aria-hidden="true">●</span> food stop
        </li>
        <li>
          <span aria-hidden="true">■</span> hotel (number = rank)
        </li>
        <li>
          <span aria-hidden="true">★</span> recommended
        </li>
        <li>
          <span aria-hidden="true">✕</span> over budget, not ranked
        </li>
        <li>
          <span className="legend-line long" aria-hidden="true" /> round trip over 90 min
        </li>
      </ul>

      <p className="map-note">
        Positions are illustrative only. Every travel time comes from the trip data, never from
        the length of a line on this map.
      </p>
    </section>
  )
}
