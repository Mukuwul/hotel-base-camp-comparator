# Hotel Base-Camp Comparator

Built for the Cisco AI-Assisted Coding Interview — Problem SPR26_D2_P03.

## What it does

Helps a group deciding on a trip pick the most accessible hotel they can
actually afford. Given a fixed set of hotels (with prices) and wishlist
places (each with an importance score and a known round-trip travel time
from every hotel), it calculates an importance-weighted accessibility
score for each hotel, filters by budget, ranks what's left, and explains
exactly why the recommended hotel won — no vague "centrally located"
claims.

## Tech stack

- Vite + React (JavaScript, no TypeScript)
- Inline SVG for the city map
- Vitest for tests

## Running it

```
npm install
npm run dev
```

## Status

In progress — being built stage by stage: data + validation, then the
ranking engine, then state, then the UI, then a full test sweep.
