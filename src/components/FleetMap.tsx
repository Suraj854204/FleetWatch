import { useEffect, useMemo, useRef } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Trip, TripPoint, Vehicle } from '../lib/types';
import { STATUS_META, speedColor } from '../lib/format';

interface Props {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  trip: Trip | null;
  points: TripPoint[];
  playIndex: number | null;
  onSelectVehicle: (id: string) => void;
}

const iconCache = new Map<string, L.DivIcon>();
function pinIcon(color: string, selected: boolean) {
  const key = `${color}-${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: 'pin-wrap',
      html: `<span class="pin ${selected ? 'pin-sel' : ''}" style="--c:${color}"></span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

function Viewport({ vehicles, selected, tripId, points }: { vehicles: Vehicle[]; selected: Vehicle | null; tripId: string | null; points: TripPoint[] }) {
  const map = useMap();
  const initial = useRef(false);

  useEffect(() => {
    if (!initial.current && vehicles.length) {
      map.fitBounds(L.latLngBounds(vehicles.map((v) => [v.last_lat, v.last_lng] as [number, number])), { padding: [50, 50] });
      initial.current = true;
    }
  }, [vehicles, map]);

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [70, 70] });
    }
  }, [points, map]);

  // Selected a vehicle but no trip: centre on its last known position.
  useEffect(() => {
    if (selected && !tripId) map.flyTo([selected.last_lat, selected.last_lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, tripId]);

  return null;
}

export default function FleetMap({ vehicles, selectedVehicle, trip, points, playIndex, onSelectVehicle }: Props) {
  const limit = selectedVehicle?.speed_limit_kmh ?? 60;

  // Merge consecutive segments with the same speed band into one polyline.
  const segments = useMemo(() => {
    const out: { color: string; path: [number, number][] }[] = [];
    for (let i = 1; i < points.length; i++) {
      const color = speedColor(points[i].speed_kmh, limit);
      const a: [number, number] = [points[i - 1].lat, points[i - 1].lng];
      const b: [number, number] = [points[i].lat, points[i].lng];
      const last = out[out.length - 1];
      if (last && last.color === color) last.path.push(b);
      else out.push({ color, path: [a, b] });
    }
    return out;
  }, [points, limit]);

  const dimOthers = Boolean(trip && points.length);
  const playPoint = playIndex !== null ? points[playIndex] : null;

  return (
    <>
      <MapContainer center={[26.84, 80.95]} zoom={12} className="map" zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Viewport vehicles={vehicles} selected={selectedVehicle} tripId={trip?.id ?? null} points={points} />

        {segments.map((s, i) => (
          <Polyline key={`casing-${i}`} positions={s.path} pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9, lineCap: 'round' }} />
        ))}
        {segments.map((s, i) => (
          <Polyline key={`seg-${i}`} positions={s.path} pathOptions={{ color: s.color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
        ))}

        {points.length > 1 && (
          <>
            <CircleMarker center={[points[0].lat, points[0].lng]} radius={7} pathOptions={{ color: '#12212e', weight: 3, fillColor: '#ffffff', fillOpacity: 1 }}>
              <Tooltip direction="top" offset={[0, -6]}>Start: {trip?.start_name}</Tooltip>
            </CircleMarker>
            {trip?.status === 'completed' && (
              <CircleMarker center={[points[points.length - 1].lat, points[points.length - 1].lng]} radius={7} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#12212e', fillOpacity: 1 }}>
                <Tooltip direction="top" offset={[0, -6]}>End: {trip?.end_name}</Tooltip>
              </CircleMarker>
            )}
          </>
        )}

        {playPoint && (
          <CircleMarker center={[playPoint.lat, playPoint.lng]} radius={9} pathOptions={{ color: '#12212e', weight: 3, fillColor: '#3ddc97', fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -8]}>{Math.round(playPoint.speed_kmh)} km/h</Tooltip>
          </CircleMarker>
        )}

        {vehicles.map((v) => {
          const selected = v.id === selectedVehicle?.id;
          return (
            <Marker
              key={v.id}
              position={[v.last_lat, v.last_lng]}
              icon={pinIcon(STATUS_META[v.status].color, selected)}
              opacity={dimOthers && !selected ? 0.35 : 1}
              zIndexOffset={selected ? 1000 : 0}
              eventHandlers={{ click: () => onSelectVehicle(v.id) }}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                <strong>{v.name}</strong> {v.status === 'moving' ? `${Math.round(v.last_speed_kmh)} km/h` : STATUS_META[v.status].label}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="legend" aria-label="Map legend">
        {trip ? (
          <>
            <span className="legend-title">Route speed</span>
            <span><i style={{ background: '#1f9d6b' }} />Within limit</span>
            <span><i style={{ background: '#e09a00' }} />Near limit</span>
            <span><i style={{ background: '#c8372d' }} />Over {limit} km/h</span>
          </>
        ) : (
          <>
            <span className="legend-title">Vehicle status</span>
            {(['moving', 'idle', 'parked', 'offline', 'maintenance'] as const).map((s) => (
              <span key={s}><i style={{ background: STATUS_META[s].color }} />{STATUS_META[s].label}</span>
            ))}
          </>
        )}
      </div>
    </>
  );
}