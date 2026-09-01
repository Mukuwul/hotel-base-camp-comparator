export const PLACES = [
  { id: 'CLOCKTOWER',  name: 'Sunspire Clocktower',    type: 'attraction', importance: 4, x: 50, y: 14 },
  { id: 'BAKERY',      name: 'Brinehouse Bakery',      type: 'food',       importance: 2, x: 22, y: 26 },
  { id: 'MUSEUM',      name: 'Old Harbour Museum',     type: 'attraction', importance: 3, x: 72, y: 22 },
  { id: 'SAFFRON',     name: 'Saffron Alley',          type: 'food',       importance: 3, x: 38, y: 34 },
  { id: 'GARDENS',     name: 'Glasswing Gardens',      type: 'attraction', importance: 4, x: 86, y: 40 },
  { id: 'NIGHTMARKET', name: 'Midnight Night Market',  type: 'food',       importance: 5, x: 55, y: 46 },
  { id: 'LIGHTHOUSE',  name: 'Cliffside Lighthouse',   type: 'attraction', importance: 3, x: 12, y: 52 },
  { id: 'KETTLE',      name: 'The Copper Kettle',      type: 'food',       importance: 4, x: 66, y: 58 },
  { id: 'TOYMUSEUM',   name: 'Tin Soldier Toy Museum', type: 'attraction', importance: 1, x: 30, y: 62 },
  { id: 'GRILLHOUSE',  name: 'Grillhouse Riverside',   type: 'food',       importance: 4, x: 78, y: 68 },
  { id: 'RIVERWALK',   name: 'Azure Riverwalk',        type: 'attraction', importance: 5, x: 46, y: 72 },
  { id: 'CHOWDER',     name: 'Pier Six Chowder',       type: 'food',       importance: 1, x: 90, y: 80 },
  { id: 'GALLERY',     name: 'Ironworks Gallery',      type: 'attraction', importance: 2, x: 18, y: 78 },
  { id: 'EMBERFIELD',  name: 'Emberfield Street Food', type: 'food',       importance: 5, x: 62, y: 88 },
  { id: 'OBSERVATORY', name: 'Vault Hill Observatory', type: 'attraction', importance: 3, x: 34, y: 92 },
]

