// Generates supabase/seed.sql: 12 vehicles, ~70 trips, ~2.5k GPS points, alerts.
// All timestamps are written as "now() - interval", so data looks fresh when the seed is run.
//
//   node scripts/generate-seed.mjs            -> synthetic curved routes (offline, deterministic)
//   OSRM=1 node scripts/generate-seed.mjs     -> real road geometry from the public OSRM demo server
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'seed.sql');
const USE_OSRM = process.env.OSRM === '1';
const DT = 40; // seconds between GPS fixes

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261022);
const between = (a, b) => a + (b - a) * rnd();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const r1 = (n) => Math.round(n * 10) / 10;
const r6 = (n) => Math.round(n * 1e6) / 1e6;

// Approximate coordinates of well-known Lucknow locations.
const PLACES = {
  'Charbagh Railway Station': [26.8310, 80.9230],
  'Hazratganj': [26.8500, 80.9450],
  'Patrakarpuram, Gomti Nagar': [26.8570, 81.0010],
  'Amausi Airport': [26.7630, 80.8830],
  'Alambagh Bus Terminal': [26.8110, 80.9000],
  'Aminabad Market': [26.8420, 80.9230],
  'Indira Nagar': [26.8730, 80.9970],
  'Munshi Pulia': [26.8800, 80.9990],
  'Chinhat Industrial Area': [26.8700, 81.0600],
  'Lucknow University': [26.8640, 80.9230],
  'Telibagh': [26.7870, 80.9370],
  'Transport Nagar': [26.8000, 80.8750],
  'Kanpur Road Fleet Yard': [26.7900, 80.8800],
  'Vibhuti Khand': [26.8590, 81.0170],
  'Rajajipuram': [26.8240, 80.8800],
};
const NAMES = Object.keys(PLACES);

const VEHICLES = [
  { name: 'LKO-01', reg: 'UP32 KT 4821', mm: 'Tata Ace Gold', type: 'Mini truck', driver: 'Ramesh Yadav', status: 'moving', limit: 50, cruise: 32, fuel: 68, batt: 12.6, odo: 48210, aggr: 0.03, over: 10 },
  { name: 'LKO-02', reg: 'UP32 LN 1190', mm: 'Mahindra Bolero Pickup', type: 'Pickup', driver: 'Sandeep Verma', status: 'moving', limit: 60, cruise: 44, fuel: 54, batt: 12.4, odo: 91340, aggr: 0.22, over: 30 },
  { name: 'LKO-03', reg: 'UP32 HT 7733', mm: 'Eicher Pro 2049', type: 'Truck', driver: 'Mohd. Irfan', status: 'moving', limit: 50, cruise: 30, fuel: 41, batt: 12.7, odo: 132880, aggr: 0.04, over: 12 },
  { name: 'LKO-04', reg: 'UP32 MC 2058', mm: 'Maruti Eeco Cargo', type: 'Van', driver: 'Anil Mishra', status: 'idle', limit: 60, cruise: 38, fuel: 76, batt: 12.5, odo: 27640, aggr: 0.05, over: 10 },
  { name: 'LKO-05', reg: 'UP32 GD 6402', mm: 'Tata Intra V30', type: 'Pickup', driver: 'Vikas Pandey', status: 'parked', limit: 60, cruise: 40, fuel: 33, batt: 11.4, odo: 64010, aggr: 0.06, over: 14 },
  { name: 'LKO-06', reg: 'UP32 BX 3315', mm: 'Ashok Leyland Dost', type: 'Mini truck', driver: 'Deepak Tiwari', status: 'parked', limit: 55, cruise: 36, fuel: 58, batt: 12.3, odo: 78820, aggr: 0.04, over: 10 },
  { name: 'LKO-07', reg: 'UP32 PQ 9087', mm: 'Mahindra Jeeto', type: 'Mini truck', driver: 'Rajesh Gupta', status: 'parked', limit: 50, cruise: 30, fuel: 8, batt: 12.2, odo: 39950, aggr: 0.03, over: 8 },
  { name: 'LKO-08', reg: 'UP32 FR 5546', mm: 'Force Traveller', type: 'Passenger van', driver: 'Salman Ansari', status: 'offline', limit: 60, cruise: 42, fuel: 47, batt: 12.0, odo: 105420, aggr: 0.08, over: 16 },
  { name: 'LKO-09', reg: 'UP32 ZS 1672', mm: 'Mahindra Bolero Neo', type: 'SUV', driver: 'Neha Srivastava', status: 'maintenance', limit: 60, cruise: 40, fuel: 22, batt: 12.5, odo: 59300, aggr: 0.03, over: 8 },
  { name: 'LKO-10', reg: 'UP32 JV 8809', mm: 'Tata 407 Gold', type: 'Truck', driver: 'Kamlesh Kushwaha', status: 'moving', limit: 50, cruise: 31, fuel: 17, batt: 12.6, odo: 118760, aggr: 0.12, over: 22 },
  { name: 'LKO-11', reg: 'UP32 QA 2241', mm: 'Maruti Dzire Tour', type: 'Car', driver: 'Aman Saxena', status: 'parked', limit: 60, cruise: 42, fuel: 81, batt: 12.8, odo: 22140, aggr: 0.03, over: 8 },
  { name: 'LKO-12', reg: 'UP32 WE 4473', mm: 'Toyota Innova Crysta', type: 'Car', driver: 'Prakash Rawat', status: 'idle', limit: 60, cruise: 44, fuel: 62, batt: 12.4, odo: 41870, aggr: 0.08, over: 16 },
];

