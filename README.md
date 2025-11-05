# Openhouse Afterschool Planner (Mobile UI)

A ready-to-run Vite + React + Tailwind project implementing the customer-facing mobile scheduler you designed.

## Features
- Day tabs act as a **navigator** (smooth scroll) over a single vertical list grouped by day.
- **Morning / Afternoon** multi-select filter (both selected by default).
- Compact cards with **subject chip**, **coins badge** on the right, **seats** badge, and quick select.
- Weekly **overview grid** above the list.
- **Step discounts** with live nudge and savings line: ₹1,000 at 2 selections, ₹2,500 at 3, ₹5,000 at 4.
- Demo **Add Batch** button to append a slot (for quick testing).

## Run locally
```bash
npm i
npm run dev
```
Open the local URL that Vite prints.

## Build
```bash
npm run build
npm run preview
```

## Where to plug your API
- Replace the `INITIAL_SLOTS` array in `src/App.jsx` with data from your backend.- Or fetch in `useEffect` and set with `setSlots(fetched)`.- You can extend the slot object with your own fields; UI reads: `dow`, `day`, `time`, `subject`, `coins`, `seatsLeft`, `status`, `center`, `teacher`.
