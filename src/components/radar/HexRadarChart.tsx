import type { FC } from 'react';
import { useId, useMemo } from 'react';
import { RADAR_DISPLAY_MIN, radarOverflowExtraRadius } from '../../logic/core/scoring';
import type { SixAxisMetric } from '../../types/scoring';
import { RADAR_CARD_V2, RADAR_LASER_ALERT_PROFILE } from './radarVisualTokens';
import type { SVGProps } from 'react';

export interface HexRadarPoint {
  key: SixAxisMetric;
  label: string;
  value: number;
}

export interface HexRadarChartProps {
  /** One vertex per core dimension; order matches caller (typically `SIX_AXIS_METRICS`). */
  points: HexRadarPoint[];
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

  const auraGradientId = useId();
  const animationId = useId().replace(/:/g, '_');
  const cx = 100;
  const cy = 100;
  const maxR = RADAR_CARD_V2.geometry.outerRadius;
  const labelR = RADAR_CARD_V2.geometry.labelRadius;
  const n = Math.max(points.length, 1);
  const denom = Math.max(Math.min(scaleMax, RADAR_DISPLAY_MIN), 1e-6);
  const overclockThreshold = 100;
  const polygonDashLength = 520;

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
        <radialGradient id={auraGradientId} cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.1)" />
          <stop offset="70%" stopColor="rgba(56,189,248,0.22)" />
          <stop offset="100%" stopColor={RADAR_LASER_ALERT_PROFILE.polygon.edgeStop} />
        </radialGradient>
      </defs>
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .radar-draw-${animationId} {
              stroke-dasharray: ${polygonDashLength};
              stroke-dashoffset: ${polygonDashLength};
              animation: radar-draw-${animationId} ${RADAR_CARD_V2.animation.radarDrawMs}ms ease-out forwards;
              will-change: stroke-dashoffset;
            }
            .radar-breathe-${animationId} {
              animation: radar-breathe-${animationId} ${RADAR_CARD_V2.animation.radarBreathMs}ms ease-in-out infinite;
              will-change: fill-opacity;
            }
            @keyframes radar-draw-${animationId} {
              to {
                stroke-dashoffset: 0;
              }
            }
            @keyframes radar-breathe-${animationId} {
              0%, 100% {
                fill-opacity: ${RADAR_LASER_ALERT_PROFILE.polygon.fillBreathMax};
              }
              50% {
                fill-opacity: ${RADAR_LASER_ALERT_PROFILE.polygon.fillBreathMin};
              }
            }
          }
        `}
      </style>
      <rect width="200" height="200" className="fill-transparent" />
      <circle cx={cx} cy={cy} r={RADAR_CARD_V2.geometry.centerAuraRadius} className="fill-accent-info" fillOpacity={RADAR_CARD_V2.opacity.centerAura} />
      {rings.map((ring, index) => (
        <polygon
          key={ring.key}
          className={index === 0 ? 'fill-none stroke-zinc-700' : 'fill-none stroke-zinc-800'}
          strokeOpacity={index === 0 ? RADAR_CARD_V2.opacity.ringOuterStroke : RADAR_CARD_V2.opacity.ringStroke}
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
          className="stroke-zinc-800"
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
          style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }}
        />
      ) : null}
      <polygon
        points={dataPolygon}
        fill={`url(#${auraGradientId})`}
        stroke={RADAR_LASER_ALERT_PROFILE.polygon.stroke}
        className={`radar-draw-${animationId} radar-breathe-${animationId}`}
        strokeWidth={RADAR_LASER_ALERT_PROFILE.polygon.strokeWidth}
        strokeLinejoin="round"
        fillOpacity={RADAR_LASER_ALERT_PROFILE.polygon.fillBreathMax}
        style={{ filter: `drop-shadow(0 0 8px ${RADAR_LASER_ALERT_PROFILE.polygon.glow})` }}
      />
      {axisNodes.map((node) => {
        const isOverclock = node.raw > overclockThreshold;
        const isWeakest = weakestKey === node.key;
        const reactor = isWeakest
          ? {
              core: RADAR_LASER_ALERT_PROFILE.node.alertCore,
              ring: RADAR_LASER_ALERT_PROFILE.node.alertRing,
              glow: RADAR_LASER_ALERT_PROFILE.node.alertGlow,
            }
          : isOverclock
            ? {
                core: RADAR_LASER_ALERT_PROFILE.node.overclockCore,
                ring: RADAR_LASER_ALERT_PROFILE.node.overclockRing,
                glow: RADAR_LASER_ALERT_PROFILE.node.overclockGlow,
              }
            : {
                core: RADAR_LASER_ALERT_PROFILE.node.defaultCore,
                ring: RADAR_LASER_ALERT_PROFILE.node.defaultRing,
                glow: RADAR_LASER_ALERT_PROFILE.node.defaultGlow,
              };
        return (
          <g key={`axis-${node.key}`}>
            <circle
              cx={node.xBase}
              cy={node.yBase}
              r={4.2}
              fill="none"
              stroke={reactor.ring}
              strokeWidth={1.2}
            />
            <circle
              cx={node.xBase}
              cy={node.yBase}
              r={2.1}
              fill={reactor.core}
              style={reactor.glow ? { filter: `drop-shadow(0 0 6px ${reactor.glow})` } : undefined}
            />
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
            {weakestKey === node.key ? (
              <circle
                cx={node.xBase}
                cy={node.yBase}
                r={4.8}
                className="fill-none stroke-zinc-900/65"
                strokeWidth={0.8}
              />
            ) : null}
            {node.overflowExtra > 0 ? (
              <circle
                cx={node.xOverflow}
                cy={node.yOverflow}
                r={node.overflowExtra === maxOverflow ? 3 : 2.2}
                className={node.overflowExtra === maxOverflow ? 'fill-accent-info' : 'fill-accent-primary'}
                style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.62))' }}
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
        );
      })}
      <circle cx={cx} cy={cy} r={2} className="fill-accent-info" />
    </svg>
  );
};

export default HexRadarChart;