function hav([la1, ln1], [la2, ln2]) {
  const R = 6371000, p = Math.PI / 180;
  const a = Math.sin(((la2 - la1) * p) / 2) ** 2 + Math.cos(la1 * p) * Math.cos(la2 * p) * Math.sin(((ln2 - ln1) * p) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function syntheticRoute(a, b) {
  const [la1, ln1] = a, [la2, ln2] = b;
  const dx = la2 - la1, dy = ln2 - ln1;
  const off = between(-0.22, 0.22);
  const cx = (la1 + la2) / 2 - dy * off, cy = (ln1 + ln2) / 2 + dx * off;
  const phase = between(0, 6);
  const pts = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const w = Math.sin(t * Math.PI * 7 + phase) * 0.0005 * Math.sin(t * Math.PI);
    pts.push([u * u * la1 + 2 * u * t * cx + t * t * la2 + w, u * u * ln1 + 2 * u * t * cy + t * t * ln2 - w]);
  }
  return pts;
}

async function osrmRoute(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const json = await res.json();
  return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

async function getRoute(a, b) {
  if (USE_OSRM) {
    try { await new Promise((r) => setTimeout(r, 250)); return await osrmRoute(a, b); }
    catch { console.warn('OSRM failed, using synthetic route'); }
  }
  return syntheticRoute(a, b);
}

function simulate(path, v) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + hav(path[i - 1], path[i]));
  const total = cum[cum.length - 1];
  const posAt = (s) => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const f = Math.min(1, Math.max(0, (s - cum[i - 1]) / seg));
    return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f];
  };
  const pts = [{ t: 0, pos: posAt(0), speed: 0 }];
  let s = 0, t = 0, halt = 0, burst = 0, guard = 0;
  while (s < total && guard++ < 3000) {
    t += DT;
    let speed;
    if (halt > 0) { halt--; speed = 0; }
    else if (burst > 0) { burst--; speed = v.limit + between(4, v.over); }
    else if (rnd() < 0.045 && s > 300 && total - s > 300) { halt = Math.floor(between(1, 4)); speed = 0; }
    else if (rnd() < v.aggr) { burst = Math.floor(between(2, 6)); speed = v.limit + between(4, v.over); }
    else speed = Math.max(12, v.cruise + between(-10, 12));
    s += (speed / 3.6) * DT;
    const done = s >= total;
    pts.push({ t, pos: posAt(Math.min(s, total)), speed: done ? 0 : speed });
  }
  return pts.map((p) => ({ t: p.t, lat: r6(p.pos[0]), lng: r6(p.pos[1]), speed: r1(p.speed) }));
}

