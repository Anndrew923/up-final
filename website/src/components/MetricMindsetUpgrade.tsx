import type { ReactElement } from 'react';

/**
 * Homepage「指標觀念升級」— side-by-side visual contrast cards.
 * WHY: Wordy left-copy + mini gauges diluted the analogy; pure glowing ring vs
 * six-axis radar (with one-line captions) mirrors「體脂率 ↔ 六軸戰力」at a glance.
 */

type MetricSpectrum = 'amber' | 'energy';

interface ContrastCard {
  spectrum: MetricSpectrum;
  kicker: string;
  title: string;
}

const CARDS: readonly ContrastCard[] = [
  {
    spectrum: 'amber',
    kicker: '瘦身 · 體脂率',
    title: '看體脂，不只體重',
  },
  {
    spectrum: 'energy',
    kicker: '訓練 · 六軸戰力',
    title: '看六軸，不只單項',
  },
];

const SPECTRUM = {
  amber: {
    wash: 'from-amber-500/18 via-transparent to-transparent',
    border: 'border-amber-400/35',
    kicker: 'text-amber-300/90',
    accent: '#fbbf24',
    accentSoft: 'rgba(251,191,36,0.35)',
    accentFill: 'rgba(251,191,36,0.2)',
    accentDim: 'rgba(251,191,36,0.12)',
  },
  energy: {
    wash: 'from-energy/20 via-transparent to-transparent',
    border: 'border-energy/35',
    kicker: 'text-energy/90',
    accent: '#00bfff',
    accentSoft: 'rgba(0,191,255,0.4)',
    accentFill: 'rgba(0,191,255,0.18)',
  },
} as const;

/** Shared diagram stage — no nested chrome frame; glyph breathes on the card. */
const DIAGRAM_STAGE =
  'relative mx-auto flex aspect-square w-full max-w-[9.5rem] items-center justify-center sm:max-w-[11rem]';

const RING_CX = 64;
const RING_CY = 64;
const RING_R = 42;
const RING_STROKE = 11;
const RING_C = 2 * Math.PI * RING_R;
/** Fat arc ≈ 34% — visual stand-in for composition split, not a live metric. */
const RING_FAT = RING_C * 0.34;
const RING_LEAN = RING_C - RING_FAT;
const RING_ROTATE = `rotate(-90 ${RING_CX} ${RING_CY})`;

/** Amber — dual-segment composition ring (fat arc + lean arc). */
function CompositionRingDiagram() {
  const { accent, accentSoft, accentDim } = SPECTRUM.amber;

  return (
    <div className={DIAGRAM_STAGE} aria-hidden>
      <svg
        viewBox="0 0 128 128"
        className="h-full w-full drop-shadow-[0_0_18px_rgba(251,191,36,0.28)]"
      >
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke={accentDim}
          strokeWidth={RING_STROKE}
          strokeDasharray={`${RING_LEAN} ${RING_FAT}`}
          strokeDashoffset={-RING_FAT}
          strokeLinecap="butt"
          transform={RING_ROTATE}
        />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke={accent}
          strokeWidth={RING_STROKE}
          strokeDasharray={`${RING_FAT} ${RING_LEAN}`}
          strokeLinecap="butt"
          transform={RING_ROTATE}
          style={{ filter: `drop-shadow(0 0 6px ${accentSoft})` }}
        />
        <circle cx={RING_CX} cy={RING_CY} r="18" fill="rgba(9,9,11,0.85)" />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r="18"
          fill="none"
          stroke={accentSoft}
          strokeWidth="1.2"
        />
        <circle cx={RING_CX} cy={RING_CY} r="3.2" fill={accent} />
      </svg>
    </div>
  );
}

const RADAR_CX = 64;
const RADAR_CY = 64;
const RADAR_OUTER = 46;
const RADAR_FACE_R = 34;
const RADAR_FACE_SCALES = [0.92, 0.7, 0.85, 0.62, 0.78, 0.88] as const;

function hexRingPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