export const HOTELS = [
  {
    id: 'GILDED_ANCHOR', name: 'The Gilded Anchor', stay_cost: 5431, x: 8, y: 10,
    round_trip_minutes: { CLOCKTOWER: 32, BAKERY: 140, MUSEUM: 91, SAFFRON: 100, GARDENS: 138, NIGHTMARKET: 98, LIGHTHOUSE: 133, KETTLE: 48, TOYMUSEUM: 85, GRILLHOUSE: 94, RIVERWALK: 125, CHOWDER: 37, GALLERY: 68, EMBERFIELD: 10, OBSERVATORY: 121 },
  },
  {
    id: 'LANTERN_COURT', name: 'Lantern Court Inn', stay_cost: 3190, x: 42, y: 8,
    round_trip_minutes: { CLOCKTOWER: 70, BAKERY: 38, MUSEUM: 68, SAFFRON: 39, GARDENS: 13, NIGHTMARKET: 75, LIGHTHOUSE: 23, KETTLE: 79, TOYMUSEUM: 46, GRILLHOUSE: 80, RIVERWALK: 74, CHOWDER: 25, GALLERY: 37, EMBERFIELD: 79, OBSERVATORY: 34 },
  },
  {
    id: 'DOCKSIDE', name: 'Dockside Bunkhouse', stay_cost: 3060, x: 88, y: 12,
    round_trip_minutes: { CLOCKTOWER: 84, BAKERY: 118, MUSEUM: 103, SAFFRON: 41, GARDENS: 107, NIGHTMARKET: 81, LIGHTHOUSE: 33, KETTLE: 94, TOYMUSEUM: 76, GRILLHOUSE: 44, RIVERWALK: 46, CHOWDER: 35, GALLERY: 58, EMBERFIELD: 86, OBSERVATORY: 104 },
  },
  {
    id: 'MAPLE_VINE', name: 'Maple & Vine', stay_cost: 3808, x: 16, y: 38,
    round_trip_minutes: { CLOCKTOWER: 98, BAKERY: 122, MUSEUM: 70, SAFFRON: 120, GARDENS: 55, NIGHTMARKET: 58, LIGHTHOUSE: 37, KETTLE: 125, TOYMUSEUM: 47, GRILLHOUSE: 55, RIVERWALK: 17, CHOWDER: 74, GALLERY: 18, EMBERFIELD: 121, OBSERVATORY: 101 },
  },
  {
    id: 'RIDGEVIEW', name: 'The Ridgeview', stay_cost: 5931, x: 94, y: 32,
    round_trip_minutes: { CLOCKTOWER: 88, BAKERY: 74, MUSEUM: 55, SAFFRON: 114, GARDENS: 10, NIGHTMARKET: 70, LIGHTHOUSE: 92, KETTLE: 29, TOYMUSEUM: 136, GRILLHOUSE: 59, RIVERWALK: 138, CHOWDER: 123, GALLERY: 70, EMBERFIELD: 41, OBSERVATORY: 60 },
  },
  {
    id: 'COPPERLINE', name: 'Copperline Lodge', stay_cost: 4497, x: 60, y: 30,
    round_trip_minutes: { CLOCKTOWER: 46, BAKERY: 22, MUSEUM: 37, SAFFRON: 21, GARDENS: 89, NIGHTMARKET: 58, LIGHTHOUSE: 66, KETTLE: 24, TOYMUSEUM: 81, GRILLHOUSE: 104, RIVERWALK: 67, CHOWDER: 95, GALLERY: 86, EMBERFIELD: 22, OBSERVATORY: 136 },
  },
  {
    id: 'SALTWIND', name: 'Saltwind Hostel', stay_cost: 3491, x: 6, y: 66,
    round_trip_minutes: { CLOCKTOWER: 77, BAKERY: 48, MUSEUM: 18, SAFFRON: 54, GARDENS: 101, NIGHTMARKET: 98, LIGHTHOUSE: 11, KETTLE: 64, TOYMUSEUM: 109, GRILLHOUSE: 68, RIVERWALK: 43, CHOWDER: 12, GALLERY: 30, EMBERFIELD: 99, OBSERVATORY: 13 },
  },
  {
    id: 'MERIDIAN', name: 'The Meridian', stay_cost: 6790, x: 52, y: 60,
    round_trip_minutes: { CLOCKTOWER: 56, BAKERY: 47, MUSEUM: 116, SAFFRON: 69, GARDENS: 75, NIGHTMARKET: 41, LIGHTHOUSE: 72, KETTLE: 64, TOYMUSEUM: 41, GRILLHOUSE: 12, RIVERWALK: 59, CHOWDER: 58, GALLERY: 39, EMBERFIELD: 59, OBSERVATORY: 50 },
  },
  {
    id: 'FOXGLOVE', name: 'Foxglove House', stay_cost: 3795, x: 96, y: 62,
    round_trip_minutes: { CLOCKTOWER: 115, BAKERY: 129, MUSEUM: 62, SAFFRON: 48, GARDENS: 11, NIGHTMARKET: 61, LIGHTHOUSE: 26, KETTLE: 93, TOYMUSEUM: 54, GRILLHOUSE: 70, RIVERWALK: 76, CHOWDER: 90, GALLERY: 139, EMBERFIELD: 79, OBSERVATORY: 126 },
  },
  {
    id: 'HARBOUR_GATE', name: 'Harbour Gate Hotel', stay_cost: 4730, x: 26, y: 96,
    round_trip_minutes: { CLOCKTOWER: 61, BAKERY: 82, MUSEUM: 94, SAFFRON: 17, GARDENS: 21, NIGHTMARKET: 81, LIGHTHOUSE: 99, KETTLE: 132, TOYMUSEUM: 47, GRILLHOUSE: 131, RIVERWALK: 111, CHOWDER: 28, GALLERY: 131, EMBERFIELD: 25, OBSERVATORY: 87 },
  },
]

export const INITIAL_BUDGET = 4730