function tripStats(pts, limit) {
  let dist = 0;
  for (let i = 1; i < pts.length; i++) dist += hav([pts[i - 1].lat, pts[i - 1].lng], [pts[i].lat, pts[i].lng]);
  const durMin = pts[pts.length - 1].t / 60;
  let idleSteps = 0, halts = 0, over = 0, inHalt = false, inOver = false, max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const sp = pts[i].speed;
    max = Math.max(max, sp);
    if (sp < 2) { idleSteps++; if (!inHalt) halts++; inHalt = true; } else inHalt = false;
    if (sp > limit) { if (!inOver) over++; inOver = true; } else inOver = false;
  }
  return {
    distance_km: Math.round((dist / 1000) * 100) / 100,
    duration_min: r1(durMin),
    avg_speed_kmh: r1(durMin > 0 ? dist / 1000 / (durMin / 60) : 0),
    max_speed_kmh: r1(max),
    idle_min: r1((idleSteps * DT) / 60),
    halt_count: halts,
    overspeed_count: over,
  };
}

function pickNext(cur) {
  for (let i = 0; i < 60; i++) {
    const n = pick(NAMES);
    if (n === cur) continue;
    const d = hav(PLACES[cur], PLACES[n]) / 1000;
    if (d >= 3 && d <= 17) return n;
  }
  return pick(NAMES.filter((n) => n !== cur));
}

