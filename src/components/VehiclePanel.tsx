import { useMemo, useState } from 'react';
import type { Alert, Trip, TripPoint, Vehicle } from '../lib/types';
import { SEVERITY_COLOR, STATUS_META, fmtClock, fmtDateTime, fmtDuration, fmtNum, speedColor, timeAgo } from '../lib/format';
import SpeedChart from './SpeedChart';

interface Props {
  vehicle: Vehicle | null;
  trips: Trip[];
  alerts: Alert[];
  selectedTripId: string | null;
  points: TripPoint[];
  pointsLoading: boolean;
  playIndex: number | null;
  now: number;
  onSelectTrip: (id: string | null) => void;
  onPlayIndex: (i: number | null) => void;
  onAcknowledge: (id: string) => void;
  onClose: () => void;
}

type Range = '24h' | '7d';

export default function VehiclePanel(p: Props) {
  const [range, setRange] = useState<Range>('7d');
  const [overspeedOnly, setOverspeedOnly] = useState(false);

  const trips = useMemo(() => {
    const cutoff = p.now - (range === '24h' ? 86_400_000 : 7 * 86_400_000);
    return p.trips.filter((t) => new Date(t.started_at).getTime() >= cutoff && (!overspeedOnly || t.overspeed_count > 0));
  }, [p.trips, p.now, range, overspeedOnly]);

  if (!p.vehicle) {
    return (
      <aside className="panel panel-empty">
        <h2>Select a vehicle</h2>
        <p>Pick a pin on the map or a vehicle in the list to see its health, recent trips and route. Click a trip to draw it on the map, coloured by speed.</p>
        <p className="hint">Alerts in the left column jump straight to the vehicle and the trip that caused them.</p>
      </aside>
    );
  }

  const v = p.vehicle;
  const meta = STATUS_META[v.status];
  const fuelLow = v.fuel_pct < 20;
  const battLow = v.battery_v < 11.8;

  return (
    <aside className="panel">
      <div className="panel-head">
        <div>
          <h2>{v.name}</h2>
          <p>{v.make_model}, {v.reg_number}</p>
        </div>
        <button className="icon-btn" onClick={p.onClose} aria-label="Close vehicle details">×</button>
      </div>

      <div className="status-row">
        <span className="pill" style={{ background: meta.color }}>{meta.label}</span>
        <span>{v.driver_name ?? 'No driver assigned'}</span>
        <span className="muted">Seen {timeAgo(v.last_seen, p.now)}</span>
      </div>

      <dl className="vitals">
        <div>
          <dt>Speed</dt>
          <dd>{v.status === 'moving' ? `${Math.round(v.last_speed_kmh)} km/h` : '0 km/h'}</dd>
        </div>
        <div>
          <dt>Ignition</dt>
          <dd>{v.ignition ? 'On' : 'Off'}</dd>
        </div>
        <div className={battLow ? 'bad' : ''}>
          <dt>Battery</dt>
          <dd>{v.battery_v.toFixed(1)} V</dd>
        </div>
        <div className={fuelLow ? 'bad' : ''}>
          <dt>Fuel</dt>
          <dd>{Math.round(v.fuel_pct)}%</dd>
          <span className="bar"><i style={{ width: `${v.fuel_pct}%`, background: fuelLow ? '#c8372d' : '#1f9d6b' }} /></span>
        </div>
        <div>
          <dt>Odometer</dt>
          <dd>{fmtNum(v.odometer_km)} km</dd>
        </div>
        <div>
          <dt>Speed limit</dt>
          <dd>{v.speed_limit_kmh} km/h</dd>
        </div>
      </dl>

      {p.alerts.length > 0 && (
        <ul className="panel-alerts">
          {p.alerts.map((a) => (
            <li key={a.id} style={{ ['--sev' as string]: SEVERITY_COLOR[a.severity] }}>
              <span>{a.message}</span>
              <button onClick={() => p.onAcknowledge(a.id)}>Acknowledge</button>
            </li>
          ))}
        </ul>
      )}

      <div className="section-head trips-head">
        <h3>Trips</h3>
        <div className="chips">
          <button className={`chip ${range === '24h' ? 'on' : ''}`} onClick={() => setRange('24h')}>24 h</button>
          <button className={`chip ${range === '7d' ? 'on' : ''}`} onClick={() => setRange('7d')}>7 days</button>
          <button className={`chip ${overspeedOnly ? 'on bad' : ''}`} onClick={() => setOverspeedOnly((o) => !o)}>Overspeed only</button>
        </div>
      </div>

      <ul className="trip-list">
        {trips.map((t) => {
          const open = t.id === p.selectedTripId;
          return (
            <li key={t.id} className={open ? 'open' : ''}>
              <button className="trip-head" onClick={() => p.onSelectTrip(open ? null : t.id)} aria-expanded={open}>
                <span className="trip-route">{t.start_name} to {t.end_name}</span>
                <span className="trip-meta">
                  {t.status === 'in_progress' ? <b className="live">In progress</b> : fmtDateTime(t.started_at, p.now)}
                  <span>{fmtNum(t.distance_km, 1)} km</span>
                  <span>{fmtDuration(t.duration_min)}</span>
                  {t.overspeed_count > 0 && <b className="over">{t.overspeed_count} overspeed</b>}
                </span>
              </button>
              {open && (
                <div className="trip-body">
                  <dl className="stats">
                    <div><dt>Distance</dt><dd>{fmtNum(t.distance_km, 1)} km</dd></div>
                    <div><dt>Duration</dt><dd>{fmtDuration(t.duration_min)}</dd></div>
                    <div><dt>Avg speed</dt><dd>{fmtNum(t.avg_speed_kmh)} km/h</dd></div>
                    <div className={t.max_speed_kmh > v.speed_limit_kmh ? 'bad' : ''}><dt>Max speed</dt><dd>{fmtNum(t.max_speed_kmh)} km/h</dd></div>
                    <div><dt>Idle time</dt><dd>{fmtDuration(t.idle_min)}</dd></div>
                    <div><dt>Halts</dt><dd>{t.halt_count}</dd></div>
                  </dl>
                  {p.pointsLoading && <p className="muted">Loading route…</p>}
                  {p.points.length > 1 && (
                    <>
                      <SpeedChart points={p.points} limit={v.speed_limit_kmh} playIndex={p.playIndex} onHover={p.onPlayIndex} />
                      <label className="scrub">
                        <span>Replay route</span>
                        <input
                          type="range"
                          min={0}
                          max={p.points.length - 1}
                          value={p.playIndex ?? 0}
                          onChange={(e) => p.onPlayIndex(Number(e.target.value))}
                          aria-label="Scrub through the trip"
                        />
                      </label>
                      <p className="scrub-readout">
                        {p.playIndex !== null && p.points[p.playIndex] ? (
                          <>
                            {fmtClock(p.points[p.playIndex].recorded_at)}, 
                            <b style={{ color: speedColor(p.points[p.playIndex].speed_kmh, v.speed_limit_kmh) }}> {Math.round(p.points[p.playIndex].speed_kmh)} km/h</b>
                          </>
                        ) : (
                          'Drag the slider or hover the chart to follow the vehicle along the route.'
                        )}
                      </p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {!trips.length && <li className="empty">No trips match these filters.</li>}
      </ul>
    </aside>
  );
}
