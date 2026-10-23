import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Alert, Trip, TripPoint, Vehicle } from '../lib/types';

const POLL_MS = 30_000;

export function useFleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [v, t, a] = await Promise.all([
      supabase.from('vehicles').select('*').order('name'),
      supabase.from('trips').select('*').order('started_at', { ascending: false }).limit(500),
      supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }),
    ]);
    const err = v.error ?? t.error ?? a.error;
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setVehicles(v.data as Vehicle[]);
      setTrips(t.data as Trip[]);
      setAlerts(a.data as Alert[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const acknowledge = useCallback(async (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId)); // optimistic
    const { error: e } = await supabase
      .from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId);
    if (e) load(); // roll back by reloading
  }, [load]);

  return { vehicles, trips, alerts, loading, error, reload: load, acknowledge };
}

export function useTripPoints(tripId: string | null) {
  const cache = useRef(new Map<string, TripPoint[]>());
  const [state, setState] = useState<{ points: TripPoint[]; loading: boolean }>({ points: [], loading: false });

  useEffect(() => {
    if (!tripId) {
      setState({ points: [], loading: false });
      return;
    }
    const hit = cache.current.get(tripId);
    if (hit) {
      setState({ points: hit, loading: false });
      return;
    }
    let cancelled = false;
    setState({ points: [], loading: true });
    supabase
      .from('trip_points')
      .select('recorded_at,lat,lng,speed_kmh')
      .eq('trip_id', tripId)
      .order('recorded_at')
      .limit(5000)
      .then(({ data, error }) => {
        if (cancelled) return;
        const pts = error ? [] : (data as TripPoint[]);
        if (!error) cache.current.set(tripId, pts);
        setState({ points: pts, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return state;
}