// ---- SQL helpers
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const ago = (sec) => `now() - interval '${Math.round(sec)} seconds'`;
let vCounter = 0, tCounter = 0;
const uuid = (prefix, n) => `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const vehicleRows = [], tripRows = [], pointRows = [], alertRows = [];

for (const v of VEHICLES) {
  const vid = uuid('a', ++vCounter);
  const nDone = { moving: 5, idle: 6, parked: 6, offline: 5, maintenance: 4 }[v.status];
  const nTrips = nDone + (v.status === 'moving' ? 1 : 0);

  let cur = v.status === 'maintenance' ? 'Kanpur Road Fleet Yard' : pick(NAMES);
  const built = [];
  for (let k = 0; k < nTrips; k++) {
    const next = pickNext(cur);
    const path = await getRoute(PLACES[cur], PLACES[next]);
    built.push({ from: cur, to: next, pts: simulate(path, v) });
    cur = next;
  }

  let completed = built, inProg = null, anchorEnd;
  if (v.status === 'moving') {
    const t = built[built.length - 1];
    const dur = t.pts[t.pts.length - 1].t;
    const T = Math.min(between(420, 1100), dur * 0.75);
    let idx = t.pts.findIndex((p) => p.t > T) - 1;
    while (idx > 3 && t.pts[idx].speed < 15) idx--;
    inProg = { ...t, pts: t.pts.slice(0, idx + 1) };
    inProg.startAgo = inProg.pts[idx].t + 20;
    completed = built.slice(0, -1);
    anchorEnd = inProg.startAgo + between(2400, 7200);
  } else {
    anchorEnd = { idle: 480, parked: between(5400, 18000), offline: 18000, maintenance: 93600 }[v.status];
  }

  const rows = [];
  for (let j = completed.length - 1; j >= 0; j--) {
    const t = completed[j];
    const durSec = t.pts[t.pts.length - 1].t;
    rows.unshift({ ...t, endAgo: anchorEnd, startAgo: anchorEnd + durSec, status: 'completed' });
    anchorEnd = anchorEnd + durSec + between(10800, 57600);
  }
  if (inProg) rows.push({ ...inProg, endAgo: null, status: 'in_progress' });

  for (const t of rows) {
    const id = uuid('b', ++tCounter);
    t.id = id;
    const st = tripStats(t.pts, v.limit);
    t.stats = st;
    const first = t.pts[0], last = t.pts[t.pts.length - 1];
    tripRows.push(`(${q(id)},${q(vid)},${q(v.driver)},${q(t.status)},${ago(t.startAgo)},${t.endAgo === null ? 'null' : ago(t.endAgo)},${q(t.from)},${q(t.to)},${first.lat},${first.lng},${t.status === 'completed' ? last.lat : PLACES[t.to][0]},${t.status === 'completed' ? last.lng : PLACES[t.to][1]},${st.distance_km},${st.duration_min},${st.avg_speed_kmh},${st.max_speed_kmh},${st.idle_min},${st.halt_count},${st.overspeed_count})`);
    for (const p of t.pts) pointRows.push(`(${q(id)},${q(vid)},${ago(t.startAgo - p.t)},${p.lat},${p.lng},${p.speed})`);
  }

  // Current vehicle state
  const lastTrip = rows[rows.length - 1];
  const lastPt = lastTrip.pts[lastTrip.pts.length - 1];
  const lastSeenAgo = { moving: 20, idle: 40, parked: between(120, 900), offline: 18000, maintenance: between(300, 1200) }[v.status];
  const ignition = v.status === 'moving' || v.status === 'idle';
  const speed = v.status === 'moving' ? lastPt.speed : 0;
  vehicleRows.push(`(${q(vid)},${q(v.name)},${q(v.reg)},${q(v.mm)},${q(v.type)},${q(v.driver)},${q(v.status)},${ignition},${v.fuel},${v.batt},${v.odo},${v.limit},${lastPt.lat},${lastPt.lng},${speed},${ago(lastSeenAgo)})`);

  // Alerts (open ones that an operator would care about)
  const alert = (type, severity, message, tripId, ageSec) =>
    alertRows.push(`(${q(vid)},${tripId ? q(tripId) : 'null'},${q(type)},${q(severity)},${q(message)},${ago(ageSec)})`);
  if (v.fuel < 20) alert('low_fuel', v.fuel < 10 ? 'critical' : 'warning', `Fuel at ${v.fuel}%. Refuel before the next dispatch.`, null, between(1800, 9000));
  if (v.batt < 11.8) alert('low_battery', 'warning', `Battery at ${v.batt} V, below the healthy 12.0-12.8 V range. Check the alternator or battery.`, null, between(3600, 20000));
  if (v.status === 'offline') alert('offline', 'critical', `No telemetry for 5 h. Last known position: ${lastTrip.to}.`, null, lastSeenAgo - 7200);
  if (v.status === 'maintenance') alert('maintenance', 'info', 'In workshop. Unavailable for dispatch.', null, 80000);
  for (const t of rows) {
    const age = t.endAgo ?? 0;
    if (t.startAgo > 172800) continue;
    if (t.stats.overspeed_count > 0) {
      const sev = t.stats.max_speed_kmh > v.limit + 25 ? 'critical' : 'warning';
      alert('overspeed', sev, `${t.stats.overspeed_count} overspeed event${t.stats.overspeed_count > 1 ? 's' : ''} on ${t.from} to ${t.to} (max ${t.stats.max_speed_kmh} km/h, limit ${v.limit}).`, t.id, age);
    }
    if (t.status === 'completed' && t.stats.idle_min >= 10 && t.stats.idle_min / t.stats.duration_min >= 0.25) {
      alert('excessive_idle', 'info', `Idled ${t.stats.idle_min} min of ${t.stats.duration_min} min on ${t.from} to ${t.to}.`, t.id, age);
    }
  }
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
let sql = `-- Generated by scripts/generate-seed.mjs. Run AFTER schema.sql. Re-running resets the demo data.\n`;
sql += `truncate table public.alerts, public.trip_points, public.trips, public.vehicles restart identity cascade;\n\n`;
sql += `insert into public.vehicles (id,name,reg_number,make_model,vehicle_type,driver_name,status,ignition,fuel_pct,battery_v,odometer_km,speed_limit_kmh,last_lat,last_lng,last_speed_kmh,last_seen) values\n${vehicleRows.join(',\n')};\n\n`;
sql += `insert into public.trips (id,vehicle_id,driver_name,status,started_at,ended_at,start_name,end_name,start_lat,start_lng,end_lat,end_lng,distance_km,duration_min,avg_speed_kmh,max_speed_kmh,idle_min,halt_count,overspeed_count) values\n${tripRows.join(',\n')};\n\n`;
for (const c of chunk(pointRows, 400)) sql += `insert into public.trip_points (trip_id,vehicle_id,recorded_at,lat,lng,speed_kmh) values\n${c.join(',\n')};\n\n`;
sql += `insert into public.alerts (vehicle_id,trip_id,type,severity,message,created_at) values\n${alertRows.join(',\n')};\n`;
writeFileSync(OUT, sql);
console.log(`vehicles ${vehicleRows.length}, trips ${tripRows.length}, points ${pointRows.length}, alerts ${alertRows.length} -> ${OUT} (${Math.round(sql.length / 1024)} KB)`);
