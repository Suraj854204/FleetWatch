import type { MouseEvent } from 'react';
import type { TripPoint } from '../lib/types';
import { speedColor } from '../lib/format';

interface Props {
  points: TripPoint[];
  limit: number;
  playIndex: number | null;
  onHover: (index: number | null) => void;
}

const W = 320, H = 96, PAD_T = 8, PAD_B = 16;

export default function SpeedChart({ points, limit, playIndex, onHover }: Props) {
  if (points.length < 2) return null;
  const maxV = Math.max(limit * 1.25, ...points.map((p) => p.speed_kmh));
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => PAD_T + (1 - v / maxV) * (H - PAD_T - PAD_B);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.speed_kmh).toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H - PAD_B} L0 ${H - PAD_B} Z`;

  const move = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onHover(Math.round(f * (points.length - 1)));
  };

  return (
    <svg className="speed-chart" viewBox={`0 0 ${W} ${H}`} onMouseMove={move} onMouseLeave={() => onHover(null)} role="img" aria-label="Speed over the trip">
      <path d={area} fill="#12212e" fillOpacity=".06" />
      <line x1="0" x2={W} y1={y(limit)} y2={y(limit)} stroke="#c8372d" strokeDasharray="4 3" strokeWidth="1" />
      <text x={W - 2} y={y(limit) - 3} textAnchor="end" fontSize="9" fill="#c8372d">limit {limit}</text>
      <path d={line} fill="none" stroke="#12212e" strokeWidth="1.5" strokeLinejoin="round" />
      {points.map((p, i) => p.speed_kmh > limit && <circle key={i} cx={x(i)} cy={y(p.speed_kmh)} r="2.4" fill="#c8372d" />)}
      {playIndex !== null && points[playIndex] && (
        <g>
          <line x1={x(playIndex)} x2={x(playIndex)} y1={PAD_T} y2={H - PAD_B} stroke="#12212e" strokeWidth="1" />
          <circle cx={x(playIndex)} cy={y(points[playIndex].speed_kmh)} r="4" fill={speedColor(points[playIndex].speed_kmh, limit)} stroke="#12212e" strokeWidth="1.5" />
        </g>
      )}
      <text x="0" y={H - 3} fontSize="9" fill="#6b7a89">start</text>
      <text x={W} y={H - 3} fontSize="9" fill="#6b7a89" textAnchor="end">end</text>
    </svg>
  );
}
