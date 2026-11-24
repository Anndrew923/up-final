import { useId, useState, type FC, type KeyboardEvent } from 'react';
import { scienceAxes } from '../data/scienceData';
import {
  computeRadarPreviewGeometry,
  formatAxisScoreReadout,
  formatRadarPolygonAttr,
} from '../lib/radarPreviewGeometry';
import { RADAR_PREVIEW } from '../lib/radarPreviewTokens';

type ViewMode = 'physique' | 'telemetry';

/**
 * Demo scores — marketing preview only.
 * WHY: At most two axes break 100 so the elite century reads as rare, not average.
 */
const DEMO_SCORES: Record<string, number> = {
  strength: 106,
  explosivePower: 86,
  cardio: 81,
  muscleMass: 92,
  bodyFat: 94,
  gripStrength: 108,
};

const AXES = scienceAxes.map((axis) => ({
  key: axis.id,
  physiqueLabel: axis.titleZh,
  telemetryLabel: axis.telemetryShort,
  telemetryCode: axis.telemetryCode,
  score: DEMO_SCORES[axis.id] ?? 80,
}));

const { size: SIZE, outerRadius: MAX_R, labelRadius: LABEL_R, centerAuraRadius, orbitPad } =
  RADAR_PREVIEW.geometry;
const CX = SIZE / 2;
const CY = SIZE / 2;

/** Static demo geometry — scores are marketing fixtures, not live telemetry. */
const GEOMETRY = computeRadarPreviewGeometry({
  points: AXES.map((axis) => ({
    key: axis.key,
    label: axis.physiqueLabel,
    value: axis.score,
  })),
  cx: CX,
  cy: CY,
  outerRadius: MAX_R,
  labelRadius: LABEL_R,
});

const RING_POINTS = [1, 0.66, 0.33].map((scale) =>
  formatRadarPolygonAttr(
    GEOMETRY.hexagon.map((p) => ({
      x: CX + (p.x - CX) * scale,
      y: CY + (p.y - CY) * scale,
    })),
  ),
);

const SCORE_POINTS = formatRadarPolygonAttr(GEOMETRY.scorePolygon);
const OVERFLOW_POINTS = formatRadarPolygonAttr(GEOMETRY.overflowPolygon);
const ORBIT_R = MAX_R + orbitPad;

const OVERALL = formatAxisScoreReadout(
  Math.round((AXES.reduce((s, a) => s + a.score, 0) / AXES.length) * 100) / 100,
);

type GlowShadow = { stdDeviation: number; floodColor: string };

const BoundedGlowFilter: FC<{
  id: string;
  shadows: readonly GlowShadow[];
}> = ({ id, shadows }) => (
  <filter
    id={id}
    filterUnits="userSpaceOnUse"
    x={RADAR_PREVIEW.filterRegion.x}
    y={RADAR_PREVIEW.filterRegion.y}
    width={RADAR_PREVIEW.filterRegion.width}
    height={RADAR_PREVIEW.filterRegion.height}
    colorInterpolationFilters="sRGB"
  >
    {shadows.map((shadow, index) => (
      <feDropShadow
        key={`${shadow.floodColor}-${shadow.stdDeviation}-${index}`}
        dx={0}
        dy={0}
        stdDeviation={shadow.stdDeviation}
        floodColor={shadow.floodColor}
        floodOpacity={1}
      />
    ))}
  </filter>
);

