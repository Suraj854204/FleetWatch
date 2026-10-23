import type { Severity, VehicleStatus } from './types';

export const STATUS_META: Record<VehicleStatus, { label: string; color: string }> = {
  moving: { label: 'Moving', color: '#1f9d6b' },
  idle: { label: 'Idling', color: '#d98e04' },
  parked: { label: 'Parked', color: '#6b7a89' },
  offline: { label: 'Offline', color: '#c8372d' },
  maintenance: { label: 'In workshop', color: '#7b5ea7' },
};

export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
export const SEVERITY_COLOR: Record<Severity, string> = { critical: '#c8372d', warning: '#d98e04', info: '#4b7bb5' };

export const speedColor = (speed: number, limit: number) =>
  speed > limit ? '#c8372d' : speed > limit * 0.85 ? '#e09a00' : '#1f9d6b';

export const fmtNum = (n: number, d = 0) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

export function fmtDuration(min: number) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

export function timeAgo(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60 ? `${m % 60} min ` : ''}ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
}

export function fmtDateTime(iso: string, now: number) {
  const d = new Date(iso);
  const sameDay = new Date(now).toDateString() === d.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (sameDay) return `Today, ${time}`;
  const yest = new Date(now - 86400000).toDateString() === d.toDateString();
  if (yest) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}

export const fmtClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
