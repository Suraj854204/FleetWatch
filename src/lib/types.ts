export type VehicleStatus = 'moving' | 'idle' | 'parked' | 'offline' | 'maintenance';
export type Severity = 'critical' | 'warning' | 'info';
export type AlertType = 'overspeed' | 'low_fuel' | 'low_battery' | 'offline' | 'maintenance' | 'excessive_idle';

export interface Vehicle {
  id: string;
  name: string;
  reg_number: string;
  make_model: string;
  vehicle_type: string;
  driver_name: string | null;
  status: VehicleStatus;
  ignition: boolean;
  fuel_pct: number;
  battery_v: number;
  odometer_km: number;
  speed_limit_kmh: number;
  last_lat: number;
  last_lng: number;
  last_speed_kmh: number;
  last_seen: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  driver_name: string | null;
  status: 'in_progress' | 'completed';
  started_at: string;
  ended_at: string | null;
  start_name: string;
  end_name: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance_km: number;
  duration_min: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  idle_min: number;
  halt_count: number;
  overspeed_count: number;
}

export interface TripPoint {
  recorded_at: string;
  lat: number;
  lng: number;
  speed_kmh: number;
}

export interface Alert {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  type: AlertType;
  severity: Severity;
  message: string;
  created_at: string;
  resolved: boolean;
}
