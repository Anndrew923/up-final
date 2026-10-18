import { useId, useMemo, type FC, type SVGProps } from 'react';
import type { RadarPkAxisWinner } from '../../logic/core/radarPkBattleReport';
import type { RadarPkCompareMotion } from '../../logic/core/radarPkClashMotion';
import { RADAR_DISPLAY_MIN, radarOverflowExtraRadius } from '../../logic/core/scoring';
import type { RadarChartPoint } from '../../types/radarDisplay';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';
import { buildRadarPkCompareStyleSheet } from './radarPkClashStyles';
import {
  getRadarPalette,
  RADAR_ATMOSPHERE_GLOW_OPACITY,
  RADAR_CARD_V2,
  RADAR_LASER_ALERT_PROFILE,
  RADAR_QUIET_PROFILE,
} from './radarVisualTokens';

export type HexRadarPoint = RadarChartPoint;

/** `ritual` = Home ceremony; `quiet` = PK combat plates (no scanner; keeps atmospheric depth). */
export type HexRadarPresentation = 'ritual' | 'quiet';

export interface HexRadarChartProps {
  /** One vertex per core dimension; order matches caller (typically `SIX_AXIS_METRICS`). */
  points: HexRadarPoint[];
  /**
   * Optional second polygon (e.g. “You” vs club mate) — gold clash outline, no entry animation.
   * WHY: Club detail compare must stay presentational; caller builds both score maps locally.
   */
  comparisonPoints?: HexRadarPoint[];
  /**
   * Per-axis clash winners — brightens winning quiet vertices (viewer / target / tie).
   * WHY: Presentational only; computed in `logic/core/radarPkBattleReport`.
   */
  axisWinners?: Partial<Record<SixAxisMetric, RadarPkAxisWinner>> | null;
  /**
   * PK compare choreography — enter unfolds from center; exit fades before unmount.
   * Omitted / null skips clash motion (ritual dual-layer stays static).
   */
  compareMotion?: RadarPkCompareMotion | null;
  /** Outer ring corresponds to this numeric max; radar card uses fixed 100. */
  scaleMax: number;
  /**
   * Visual density. Default `ritual` preserves Home laser polish;
   * `quiet` keeps radial pool + orbit depth but disables the scanner beam for PK clarity.
   */
  presentation?: HexRadarPresentation;
  /** 0–1 presentation-only scale for Home resonance charge (does not alter source scores). */
  ritualFill?: number;
  /** Skip stroke-draw / breathe entry loop (Home overlay — avoids ghosting with background chart). */
  suppressEntryAnimation?: boolean;
  /** 0–1 opacity for center grid wash (ritual boot fade-in). */
  gridFadeOpacity?: number;
  className?: string;
  'aria-label'?: string;
}
/**
 * Presentational hex radar — purely maps `points` to geometry; data built in `logic/core` / hooks.
 */
