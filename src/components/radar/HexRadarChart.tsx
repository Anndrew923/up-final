import type { FC } from 'react';
import { useId, useMemo } from 'react';
import type { RadarPoint } from '../../types/scoring';
import { RADAR_DISPLAY_MIN, radarOverflowExtraRadius } from '../../logic/core/scoring';
import { RADAR_CARD_V2 } from './radarVisualTokens';
import type { SVGProps } from 'react';

export interface HexRadarChartProps {
  /** One vertex per core dimension; order matches caller (typically `SIX_AXIS_METRICS`). */
  points: RadarPoint[];
  /** Outer ring corresponds to this numeric max; radar card uses fixed 100. */
  scaleMax: number;
  weakestKey?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Presentational hex radar — purely maps `points` to geometry; data built in `logic/core` / hooks.
 */
export const HexRadarChart: FC<HexRadarChartProps> = ({
  points,
  scaleMax,
  weakestKey,
  className,
  'aria-label': ariaLabel,
}) => {
  type AxisLabelAnchor = NonNullable<SVGProps<SVGTextElement>['textAnchor']>;
  type AxisLabelBaseline = NonNullable<SVGProps<SVGTextElement>['dominantBaseline']>;

  const glowFilterId = useId();
  const cx = 100;
  const cy = 100;
  const maxR = RADAR_CARD_V2.geometry.outerRadius;
  const labelR = RADAR_CARD_V2.geometry.labelRadius;
  const n = Math.max(points.length, 1);
  const denom = Math.max(Math.min(scaleMax, RADAR_DISPLAY_MIN), 1e-6);

  const axisNodes = useMemo(
    () =>
      points.map((point, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const raw = Math.max(0, Number(point.value) || 0);
        const baseRadius = maxR * (Math.min(denom, raw) / denom);
        const overflowExtra = radarOverflowExtraRadius(raw);
        const xBase = cx + baseRadius * ux;
        const yBase = cy + baseRadius * uy;
        const xOuter = cx + maxR * ux;
        const yOuter = cy + maxR * uy;
        const xOverflow = cx + (maxR + overflowExtra) * ux;
        const yOverflow = cy + (maxR + overflowExtra) * uy;
        const xLabel = cx + labelR * ux;
        const yLabel = cy + labelR * uy;
        return {
          key: point.key,
          label: point.label,
          raw,
          overflowExtra,
          xBase,
          yBase,
          xOuter,
          yOuter,
          xOverflow,
          yOverflow,
          xLabel,
          yLabel,
          textAnchor: (ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle') as AxisLabelAnchor,
          dominantBaseline: (uy > 0.45 ? 'hanging' : uy < -0.45 ? 'auto' : 'middle') as AxisLabelBaseline,
        };
      }),
    [cx, cy, denom, labelR, maxR, n, points]
  );

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
  }, [maxR, n]);

  const dataPolygon = useMemo(
    () => axisNodes.map((node) => `${node.xBase.toFixed(2)},${node.yBase.toFixed(2)}`).join(' '),
    [axisNodes]
  );

  const overflowPolygon = useMemo(
    () => axisNodes.map((node) => `${node.xOverflow.toFixed(2)},${node.yOverflow.toFixed(2)}`).join(' '),
    [axisNodes]
  );

  const hasOverflow = useMemo(() => axisNodes.some((node) => node.overflowExtra > 0), [axisNodes]);
  const maxOverflow = useMemo(
    () => axisNodes.reduce((max, node) => Math.max(max, node.overflowExtra), 0),
    [axisNodes]
  );

  const spokeLines = useMemo(() => {
    return Array.from({ length: n }, (_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      return { x1: cx, y1: cy, x2: x, y2: y, key: i };
    });
  }, [cx, cy, maxR, n]);

  return (
    <svg
      viewBox="0 0 200 200"
      className={`${className ?? ''} motion-safe:transition-all motion-safe:duration-[560ms]`}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="200" height="200" className="fill-transparent" />
      <circle cx={cx} cy={cy} r={RADAR_CARD_V2.geometry.centerAuraRadius} className="fill-accent-info" fillOpacity={RADAR_CARD_V2.opacity.centerAura} />
      {rings.map((ring) => (
        <polygon
          key={ring.key}
          className="fill-none stroke-zinc-500"
          strokeOpacity={RADAR_CARD_V2.opacity.ringStroke}
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
          className="stroke-zinc-500"
          strokeOpacity={RADAR_CARD_V2.opacity.spokeStroke}
          strokeWidth={0.5}
        />
      ))}
      {hasOverflow ? (
        <polygon
          points={overflowPolygon}
          className="fill-accent-primary stroke-accent-info"
          fillOpacity={RADAR_CARD_V2.opacity.overflowFill}
          strokeOpacity={RADAR_CARD_V2.opacity.overflowStroke}
          strokeWidth={1}
          strokeLinejoin="round"
          filter={`url(#${glowFilterId})`}
        />
      ) : null}
      <polygon
        points={dataPolygon}
        className="fill-accent-info stroke-accent-primary"
        fillOpacity={RADAR_CARD_V2.opacity.baseFill}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      {axisNodes.map((node) => (
        <g key={`axis-${node.key}`}>
          {node.overflowExtra > 0 ? (
            <line
              x1={node.xOuter}
              y1={node.yOuter}
              x2={node.xOverflow}
              y2={node.yOverflow}
              className="stroke-accent-info/80"
              strokeWidth={node.overflowExtra === maxOverflow ? 1.8 : 1.2}
              strokeLinecap="round"
            />
          ) : null}
          <circle
            cx={node.xBase}
            cy={node.yBase}
            r={weakestKey === node.key ? 2.4 : 1.6}
            className={weakestKey === node.key ? 'fill-amber-300' : 'fill-accent-info/85'}
          />
          {weakestKey === node.key ? (
            <circle cx={node.xBase} cy={node.yBase} r={4.2} className="fill-none stroke-amber-300/70" strokeWidth={0.8} />
          ) : null}
          {node.overflowExtra > 0 ? (
            <circle
              cx={node.xOverflow}
              cy={node.yOverflow}
              r={node.overflowExtra === maxOverflow ? 3 : 2.2}
              className={node.overflowExtra === maxOverflow ? 'fill-accent-info' : 'fill-accent-primary'}
              filter={`url(#${glowFilterId})`}
            />
          ) : null}
          <text
            x={node.xLabel}
            y={node.yLabel}
            textAnchor={node.textAnchor}
            dominantBaseline={node.dominantBaseline}
            className="fill-zinc-400 text-[7px] tracking-[0.18em] uppercase"
            fillOpacity={RADAR_CARD_V2.opacity.label}
          >
            {node.label}
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={2} className="fill-accent-info" />
    </svg>
  );
};

export default HexRadarChart;
