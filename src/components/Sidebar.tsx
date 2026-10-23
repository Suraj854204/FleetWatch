import { useMemo, useState } from 'react';
import type { Alert, Vehicle, VehicleStatus } from '../lib/types';
import { SEVERITY_COLOR, SEVERITY_RANK, STATUS_META, timeAgo } from '../lib/format';

type Filter = 'all' | VehicleStatus | 'attention';

interface Props {
  vehicles: Vehicle[];
  alerts: Alert[];
  loading: boolean;
  selectedId: string | null;
  now: number;
  onSelectVehicle: (id: string, tripId?: string | null) => void;
  onAcknowledge: (alertId: string) => void;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Attention' },
  { key: 'moving', label: 'Moving' },
  { key: 'idle', label: 'Idling' },
  { key: 'parked', label: 'Parked' },
  { key: 'offline', label: 'Offline' },
];

export default function Sidebar({ vehicles, alerts, loading, selectedId, now, onSelectVehicle, onAcknowledge }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const byVehicle = useMemo(() => {
    const m = new Map<string, Vehicle>();
    vehicles.forEach((v) => m.set(v.id, v));
    return m;
  }, [vehicles]);

  const worst = useMemo(() => {
    const m = new Map<string, Alert['severity']>();
    alerts.forEach((a) => {
      const cur = m.get(a.vehicle_id);
      if (!cur || SEVERITY_RANK[a.severity] < SEVERITY_RANK[cur]) m.set(a.vehicle_id, a.severity);
    });
    return m;
  }, [alerts]);

  const sortedAlerts = useMemo(
    () =>
      [...alerts]
        .filter((a) => showInfo || a.severity !== 'info')
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || +new Date(b.created_at) - +new Date(a.created_at)),
    [alerts, showInfo],
  );
  const infoCount = alerts.filter((a) => a.severity === 'info').length;

  const list = vehicles.filter((v) => {
    if (filter === 'attention' && !(worst.get(v.id) === 'critical' || worst.get(v.id) === 'warning')) return false;
    if (filter !== 'all' && filter !== 'attention' && v.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || [v.name, v.reg_number, v.driver_name ?? '', v.make_model].some((s) => s.toLowerCase().includes(q));
  });

  return (
    <aside className="sidebar">
      <section className="attention">
        <div className="section-head">
          <h2>Needs attention</h2>
          <span className="count">{sortedAlerts.length}</span>
        </div>
        <ul className="alert-list">
          {sortedAlerts.map((a) => {
            const v = byVehicle.get(a.vehicle_id);
            return (
              <li key={a.id} className="alert-item" style={{ ['--sev' as string]: SEVERITY_COLOR[a.severity] }}>
                <button className="alert-main" onClick={() => onSelectVehicle(a.vehicle_id, a.trip_id)}>
                  <span className="alert-title">{v?.name ?? 'Vehicle'} <em>{a.severity}</em></span>
                  <span className="alert-msg">{a.message}</span>
                  <span className="alert-time">{timeAgo(a.created_at, now)}</span>
                </button>
                <button className="alert-ack" onClick={() => onAcknowledge(a.id)} aria-label={`Acknowledge alert for ${v?.name ?? 'vehicle'}`}>
                  Acknowledge
                </button>
              </li>
            );
          })}
          {!sortedAlerts.length && !loading && <li className="empty">Nothing needs attention right now.</li>}
        </ul>
        {infoCount > 0 && (
          <button className="link-btn" onClick={() => setShowInfo((s) => !s)}>
            {showInfo ? 'Hide' : 'Show'} {infoCount} informational notice{infoCount > 1 ? 's' : ''}
          </button>
        )}
      </section>

      <section className="vehicles">
        <div className="section-head">
          <h2>Vehicles</h2>
          <span className="count">{list.length}</span>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search name, plate or driver"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search vehicles"
        />
        <div className="chips" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <ul className="vehicle-list">
          {list.map((v) => {
            const sev = worst.get(v.id);
            return (
              <li key={v.id}>
                <button className={`vehicle-row ${selectedId === v.id ? 'sel' : ''}`} onClick={() => onSelectVehicle(v.id)}>
                  <span className="dot" style={{ background: STATUS_META[v.status].color }} />
                  <span className="vr-main">
                    <strong>{v.name}</strong>
                    <small>{v.reg_number}</small>
                  </span>
                  <span className="vr-side">
                    <span style={{ color: STATUS_META[v.status].color }}>
                      {v.status === 'moving' ? `${Math.round(v.last_speed_kmh)} km/h` : STATUS_META[v.status].label}
                    </span>
                    <small>{timeAgo(v.last_seen, now)}</small>
                  </span>
                  {sev && <span className="sev-pip" style={{ background: SEVERITY_COLOR[sev] }} title={`${sev} alert`} />}
                </button>
              </li>
            );
          })}
          {!list.length && <li className="empty">No vehicles match.</li>}
        </ul>
      </section>
    </aside>
  );
}