export const HexRadarChart: FC<HexRadarChartProps> = ({
  points,
  comparisonPoints,
  axisWinners = null,
  compareMotion = null,
  scaleMax,
  presentation = 'ritual',
  ritualFill = 1,
  suppressEntryAnimation = false,
  gridFadeOpacity = 1,
  className,
  'aria-label': ariaLabel,
}) => {
  type AxisLabelAnchor = NonNullable<SVGProps<SVGTextElement>['textAnchor']>;
  type AxisLabelBaseline = NonNullable<SVGProps<SVGTextElement>['dominantBaseline']>;

  const isQuiet = presentation === 'quiet';
  const auraGradientId = useId();
  const animationId = useId().replace(/:/g, '_');
  const cx = 100;
  const cy = 100;
  const maxR = RADAR_CARD_V2.geometry.outerRadius;
  const labelR = RADAR_CARD_V2.geometry.labelRadius;
  const n = Math.max(points.length, 1);
  const denom = Math.max(Math.min(scaleMax, RADAR_DISPLAY_MIN), 1e-6);
  const fill = Math.min(1, Math.max(0, Number(ritualFill) || 0));
  const gridOpacity = Math.min(1, Math.max(0, Number(gridFadeOpacity) || 0));
  const polygonAnimClass =
    isQuiet || suppressEntryAnimation
      ? ''
      : `radar-draw-${animationId} radar-breathe-${animationId}`;
  const overclockThreshold = 100;
  const polygonDashLength = 520;
  const orbitRingRadius = maxR + 6;
  const coreMetricSet = useMemo(() => new Set<string>(SIX_AXIS_METRICS), []);

  // Dominant-axis tint drives ritual laser + shared atmospheric pool/orbit for both modes.
  // WHY: Quiet still needs cyan depth; only the conic scanner is presentation-gated.
  const dominantKey = useMemo<SixAxisMetric | null>(() => {
    if (isQuiet) return null;
    let winner: { key: SixAxisMetric; value: number } | null = null;
    for (const point of points) {
      if (!coreMetricSet.has(point.key)) continue;
      const value = Math.max(0, Number(point.value) || 0);
      if (!winner || value > winner.value) {
        winner = { key: point.key as SixAxisMetric, value };
      }
    }
    return winner?.key ?? null;
  }, [coreMetricSet, isQuiet, points]);

  const dominantPalette = useMemo(() => getRadarPalette(dominantKey), [dominantKey]);

  const ritualGlowRgb = useMemo(() => {
    // Quiet locks cyan so PK atmosphere stays brand-stable (no dominant-axis hue drift).
    if (isQuiet) return '34,211,238';
    return (
      dominantPalette.glow
        .match(/\d+(\.\d+)?/g)
        ?.slice(0, 3)
        .join(',') ?? '34,211,238'
    );
  }, [dominantPalette.glow, isQuiet]);

  const auraPoolCore = `rgba(${ritualGlowRgb},${RADAR_ATMOSPHERE_GLOW_OPACITY})`;
  const calibrationRingStroke = `rgba(${ritualGlowRgb},${RADAR_ATMOSPHERE_GLOW_OPACITY})`;
  const scannerSweepPeak = `rgba(${ritualGlowRgb},0.28)`;

  const axisNodes = useMemo(
    () =>
      points.map((point, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const raw = Math.max(0, Number(point.value) || 0);
        const baseRadius = maxR * (Math.min(denom, raw) / denom) * fill;
        const overflowExtra = radarOverflowExtraRadius(raw) * fill;
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
          dominantBaseline: (uy > 0.45
            ? 'hanging'
            : uy < -0.45
              ? 'auto'
              : 'middle') as AxisLabelBaseline,
        };
      }),
    [cx, cy, denom, fill, labelR, maxR, n, points]
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

  /**
   * Comparison ring locks to primary vertex count (`n`) so axes stay registered with labels.
   * WHY: Divergent lengths would rotate the gold outline off the cyan member polygon.
   */
  const comparisonNodes = useMemo(() => {
    if (!comparisonPoints || comparisonPoints.length === 0) return null;
    return Array.from({ length: n }, (_, i) => {
      const point = comparisonPoints[i];
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const raw = Math.max(0, Number(point?.value) || 0);
      const baseRadius = maxR * (Math.min(denom, raw) / denom) * fill;
      return {
        key: point?.key ?? `cmp-${i}`,
        x: cx + baseRadius * Math.cos(angle),
        y: cy + baseRadius * Math.sin(angle),
      };
    });
  }, [comparisonPoints, cx, cy, denom, fill, maxR, n]);

  const comparisonPolygon = useMemo(() => {
    if (!comparisonNodes) return null;
    return comparisonNodes.map((node) => `${node.x.toFixed(2)},${node.y.toFixed(2)}`).join(' ');
  }, [comparisonNodes]);

  const overflowPolygon = useMemo(
    () =>
      axisNodes
        .map((node) => `${node.xOverflow.toFixed(2)},${node.yOverflow.toFixed(2)}`)
        .join(' '),
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
    <div
      className={`relative aspect-square w-full ${className ?? ''}`}
      data-radar-presentation={presentation}
    >
      {!isQuiet ? (
        <div
          data-testid="hex-radar-scanner"
          className="pointer-events-none absolute inset-[7%] aspect-square rounded-full motion-safe:transition-opacity motion-safe:duration-500 motion-reduce:transition-none"
          aria-hidden
          style={{
            background: `conic-gradient(from 180deg at 50% 50%, rgba(24,24,27,1) 0%, ${scannerSweepPeak} 50%, rgba(24,24,27,1) 100%)`,
            opacity: 0.88 * gridOpacity,
          }}
        />
      ) : null}
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 size-full motion-safe:transition-all motion-safe:duration-[560ms]"
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shared atmospheric pool — quiet PK keeps flagship depth; only scanner is gated. */}
          <radialGradient id={`${auraGradientId}-pool`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={auraPoolCore} />
            <stop offset="80%" stopColor="rgba(34,211,238,0)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </radialGradient>
          {!isQuiet ? (
            <radialGradient id={auraGradientId} cx="50%" cy="50%" r="62%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.1)" />
              <stop offset="70%" stopColor="rgba(56,189,248,0.22)" />
              <stop offset="100%" stopColor={RADAR_LASER_ALERT_PROFILE.polygon.edgeStop} />
            </radialGradient>
          ) : null}
        </defs>
        {!isQuiet ? (
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
            .radar-orbit-${animationId} {
              transform-box: fill-box;
              transform-origin: center;
              animation: radar-orbit-${animationId} 30s linear infinite;
              will-change: transform;
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
            @keyframes radar-orbit-${animationId} {
              to {
                transform: rotate(360deg);
              }
            }
          }
        `}
          </style>
        ) : null}
        {isQuiet && compareMotion ? (
          <style>{buildRadarPkCompareStyleSheet(animationId)}</style>
        ) : null}
        <rect width="200" height="200" className="fill-transparent" />
        {/* Depth layer shared by ritual + quiet — matte orbit stays static in quiet (no spin noise). */}
        <circle
          cx={cx}
          cy={cy}
          r={RADAR_CARD_V2.geometry.centerAuraRadius}
          fill={`url(#${auraGradientId}-pool)`}
          data-testid="hex-radar-atmosphere-pool"
          aria-hidden
        />
        <circle
          cx={cx}
          cy={cy}
          r={orbitRingRadius}
          fill="none"
          stroke={calibrationRingStroke}
          strokeWidth={0.5}
          strokeDasharray="4 8"
          data-testid="hex-radar-orbit-ring"
          className={
            isQuiet || suppressEntryAnimation ? '' : `radar-orbit-${animationId}`
          }
          aria-hidden
        />
        {rings.map((ring, index) => (
          <polygon
            key={ring.key}
            className={
              isQuiet
                ? index === 0
                  ? 'fill-none stroke-slate-500'
                  : 'fill-none stroke-zinc-700'
                : index === 0
                  ? 'fill-none stroke-zinc-700'
                  : 'fill-none stroke-zinc-800'
            }
            strokeOpacity={
              isQuiet
                ? index === 0
                  ? RADAR_QUIET_PROFILE.gridOuterOpacity
                  : RADAR_QUIET_PROFILE.gridInnerOpacity
                : index === 0
                  ? RADAR_CARD_V2.opacity.ringOuterStroke
                  : 0.2
            }
            strokeWidth={isQuiet ? RADAR_QUIET_PROFILE.gridStrokeWidth : 0.5}
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
            className={isQuiet ? 'stroke-zinc-700' : 'stroke-zinc-800'}
            strokeOpacity={isQuiet ? RADAR_QUIET_PROFILE.spokeStrokeOpacity : 0.2}
            strokeWidth={isQuiet ? RADAR_QUIET_PROFILE.gridStrokeWidth : 0.5}
          />
        ))}
        {hasOverflow ? (
          <polygon
            points={overflowPolygon}
            className="fill-accent-primary stroke-accent-info"
            fillOpacity={
              isQuiet
                ? RADAR_QUIET_PROFILE.overflowFillOpacity
                : RADAR_CARD_V2.opacity.overflowFill
            }
            strokeOpacity={
              isQuiet
                ? RADAR_QUIET_PROFILE.overflowStrokeOpacity
                : RADAR_CARD_V2.opacity.overflowStroke
            }
            strokeWidth={isQuiet ? RADAR_QUIET_PROFILE.overflowStrokeWidth : 1}
            strokeLinejoin="round"
            style={
              isQuiet ? undefined : { filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }
            }
          />
        ) : null}

        {isQuiet ? (
          <>
            <polygon
              data-testid="hex-radar-primary"
              points={dataPolygon}
              fill={RADAR_QUIET_PROFILE.primaryFill}
              stroke={RADAR_QUIET_PROFILE.primaryStroke}
              strokeWidth={RADAR_QUIET_PROFILE.primaryStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Micro edge highlight — crisp combat rim without ritual drop-shadow bloom. */}
            <polygon
              points={dataPolygon}
              fill="none"
              stroke={RADAR_QUIET_PROFILE.primaryHighlightStroke}
              strokeWidth={RADAR_QUIET_PROFILE.primaryHighlightWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={RADAR_QUIET_PROFILE.primaryHighlightOpacity}
            />
          </>
        ) : (
          <>
            <polygon
              points={dataPolygon}
              fill={`url(#${auraGradientId})`}
              stroke={RADAR_LASER_ALERT_PROFILE.polygon.stroke}
              className={polygonAnimClass}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fillOpacity={RADAR_LASER_ALERT_PROFILE.polygon.fillBreathMax}
              style={{
                filter:
                  'drop-shadow(0 0 12px rgba(34,211,238,0.9)) drop-shadow(0 0 4px rgba(34,211,238,1))',
              }}
            />
            <polygon
              points={dataPolygon}
              fill="none"
              stroke="#e0faff"
              className={suppressEntryAnimation ? '' : `radar-draw-${animationId}`}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
            />
          </>
        )}

        {axisNodes.map((node) => {
          if (isQuiet) {
            const targetWinsAxis =
              axisWinners?.[node.key as SixAxisMetric] === 'target';
            return (
              <g key={`axis-${node.key}`}>
                <circle
                  cx={node.xBase}
                  cy={node.yBase}
                  r={
                    targetWinsAxis
                      ? RADAR_QUIET_PROFILE.primaryVertexWinRadius
                      : RADAR_QUIET_PROFILE.primaryVertexRadius
                  }
                  fill={RADAR_QUIET_PROFILE.primaryVertexFill}
                  className={
                    targetWinsAxis && compareMotion === 'enter'
                      ? `radar-pk-win-pulse-${animationId}`
                      : undefined
                  }
                  style={
                    targetWinsAxis
                      ? { filter: RADAR_QUIET_PROFILE.vertexWinGlowPrimary }
                      : undefined
                  }
                />
                {node.overflowExtra > 0 ? (
                  <line
                    x1={node.xOuter}
                    y1={node.yOuter}
                    x2={node.xOverflow}
                    y2={node.yOverflow}
                    className="stroke-accent-info/50"
                    strokeWidth={RADAR_QUIET_PROFILE.overflowStrokeWidth}
                    strokeLinecap="round"
                  />
                ) : null}
                <text
                  x={node.xLabel}
                  y={node.yLabel}
                  textAnchor={node.textAnchor}
                  dominantBaseline={node.dominantBaseline}
                  className="fill-zinc-400 text-[7px] tracking-[0.12em]"
                  fillOpacity={RADAR_QUIET_PROFILE.labelFillOpacity}
                >
                  {node.label}
                </text>
              </g>
            );
          }

          const isOverclock = node.raw > overclockThreshold;
          const reactor = isOverclock
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
                style={
                  reactor.glow ? { filter: `drop-shadow(0 0 6px ${reactor.glow})` } : undefined
                }
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
              {node.overflowExtra > 0 ? (
                <circle
                  cx={node.xOverflow}
                  cy={node.yOverflow}
                  r={node.overflowExtra === maxOverflow ? 3 : 2.2}
                  className={
                    node.overflowExtra === maxOverflow ? 'fill-accent-info' : 'fill-accent-primary'
                  }
                  style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.62))' }}
                />
              ) : null}
              <text
                x={node.xLabel}
                y={node.yLabel}
                textAnchor={node.textAnchor}
                dominantBaseline={node.dominantBaseline}
                className="fill-zinc-300 text-[7px] tracking-[0.12em]"
                fillOpacity={RADAR_CARD_V2.opacity.label}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {comparisonPolygon ? (
          isQuiet ? (
            // Nested translate so CSS scale unfolds from radar center (100,100) without JS.
            <g transform={`translate(${cx} ${cy})`} data-testid="hex-radar-comparison-layer">
              <g
                data-compare-motion={compareMotion ?? 'enter'}
                className={
                  compareMotion === 'exit'
                    ? `radar-pk-compare-exit-${animationId}`
                    : `radar-pk-compare-enter-${animationId}`
                }
              >
                <g transform={`translate(${-cx} ${-cy})`}>
                  <polygon
                    data-testid="hex-radar-comparison"
                    points={comparisonPolygon}
                    fill={RADAR_QUIET_PROFILE.comparisonFill}
                    stroke={RADAR_QUIET_PROFILE.comparisonStroke}
                    strokeWidth={RADAR_QUIET_PROFILE.comparisonStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.95}
                  />
                  {comparisonNodes
                    ? comparisonNodes.map((node) => {
                        const viewerWinsAxis =
                          axisWinners?.[node.key as SixAxisMetric] === 'viewer';
                        return (
                          <g key={`cmp-dot-${node.key}`}>
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={
                                viewerWinsAxis
                                  ? RADAR_QUIET_PROFILE.comparisonVertexWinOuterRadius
                                  : RADAR_QUIET_PROFILE.comparisonVertexOuterRadius
                              }
                              fill={RADAR_QUIET_PROFILE.comparisonVertexOuter}
                              className={
                                viewerWinsAxis && compareMotion === 'enter'
                                  ? `radar-pk-win-pulse-${animationId}`
                                  : undefined
                              }
                              style={
                                viewerWinsAxis
                                  ? { filter: RADAR_QUIET_PROFILE.vertexWinGlowCompare }
                                  : undefined
                              }
                            />
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={
                                viewerWinsAxis
                                  ? RADAR_QUIET_PROFILE.comparisonVertexWinCoreRadius
                                  : RADAR_QUIET_PROFILE.comparisonVertexCoreRadius
                              }
                              fill={RADAR_QUIET_PROFILE.comparisonVertexCore}
                            />
                          </g>
                        );
                      })
                    : null}
                </g>
              </g>
            </g>
          ) : (
            <polygon
              data-testid="hex-radar-comparison"
              points={comparisonPolygon}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
            />
          )
        ) : null}

        {!isQuiet ? <circle cx={cx} cy={cy} r={2} className="fill-accent-info" /> : null}
      </svg>
    </div>
  );
};

export default HexRadarChart;
