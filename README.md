# Fleetwatch – fleet operations dashboard

A focused fleet dashboard for an internal operations team, built for the Bytebeam Frontend Intern assignment.
React + TypeScript + Vite, Supabase (Auth + Postgres), Leaflet map.

## Live demo

- **URL:** `<ADD DEPLOYED URL>`
- **Demo login:** `demo@fleetwatch.app` / `Fleet@Demo2026` (created by `npm run seed:user`, see below)
- **Walkthrough (optional):** `<ADD LINK>`

## Project overview

An ops user opens the app and answers four questions without clicking anything:

1. **Is anything wrong?** The left column lists open alerts ordered by severity (critical, then warning). The header shows moving vehicles, vehicles needing attention, and 24 h trips, distance and overspeed events.
2. **Where is everyone?** The map shows every vehicle, coloured by status (moving, idling, parked, offline, in workshop).
3. **What did this vehicle do?** Click a vehicle (or an alert) and its latest trip is drawn on the map, **coloured by speed** against that vehicle's limit (green within limit, amber near it, red over). Start and end points are marked.
4. **Where exactly did it go wrong?** Expand a trip to see distance, duration, average and max speed, idle time and halts, a speed-over-time chart with the limit line, and a **replay slider**. Dragging the slider or hovering the chart moves a marker along the route, so "max 83 km/h" becomes "83 km/h at this junction".

### Main product decisions

- **Few metrics, chosen for action.** Vehicle: status, speed, ignition, fuel, battery, last seen, odometer, limit. Trip: distance, duration, avg/max speed, idle time, halts, overspeed events. Things that need a decision (low fuel, low battery, offline, overspeeding) are promoted to alerts instead of left as numbers to notice.
- **Attention first.** Alerts sit above the vehicle list. Informational notices (workshop, long idling) are hidden by default so they do not bury real problems. Alerts can be acknowledged and that is persisted.
- **Alerts deep-link.** Clicking an overspeed alert selects the vehicle and opens the exact trip that caused it.
- **Route colouring is the stretch feature.** Together with replay and the "Overspeed only" trip filter it makes the route analytical, not decorative.
- Not built on purpose: live GPS ingestion, geofences, driver management, a landing page.

## Local setup

Requires Node 18+.

```bash
npm install
cp .env.example .env      # then fill in the two values from Supabase -> Project Settings -> API
npm run dev               # http://localhost:5173
```

`npm run build` type-checks and produces `dist/` for deployment.

## Supabase setup

1. Create a project at supabase.com.
2. **Schema:** SQL Editor -> paste `supabase/schema.sql` -> Run.
3. **Seed data:** SQL Editor -> paste `supabase/seed.sql` -> Run (about 230 KB: 12 vehicles, 69 trips, ~1,500 GPS points, 45 alerts). Re-running resets the demo data.
4. **Auth:** Authentication -> Providers: Email is enabled by default. Create the demo user either way:
   - Dashboard: Authentication -> Users -> Add user (tick *Auto confirm*), or
   - Script: `SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed:user` (service-role key stays on your machine, never in the app).
5. Put the project URL and **anon** key in `.env` (or in the host's environment variables when deploying: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Data model

| Table | Purpose | Key columns |
|---|---|---|
| `vehicles` | Current state of each unit | `status`, `ignition`, `fuel_pct`, `battery_v`, `speed_limit_kmh`, `last_lat/lng`, `last_speed_kmh`, `last_seen` |
| `trips` | One row per journey with pre-aggregated stats | `vehicle_id` -> vehicles, `status` (in_progress/completed), start/end name and coordinates, `distance_km`, `duration_min`, `avg/max_speed_kmh`, `idle_min`, `halt_count`, `overspeed_count` |
| `trip_points` | GPS breadcrumbs for drawing and replaying a route | `trip_id` -> trips, `vehicle_id` -> vehicles, `recorded_at`, `lat`, `lng`, `speed_kmh` |
| `alerts` | Operator-facing issues | `vehicle_id`, optional `trip_id`, `type`, `severity`, `message`, `resolved` |

Relationships: vehicles 1-N trips 1-N trip_points; vehicles 1-N alerts; alerts N-0..1 trips (`on delete set null`).
Row Level Security is on for every table: signed-in users can read everything and may update alerts (acknowledge). Nobody else can read or write.

## Technical decisions and tradeoffs

- **Vite + React + TypeScript, no router/state library.** The app is one authenticated screen; a session check gates it (`App.tsx`), and a small hook (`useFleet`) loads data and refreshes every 30 s. Fewer moving parts, easier to review.
- **Leaflet + react-leaflet with CARTO light tiles.** Free, no API key, so the project runs for reviewers with zero extra setup. Mapbox/MapLibre GL would give smoother vector rendering but needs a token or tile hosting.
- **Denormalised aggregates.** `trips` stores distance/avg/max/idle/halts/overspeed and `vehicles` stores `last_*` fields. Lists and the map need one cheap query each; points are fetched only for the selected trip. In production these would be computed by the ingestion pipeline or a database trigger.
- **Alerts are rows, not computed in the browser.** That lets operators acknowledge them and keeps the rules in one place (here generated by the seed script; in production by a backend job).
- **Per-vehicle speed limit** drives overspeed colouring and counting. Real systems would use road-segment limits.
- **Seeded data is a snapshot.** Timestamps are written relative to when the seed runs. If the seed is older than ~10 minutes when the app is opened, the UI shifts its clock so "last seen" and "last 24 h" stay meaningful. Re-run `seed.sql` to refresh for real.
- **Routes are synthetic by default.** `scripts/generate-seed.mjs` builds curved paths between real Lucknow locations (coordinates approximate) so the seed is deterministic and works offline. Run `OSRM=1 npm run seed:generate` to snap routes to real roads via the public OSRM server, then re-run the new `seed.sql`.
- Bundle is a single ~550 kB chunk (Leaflet + Supabase client); fine for an internal tool, would be code-split next.

## AI usage

- **Tool:** Claude (claude.ai). Chat links are in `AI_CHAT_LOGS.md`.
- **Where it helped:** reading the assignment and planning scope, drafting the schema and RLS policies, the seed generator (route simulation, trip statistics, alerts), React components and CSS.
- **How output was reviewed/modified:** `<FILL IN: what you checked, ran, and changed yourself, e.g. adjusted the metrics shown, changed colours, tested login/RLS in your own Supabase project>`. Keep this honest and specific; reviewers read it.

## Project structure

```
src/auth/        Supabase auth provider and login page
src/data/        useFleet (vehicles, trips, alerts) and useTripPoints hooks
src/components/  Dashboard, Sidebar, FleetMap, VehiclePanel, SpeedChart
supabase/        schema.sql, seed.sql (generated)
scripts/         generate-seed.mjs, create-demo-user.mjs
```
