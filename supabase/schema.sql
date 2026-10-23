-- Fleetwatch schema. Run once in Supabase Dashboard -> SQL Editor.
-- Safe to re-run: it only creates objects that do not exist yet.

create extension if not exists pgcrypto;

-- Vehicles: current state snapshot of each unit.
-- last_* columns are denormalised from telemetry so the fleet map needs ONE cheap query.
create table if not exists public.vehicles (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,                 -- short fleet id, e.g. LKO-01
  reg_number       text not null unique,
  make_model       text not null,
  vehicle_type     text not null,
  driver_name      text,
  status           text not null check (status in ('moving','idle','parked','offline','maintenance')),
  ignition         boolean not null default false,
  fuel_pct         numeric(5,1) not null check (fuel_pct between 0 and 100),
  battery_v        numeric(4,1) not null,
  odometer_km      numeric(10,1) not null default 0,
  speed_limit_kmh  integer not null default 60,          -- per-vehicle policy used for overspeed
  last_lat         double precision not null,
  last_lng         double precision not null,
  last_speed_kmh   numeric(5,1) not null default 0,
  last_seen        timestamptz not null,
  created_at       timestamptz not null default now()
);

-- Trips: one row per ignition-on journey, with pre-aggregated stats for fast lists.
create table if not exists public.trips (
  id               uuid primary key default gen_random_uuid(),
  vehicle_id       uuid not null references public.vehicles(id) on delete cascade,
  driver_name      text,
  status           text not null check (status in ('in_progress','completed')),
  started_at       timestamptz not null,
  ended_at         timestamptz,
  start_name       text not null,
  end_name         text not null,
  start_lat        double precision not null,
  start_lng        double precision not null,
  end_lat          double precision not null,
  end_lng          double precision not null,
  distance_km      numeric(7,2) not null,
  duration_min     numeric(7,1) not null,
  avg_speed_kmh    numeric(5,1) not null,
  max_speed_kmh    numeric(5,1) not null,
  idle_min         numeric(6,1) not null default 0,
  halt_count       integer not null default 0,
  overspeed_count  integer not null default 0
);

-- Trip points: raw breadcrumb trail (GPS fix + speed) for drawing and replaying a route.
create table if not exists public.trip_points (
  id           bigint generated always as identity primary key,
  trip_id      uuid not null references public.trips(id) on delete cascade,
  vehicle_id   uuid not null references public.vehicles(id) on delete cascade,
  recorded_at  timestamptz not null,
  lat          double precision not null,
  lng          double precision not null,
  speed_kmh    numeric(5,1) not null default 0
);

-- Alerts: persisted so operators can acknowledge them and the state survives reloads.
create table if not exists public.alerts (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references public.vehicles(id) on delete cascade,
  trip_id      uuid references public.trips(id) on delete set null,
  type         text not null check (type in ('overspeed','low_fuel','low_battery','offline','maintenance','excessive_idle')),
  severity     text not null check (severity in ('critical','warning','info')),
  message      text not null,
  created_at   timestamptz not null default now(),
  resolved     boolean not null default false,
  resolved_at  timestamptz
);

create index if not exists trips_vehicle_started_idx on public.trips (vehicle_id, started_at desc);
create index if not exists trip_points_trip_time_idx on public.trip_points (trip_id, recorded_at);
create index if not exists alerts_open_idx on public.alerts (resolved, created_at desc);

-- Row Level Security: only signed-in users can read; they may acknowledge alerts, nothing else.
alter table public.vehicles    enable row level security;
alter table public.trips       enable row level security;
alter table public.trip_points enable row level security;
alter table public.alerts      enable row level security;

drop policy if exists "auth read vehicles"    on public.vehicles;
drop policy if exists "auth read trips"       on public.trips;
drop policy if exists "auth read trip_points" on public.trip_points;
drop policy if exists "auth read alerts"      on public.alerts;
drop policy if exists "auth ack alerts"       on public.alerts;

create policy "auth read vehicles"    on public.vehicles    for select to authenticated using (true);
create policy "auth read trips"       on public.trips       for select to authenticated using (true);
create policy "auth read trip_points" on public.trip_points for select to authenticated using (true);
create policy "auth read alerts"      on public.alerts      for select to authenticated using (true);
create policy "auth ack alerts"       on public.alerts      for update to authenticated using (true) with check (true);
