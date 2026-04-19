import type { FC } from 'react';
import { useMemo } from 'react';
import type { RadarPoint } from '../../types/scoring';

export interface HexRadarChartProps {
  /** One vertex per core dimension; order matches caller (typically `SIX_AXIS_METRICS`). */
  points: RadarPoint[];
  /** Outer ring corresponds to this numeric max (≥ largest axis value, typically ≥ 100). */
  scaleMax: number;
  className?: string;
  'aria-label'?: string;
}

/**
 * Presentational hex radar — purely maps `points` to geometry; data built in `logic/core` / hooks.
 */
export const HexRadarChart: FC<HexRadarChartProps> = ({
  points,
  scaleMax,
  className,
  'aria-label': ariaLabel,
}) => {
  const cx = 100;
  const cy = 100;
  const maxR = 72;
  const n = Math.max(points.length, 1);
  const denom = Math.max(scaleMax, 1e-6);

  const rings = useMemo(() => {
    const poly = (radius: number) =>
      Array.from({ length: n }, (_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ');

    return [1, 0.66, 0.33].map((m) => ({
      key: String(m),
      points: poly(maxR * m),
    }));
  }, [n]);

  const dataPolygon = useMemo(() => {
    const pts = points.map((p, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const raw = Math.max(0, Number(p.value) || 0);
      const clamped = Math.min(denom, raw);
      const r = maxR * (clamped / denom);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return pts.join(' ');
  }, [points, denom, n]);

  const spokeLines = useMemo(() => {
    return Array.from({ length: n }, (_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      return { x1: cx, y1: cy, x2: x, y2: y, key: i };
    });
  }, [n]);

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="200" height="200" className="fill-transparent" />
      {rings.map((ring) => (
        <polygon
          key={ring.key}
          className="fill-none stroke-zinc-500/35"
          strokeWidth={0.5}
          points={ring.points}
        />
      ))}
      {spokeLines.map((ln) => (
        <line
          key={ln.key}
          x1={ln.x1}
          y1={ln.y1}
          x2={ln.x2}
          y2={ln.y2}
          className="stroke-zinc-500/35"
          strokeWidth={0.5}
        />
      ))}
      <polygon
        points={dataPolygon}
        className="fill-accent-info/20 stroke-accent-primary"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={2} className="fill-accent-info" />
    </svg>
  );
};

export default HexRadarChart;
