# Fleetwatch – Fleet Operations Dashboard

A focused, single-screen operations dashboard designed for real-time fleet oversight and alert resolution. Built for the Bytebeam Frontend Intern assignment.

**Tech Stack:** React, TypeScript, Vite, Supabase (Auth + Postgres), Leaflet.

---

## Live Demo & Credentials

* **Deployment:** [https://fleetwatch-roan.vercel.app/](https://fleetwatch-roan.vercel.app/)
* **Demo Account:** `fleetuser@gmail.com`
* **Demo Password:** `Demo12345`

---

## Operations Workflow

The dashboard delivers immediate situational awareness without requiring navigation or configuration clicks:

1. **System Health & Critical Alerts:** The left column renders open alerts sorted by urgency (critical, warning). Header counters provide aggregated statistics on active movement, flagged vehicles, and 24-hour distance/overspeed totals.
2. **Geospatial Tracking:** The central map panel plots all active assets, color-coded by operational state (*moving*, *idling*, *parked*, *offline*, *in workshop*).
3. **Trip Telemetry & Speed Analysis:** Selecting a vehicle or deep-linking from an alert loads the latest journey onto the map. Polyline segments are dynamically color-coded relative to the vehicle's speed limit (green $\le 100\%$, amber $100\text{--}110\%$, red $> 110\%$).
4. **Telemetry Scrubbing & Root-Cause Inspection:** Expanding trip details exposes metrics (distance, duration, average/max speed, idle time, halt count), a speed-over-time chart with a threshold line, and an interactive replay slider. Moving the slider or hovering the chart synchronizes the map marker position for point-in-time spatial analysis.

---

## Key Engineering & Product Decisions

* **Action-Oriented Domain Model:** Low fuel, critical battery, offline states, and severe overspeeding are surfaced directly as actionable alerts with persistent resolution states (`alerts.resolved`), avoiding manual grid scanning.
* **Alert Deep-Linking:** Interacting with a speed alert automatically selects the asset and loads the corresponding telemetry segment.
* **Zero-Configuration Mapping:** Leaflet and `react-leaflet` use CARTO light tiles to avoid API key setups for code reviewers while providing clear contrast for route polylines.
* **Optimized Network Architecture:** Vehicle states and aggregated trip metrics are pre-calculated and stored in denormalized tables (`vehicles`, `trips`). Detailed GPS coordinates (`trip_points`) are fetched on-demand only when a trip is selected.

---

## Architecture & Data Model

### Entity-Relationship Overview

* **`vehicles` (1) $\rightarrow$ `trips` (N):** Operational states and running averages.
* **`trips` (1) $\rightarrow$ `trip_points` (N):** Time-series GPS breadcrumbs (`lat`, `lng`, `speed_kmh`, `recorded_at`).
* **`vehicles` (1) $\rightarrow$ `alerts` (N) $\rightarrow$ `trips` (0..1):** Operational flags with optional trip context (`on delete set null`).

### Database Schema

| Table | Purpose | Core Columns |
|---|---|---|
| `vehicles` | Asset current state | `id`, `status`, `ignition`, `fuel_pct`, `battery_v`, `speed_limit_kmh`, `last_lat`, `last_lng`, `last_speed_kmh`, `last_seen` |
| `trips` | Aggregated journey telemetry | `id`, `vehicle_id`, `status`, `start_name`, `end_name`, `distance_km`, `duration_min`, `avg_speed_kmh`, `max_speed_kmh`, `idle_min`, `halt_count`, `overspeed_count` |
| `trip_points` | High-frequency GPS coordinates | `id`, `trip_id`, `vehicle_id`, `recorded_at`, `lat`, `lng`, `speed_kmh` |
| `alerts` | Operator action items | `id`, `vehicle_id`, `trip_id`, `type`, `severity`, `message`, `resolved` |

**Security:** Row Level Security (RLS) is enabled on all tables. Authenticated users are granted read access across all tables and write access to update the `resolved` field on `alerts`.

---

## Local Setup & Environment

### Prerequisites
* Node.js $\ge 18$
* Supabase project

### Installation

```bash
npm install
cp .env.example .env