const HEX_OUTER = hexRingPoints(RADAR_CX, RADAR_CY, RADAR_OUTER);
const HEX_MID = hexRingPoints(RADAR_CX, RADAR_CY, RADAR_OUTER * 0.66);
const HEX_INNER = hexRingPoints(RADAR_CX, RADAR_CY, RADAR_OUTER * 0.33);
const HEX_SPOKES = Array.from({ length: 6 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return {
    x2: RADAR_CX + RADAR_OUTER * Math.cos(a),
    y2: RADAR_CY + RADAR_OUTER * Math.sin(a),
  };
});
const COMBAT_FACE = RADAR_FACE_SCALES.map((scale, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return `${RADAR_CX + RADAR_FACE_R * scale * Math.cos(a)},${RADAR_CY + RADAR_FACE_R * scale * Math.sin(a)}`;
}).join(' ');
const COMBAT_NODES = RADAR_FACE_SCALES.map((scale, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return {
    cx: RADAR_CX + RADAR_FACE_R * scale * Math.cos(a),
    cy: RADAR_CY + RADAR_FACE_R * scale * Math.sin(a),
  };
});

/** Energy — concentric hex grid + lit six-axis combat polygon. */
function SixAxisRadarDiagram() {
  const { accent, accentSoft, accentFill } = SPECTRUM.energy;

  return (
    <div className={DIAGRAM_STAGE} aria-hidden>
      <svg
        viewBox="0 0 128 128"
        className="h-full w-full drop-shadow-[0_0_18px_rgba(0,191,255,0.3)]"
      >
        <polygon
          points={HEX_OUTER}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <polygon
          points={HEX_MID}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.9"
        />
        <polygon
          points={HEX_INNER}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
        />
        {HEX_SPOKES.map((spoke, i) => (
          <line
            key={i}
            x1={RADAR_CX}
            y1={RADAR_CY}
            x2={spoke.x2}
            y2={spoke.y2}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
          />
        ))}
        <polygon
          points={COMBAT_FACE}
          fill={accentFill}
          stroke={accent}
          strokeWidth="1.8"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 8px ${accentSoft})` }}
        />
        {COMBAT_NODES.map((node, i) => (
          <circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r="2.6"
            fill={accent}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.6"
          />
        ))}
        <circle cx={RADAR_CX} cy={RADAR_CY} r="2.4" fill={accent} />
      </svg>
    </div>
  );
}

const DIAGRAM_BY_SPECTRUM: Record<MetricSpectrum, () => ReactElement> = {
  amber: CompositionRingDiagram,
  energy: SixAxisRadarDiagram,
};

export function MetricMindsetUpgrade() {
  return (
    <section
      className="border-y border-white/15 bg-steel ui-section"
      aria-labelledby="metric-mindset-heading"
    >
      <div className="ui-container">
        <div className="ui-section-head">
          <p className="ui-kicker-zh-amber">指標觀念升級</p>
          <h2
            id="metric-mindset-heading"
            className="mt-2 text-balance font-serif text-xl leading-snug text-zinc-100 sm:mt-3 sm:text-3xl"
          >
            如同瘦身必須量體脂率，訓練也要導入精準指標。
          </h2>
        </div>

        {/*
          WHY: Always 2-up — title analogy is 1:1; stacked cards broke the rhyme
          on phone. Diagram dominates; caption is one locked line under.
        */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-6">
          {CARDS.map((card) => {
            const tone = SPECTRUM[card.spectrum];
            const Diagram = DIAGRAM_BY_SPECTRUM[card.spectrum];
            return (
              <li
                key={card.spectrum}
                className={`relative overflow-hidden rounded-xl border bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black px-2.5 pb-3.5 pt-4 sm:px-5 sm:pb-5 sm:pt-6 ${tone.border}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${tone.wash}`}
                  aria-hidden
                />

                <div className="relative flex flex-col items-center">
                  <div className="flex w-full items-center justify-center py-1 sm:py-2">
                    <Diagram />
                  </div>
                  <div className="mt-2 w-full min-w-0 text-center sm:mt-3">
                    <p
                      className={`truncate font-mono text-[9px] tracking-wide sm:text-[11px] ${tone.kicker}`}
                    >
                      {card.kicker}
                    </p>
                    {/* WHY: truncate + whitespace-nowrap keep the locked couplet on one line at 2-up phone width. */}
                    <p className="mt-1 truncate whitespace-nowrap text-xs font-bold leading-tight text-white sm:mt-1.5 sm:text-base">
                      {card.title}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
