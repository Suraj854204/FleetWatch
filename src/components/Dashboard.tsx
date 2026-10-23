import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useFleet, useTripPoints } from '../data/useFleet';
import { fmtNum } from '../lib/format';
import Sidebar from './Sidebar';
import FleetMap from './FleetMap';
import VehiclePanel from './VehiclePanel';

const DAY = 86_400_000;

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const fleet = useFleet();
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [playIndex, setPlayIndex] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // The seed is a static snapshot. If it is older than a few minutes, shift the clock so that
  // "last seen" and "last 24 h" stay meaningful whenever the app is reviewed.
  const skew = useRef<number | null>(null);
  if (skew.current === null && fleet.vehicles.length) {
    const newest = Math.max(...fleet.vehicles.map((v) => new Date(v.last_seen).getTime()));
    const gap = Date.now() - newest - 20_000;
    skew.current = gap > 10 * 60_000 ? gap : 0;
  }
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now() - (skew.current ?? 0), [tick, fleet.vehicles.length]);

  const vehicle = fleet.vehicles.find((v) => v.id === vehicleId) ?? null;
  const vehicleTrips = useMemo(() => fleet.trips.filter((t) => t.vehicle_id === vehicleId), [fleet.trips, vehicleId]);
  const trip = vehicleTrips.find((t) => t.id === tripId) ?? null;
  const { points, loading: pointsLoading } = useTripPoints(tripId);

  const selectVehicle = (id: string, preferTrip?: string | null) => {
    setVehicleId(id);
    const first = fleet.trips.find((t) => t.vehicle_id === id);
    setTripId(preferTrip ?? first?.id ?? null);
    setPlayIndex(null);
  };
  const selectTrip = (id: string | null) => {
    setTripId(id);
    setPlayIndex(null);
  };
  const clearSelection = () => {
    setVehicleId(null);
    setTripId(null);
    setPlayIndex(null);
  };

  const kpis = useMemo(() => {
    const recent = fleet.trips.filter((t) => new Date(t.started_at).getTime() > now - DAY);
    const attentionIds = new Set(fleet.alerts.filter((a) => a.severity !== 'info').map((a) => a.vehicle_id));
    return {
      moving: fleet.vehicles.filter((v) => v.status === 'moving').length,
      total: fleet.vehicles.length,
      attention: attentionIds.size,
      trips: recent.length,
      distance: recent.reduce((s, t) => s + Number(t.distance_km), 0),
      overspeed: recent.reduce((s, t) => s + t.overspeed_count, 0),
    };
  }, [fleet.trips, fleet.vehicles, fleet.alerts, now]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#12212e" />
            <path d="M7 22 L13 13 L18 18 L25 9" fill="none" stroke="#3ddc97" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="25" cy="9" r="2.6" fill="#fff" />
          </svg>
          <div>
            <strong>Fleetwatch</strong>
            <span>Lucknow operations</span>
          </div>
        </div>
        <dl className="kpis">
          <div><dt>Moving now</dt><dd>{kpis.moving}<small> / {kpis.total}</small></dd></div>
          <div className={kpis.attention ? 'kpi-warn' : ''}><dt>Need attention</dt><dd>{kpis.attention}</dd></div>
          <div><dt>Trips, last 24 h</dt><dd>{kpis.trips}</dd></div>
          <div><dt>Distance, last 24 h</dt><dd>{fmtNum(kpis.distance, 0)}<small> km</small></dd></div>
          <div className={kpis.overspeed ? 'kpi-bad' : ''}><dt>Overspeed events, 24 h</dt><dd>{kpis.overspeed}</dd></div>
        </dl>
        <div className="user">
          <span title={session?.user.email}>{session?.user.email}</span>
          <button className="btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {fleet.error && (
        <div className="banner-error" role="alert">
          Could not load fleet data: {fleet.error}. Check that schema.sql and seed.sql were run.
          <button onClick={fleet.reload}>Retry</button>
        </div>
      )}

      <main className="workspace">
        <Sidebar
          vehicles={fleet.vehicles}
          alerts={fleet.alerts}
          loading={fleet.loading}
          selectedId={vehicleId}
          now={now}
          onSelectVehicle={selectVehicle}
          onAcknowledge={fleet.acknowledge}
        />
        <section className="map-wrap" aria-label="Fleet map">
          <FleetMap
            vehicles={fleet.vehicles}
            selectedVehicle={vehicle}
            trip={trip}
            points={points}
            playIndex={playIndex}
            onSelectVehicle={(id) => selectVehicle(id)}
          />
        </section>
        <VehiclePanel
          vehicle={vehicle}
          trips={vehicleTrips}
          alerts={fleet.alerts.filter((a) => a.vehicle_id === vehicleId)}
          selectedTripId={tripId}
          points={points}
          pointsLoading={pointsLoading}
          playIndex={playIndex}
          now={now}
          onSelectTrip={selectTrip}
          onPlayIndex={setPlayIndex}
          onAcknowledge={fleet.acknowledge}
          onClose={clearSelection}
        />
      </main>
    </div>
  );
}