export function RadarPreview() {
  const [mode, setMode] = useState<ViewMode>('physique');
  const uid = useId().replace(/:/g, '');
  const anim = `rp-${uid}`;

  const onModeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: ViewMode =
      event.key === 'ArrowLeft' ? 'physique' : 'telemetry';
    setMode(next);
    // WHY: roving tabindex — move focus with the checked radio after arrow keys.
    requestAnimationFrame(() => {
      event.currentTarget
        .querySelector<HTMLElement>(`[data-radar-mode="${next}"]`)
        ?.focus();
    });
  };

  const g = RADAR_PREVIEW.glow;
  const laser = RADAR_PREVIEW.laser;
  const node = RADAR_PREVIEW.node;
  const dash = RADAR_PREVIEW.polygonDashLength;

  return (
    <div className="ui-panel relative overflow-x-hidden p-3 sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-16 right-0 h-36 w-36 rounded-full bg-energy/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-2 min-w-0 sm:mb-3">
        <p className="ui-kicker-zh whitespace-nowrap">雷達即時預覽 · 示範數據</p>
        <p className="mt-0.5 font-mono text-xs text-zinc-400">
          綜合戰力{' '}
          <span className="font-semibold text-cyan-300">{OVERALL}</span>
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[min(100%,340px)] lg:max-h-[280px]">
        <div
          className="pointer-events-none absolute inset-[8%] aspect-square rounded-full opacity-70"
          aria-hidden
          style={{ background: RADAR_PREVIEW.atmosphere.scannerConic }}
        />

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative z-10 mx-auto h-auto w-full max-w-full lg:max-h-[280px]"
          role="img"
          aria-label={`六軸雷達預覽，綜合戰力 ${OVERALL}`}
        >
          <defs>
            <radialGradient id={`${uid}-pool`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={RADAR_PREVIEW.atmosphere.poolPeak} />
              <stop offset="80%" stopColor="rgba(34,211,238,0)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </radialGradient>
            <radialGradient id={`${uid}-fill`} cx="50%" cy="50%" r="62%">
              <stop offset="0%" stopColor={laser.auraStops[0]} />
              <stop offset="70%" stopColor={laser.auraStops[1]} />
              <stop offset="100%" stopColor={laser.edgeStop} />
            </radialGradient>
            <BoundedGlowFilter
              id={`${uid}-poly-glow`}
              shadows={[
                { stdDeviation: g.polyOuterStd, floodColor: g.polyOuter },
                { stdDeviation: g.polyInnerStd, floodColor: g.polyInner },
              ]}
            />
            <BoundedGlowFilter
              id={`${uid}-overflow-glow`}
              shadows={[{ stdDeviation: g.overflowStd, floodColor: g.overflow }]}
            />
            <BoundedGlowFilter
              id={`${uid}-overflow-vertex`}
              shadows={[
                {
                  stdDeviation: g.overflowVertexStd,
                  floodColor: g.overflowVertex,
                },
              ]}
            />
            <BoundedGlowFilter
              id={`${uid}-reactor`}
              shadows={[
                { stdDeviation: g.reactorStd, floodColor: node.defaultGlow },
              ]}
            />
            <BoundedGlowFilter
              id={`${uid}-reactor-oc`}
              shadows={[
                { stdDeviation: g.reactorStd, floodColor: node.overclockGlow },
              ]}
            />
          </defs>

          <style>
            {`
              @media (prefers-reduced-motion: no-preference) {
                .${anim}-poly {
                  stroke-dasharray: ${dash};
                  stroke-dashoffset: ${dash};
                  animation:
                    ${anim}-draw ${RADAR_PREVIEW.animation.drawMs}ms ease-out forwards,
                    ${anim}-breathe ${RADAR_PREVIEW.animation.breathMs}ms ease-in-out ${RADAR_PREVIEW.animation.drawMs}ms infinite;
                }
                .${anim}-stroke {
                  stroke-dasharray: ${dash};
                  stroke-dashoffset: ${dash};
                  animation: ${anim}-draw ${RADAR_PREVIEW.animation.drawMs}ms ease-out forwards;
                }
                .${anim}-orbit {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: ${anim}-orbit 30s linear infinite;
                }
                .${anim}-lexicon {
                  animation: ${anim}-lexicon ${RADAR_PREVIEW.animation.lexiconMs}ms ease-out;
                }
                @keyframes ${anim}-draw {
                  to { stroke-dashoffset: 0; }
                }
                @keyframes ${anim}-breathe {
                  0%, 100% { fill-opacity: ${laser.fillBreathMax}; }
                  50% { fill-opacity: ${laser.fillBreathMin}; }
                }
                @keyframes ${anim}-orbit {
                  to { transform: rotate(360deg); }
                }
                @keyframes ${anim}-lexicon {
                  from { opacity: 0.35; }
                  to { opacity: 1; }
                }
              }
            `}
          </style>

          <circle
            cx={CX}
            cy={CY}
            r={centerAuraRadius}
            fill={`url(#${uid}-pool)`}
            aria-hidden
          />
          <circle
            cx={CX}
            cy={CY}
            r={ORBIT_R}
            fill="none"
            stroke={RADAR_PREVIEW.atmosphere.orbitStroke}
            strokeWidth={0.7}
            strokeDasharray="5 9"
            className={`${anim}-orbit`}
            aria-hidden
          />

          {RING_POINTS.map((points, index) => (
            <polygon
              key={index}
              points={points}
              fill="none"
              stroke={
                index === 0
                  ? RADAR_PREVIEW.grid.outerStroke
                  : RADAR_PREVIEW.grid.innerStroke
              }
              strokeOpacity={
                index === 0
                  ? RADAR_PREVIEW.opacity.ringOuter
                  : RADAR_PREVIEW.opacity.ringInner
              }
              strokeWidth={0.7}
              strokeDasharray={index === 0 ? '5 4' : undefined}
            />
          ))}

          {GEOMETRY.hexagon.map((p, i) => (
            <line
              key={`spoke-${i}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={RADAR_PREVIEW.grid.innerStroke}
              strokeOpacity={RADAR_PREVIEW.opacity.spoke}
              strokeWidth={0.7}
            />
          ))}

          {GEOMETRY.hasOverflow ? (
            <polygon
              points={OVERFLOW_POINTS}
              fill={RADAR_PREVIEW.overflow.fill}
              stroke={RADAR_PREVIEW.overflow.stroke}
              fillOpacity={RADAR_PREVIEW.opacity.overflowFill}
              strokeOpacity={RADAR_PREVIEW.opacity.overflowStroke}
              strokeWidth={1.2}
              strokeLinejoin="round"
              filter={`url(#${uid}-overflow-glow)`}
            />
          ) : null}

          <polygon
            points={SCORE_POINTS}
            fill={`url(#${uid}-fill)`}
            stroke={laser.stroke}
            strokeWidth={laser.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fillOpacity={laser.fillBreathMax}
            filter={`url(#${uid}-poly-glow)`}
            className={`${anim}-poly`}
          />
          <polygon
            points={SCORE_POINTS}
            fill="none"
            stroke={laser.highlight}
            strokeWidth={laser.highlightWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
            className={`${anim}-stroke`}
          />

          {GEOMETRY.vertices.map((vertex) => {
            const isOc = vertex.raw > 100;
            const reactor = isOc
              ? {
                  core: node.overclockCore,
                  ring: node.overclockRing,
                  filter: `${uid}-reactor-oc`,
                }
              : {
                  core: node.defaultCore,
                  ring: node.defaultRing,
                  filter: `${uid}-reactor`,
                };
            return (
              <g key={`node-${vertex.key}`}>
                <circle
                  cx={vertex.xBase}
                  cy={vertex.yBase}
                  r={node.ringR}
                  fill="none"
                  stroke={reactor.ring}
                  strokeWidth={1.4}
                />
                <circle
                  cx={vertex.xBase}
                  cy={vertex.yBase}
                  r={node.coreR}
                  fill={reactor.core}
                  filter={`url(#${reactor.filter})`}
                />
                {vertex.overflowExtra > 0 ? (
                  <>
                    <line
                      x1={vertex.xOuter}
                      y1={vertex.yOuter}
                      x2={vertex.xOverflow}
                      y2={vertex.yOverflow}
                      stroke={RADAR_PREVIEW.overflow.burstStroke}
                      strokeWidth={
                        vertex.overflowExtra === GEOMETRY.maxOverflowExtra
                          ? 2
                          : 1.4
                      }
                      strokeLinecap="round"
                    />
                    <circle
                      cx={vertex.xOverflow}
                      cy={vertex.yOverflow}
                      r={
                        vertex.overflowExtra === GEOMETRY.maxOverflowExtra
                          ? node.tipMaxR
                          : node.tipR
                      }
                      fill={RADAR_PREVIEW.overflow.tipFill}
                      filter={`url(#${uid}-overflow-vertex)`}
                    />
                  </>
                ) : null}
              </g>
            );
          })}

          <g key={mode} className={`${anim}-lexicon`}>
            {GEOMETRY.vertices.map((vertex, i) => {
              const axis = AXES[i];
              const title =
                mode === 'physique' ? axis.physiqueLabel : axis.telemetryLabel;
              // WHY: Match App HUD — axis readout is bare numerals only (no "OC" suffix).
              const scoreText = formatAxisScoreReadout(axis.score);
              const sub =
                mode === 'telemetry'
                  ? `${axis.telemetryCode} · ${scoreText}`
                  : scoreText;
              const subFill =
                axis.score > 100
                  ? RADAR_PREVIEW.label.scoreOverclock
                  : RADAR_PREVIEW.label.scoreMuted;
              // WHY: Always middle-anchor dual-line ZH labels — directional
              // anchors (app single-line) would clip on 375–430px marketing canvas.
              return (
                <g key={`label-${vertex.key}`}>
                  <text
                    x={vertex.xLabel}
                    y={vertex.yLabel - 2}
                    textAnchor="middle"
                    fill={RADAR_PREVIEW.label.title}
                    fillOpacity={RADAR_PREVIEW.opacity.label}
                    fontSize={mode === 'telemetry' ? 9 : 9.5}
                    fontFamily={
                      mode === 'telemetry'
                        ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
                        : 'Inter, system-ui, sans-serif'
                    }
                    fontWeight={600}
                    letterSpacing={mode === 'telemetry' ? '0.04em' : '0.02em'}
                  >
                    {title}
                  </text>
                  <text
                    x={vertex.xLabel}
                    y={vertex.yLabel + 11}
                    textAnchor="middle"
                    fill={subFill}
                    fontSize={8.5}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontWeight={axis.score > 100 ? 600 : 400}
                  >
                    {sub}
                  </text>
                </g>
              );
            })}
          </g>

          <circle cx={CX} cy={CY} r={2.4} fill={RADAR_PREVIEW.centerDot} />
        </svg>
      </div>

      {/*
        WHY: Switch sits under the radar (not under the score) so the tactile
        track → DeveloperHobbyBanner「遙測頻譜」CTA reads as one vertical path.
        Grey legend removed — mode chrome carries the elite/overclock cue.
      */}
      <div className="relative mt-3 flex justify-center sm:mt-3.5">
        <div
          className="inline-flex w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950/90 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)] sm:w-auto"
          role="radiogroup"
          aria-label="雷達視圖切換"
          onKeyDown={onModeKeyDown}
        >
          <ModeButton
            modeId="physique"
            active={mode === 'physique'}
            onClick={() => setMode('physique')}
            label="體能指標"
            tone="energy"
          />
          <ModeButton
            modeId="telemetry"
            active={mode === 'telemetry'}
            onClick={() => setMode('telemetry')}
            label="遙測頻譜"
            tone="amber"
          />
        </div>
        <p className="sr-only" aria-live="polite">
          目前視圖：{mode === 'physique' ? '體能指標' : '遙測頻譜'}
        </p>
      </div>
    </div>
  );
}

type ModeTone = 'energy' | 'amber';

const MODE_TONE_ACTIVE: Record<ModeTone, { segment: string; dot: string }> = {
  energy: {
    segment:
      'border-energy/50 bg-energy/15 text-energy shadow-[0_0_16px_-4px_rgba(0,191,255,0.55),inset_0_1px_0_0_rgba(125,211,252,0.25)]',
    dot: 'bg-energy shadow-[0_0_8px_rgba(0,191,255,0.85)]',
  },
  amber: {
    segment:
      'border-amber-400/55 bg-amber-500/15 text-amber-300 shadow-[0_0_16px_-4px_rgba(245,158,11,0.5),inset_0_1px_0_0_rgba(252,211,77,0.22)]',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
  },
};

/**
 * Tactile telemetry segment — recessed track + lit indicator when pressed.
 * WHY: Flat zinc pills had weak mode feedback; energy/amber glow maps to
 * physique vs vehicle spectrum without changing demo scores.
 */
function ModeButton({
  modeId,
  active,
  onClick,
  label,
  tone,
}: {
  modeId: ViewMode;
  active: boolean;
  onClick: () => void;
  label: string;
  tone: ModeTone;
}) {
  const chrome = MODE_TONE_ACTIVE[tone];

  return (
    <button
      type="button"
      role="radio"
      data-radar-mode={modeId}
      onClick={onClick}
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition duration-200 sm:min-w-[7.5rem] sm:flex-none sm:px-4 ${
        active
          ? chrome.segment
          : 'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-300'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full transition duration-200 ${
          active ? chrome.dot : 'bg-zinc-600'
        }`}
        aria-hidden
      />
      {label}
    </button>
  );
}
