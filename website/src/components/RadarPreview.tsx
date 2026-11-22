import { useState } from 'react';
import { scienceAxes } from '../data/scienceData';

type ViewMode = 'physique' | 'telemetry';

/** Demo scores for marketing preview only (not live user telemetry). */
const DEMO_SCORES: Record<string, number> = {
  strength: 118,
  explosivePower: 96,
  cardio: 88,
  muscleMass: 105,
  bodyFat: 112,
  gripStrength: 124,
};

const AXES = scienceAxes.map((axis) => ({
  key: axis.id,
  physiqueLabel: axis.titleZh,
  telemetryLabel: axis.telemetryShort,
  telemetryCode: axis.telemetryCode,
  score: DEMO_SCORES[axis.id] ?? 80,
}));

/** Compact canvas so hero radar fits one desktop viewport with chrome. */
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 92;

/** Visual radius: 0–100 linear; >100 overclock compresses with sqrt (app-aligned feel). */
function scoreToRadius(score: number): number {
  const clamped = Math.max(0, Math.min(200, score));
  if (clamped <= 100) return (clamped / 100) * MAX_R;
  const overflow = clamped - 100;
  return MAX_R + Math.sqrt(overflow / 100) * 20;
}

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

const POLYGON_POINTS = AXES.map((axis, i) => {
  const angle = (360 / AXES.length) * i;
  return polar(angle, scoreToRadius(axis.score));
})
  .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  .join(' ');

const OVERALL =
  Math.round((AXES.reduce((s, a) => s + a.score, 0) / AXES.length) * 10) / 10;

export function RadarPreview() {
  const [mode, setMode] = useState<ViewMode>('physique');

  return (
    <div className="ui-panel relative overflow-hidden p-3 sm:p-4 shadow-brand lg:max-h-[340px]">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-brand/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="ui-kicker">RADAR // LIVE PREVIEW</p>
          <p className="mt-0.5 font-mono text-xs text-zinc-400">
            OVERALL <span className="text-brand">{OVERALL}</span> / 200
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-white/10 bg-void/80 p-1"
          role="group"
          aria-label="雷達視圖切換"
        >
          <button
            type="button"
            onClick={() => setMode('physique')}
            aria-pressed={mode === 'physique'}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              mode === 'physique'
                ? 'bg-brand text-black'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            體能指標
          </button>
          <button
            type="button"
            onClick={() => setMode('telemetry')}
            aria-pressed={mode === 'telemetry'}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              mode === 'telemetry'
                ? 'bg-energy text-black'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            遙測頻譜
          </button>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[300px] lg:max-h-[260px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto h-auto max-h-[260px] w-full"
          role="img"
          aria-label={`六軸雷達預覽，綜合戰力 ${OVERALL}`}
        >
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const ring = AXES.map((_, i) => {
              const angle = (360 / AXES.length) * i;
              const p = polar(angle, MAX_R * t);
              return `${p.x},${p.y}`;
            }).join(' ');
            return (
              <polygon
                key={t}
                points={ring}
                fill="none"
                stroke={t === 1 ? 'rgba(255,140,0,0.45)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={t === 1 ? 1.5 : 1}
                strokeDasharray={t === 1 ? '4 3' : undefined}
              />
            );
          })}

          {AXES.map((_, i) => {
            const angle = (360 / AXES.length) * i;
            const p = polar(angle, MAX_R + 18);
            return (
              <line
                key={`spoke-${i}`}
                x1={CX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}

          <polygon
            points={POLYGON_POINTS}
            fill="rgba(255,140,0,0.22)"
            stroke="#ff8c00"
            strokeWidth={2}
          />

          {AXES.map((axis, i) => {
            const angle = (360 / AXES.length) * i;
            const tip = polar(angle, scoreToRadius(axis.score));
            const overclock = axis.score > 100;
            return (
              <circle
                key={axis.key}
                cx={tip.x}
                cy={tip.y}
                r={overclock ? 4.5 : 3}
                fill={overclock ? '#ff8c00' : '#00bfff'}
                stroke={overclock ? '#FDE047' : 'transparent'}
                strokeWidth={1.25}
              />
            );
          })}

          {AXES.map((axis, i) => {
            const angle = (360 / AXES.length) * i;
            const p = polar(angle, MAX_R + 40);
            const label =
              mode === 'physique' ? axis.physiqueLabel : axis.telemetryLabel;
            const sub =
              mode === 'telemetry' ? axis.telemetryCode : String(axis.score);
            return (
              <g key={`label-${axis.key}`}>
                <text
                  x={p.x}
                  y={p.y - 3}
                  textAnchor="middle"
                  fill="#f4f4f5"
                  fontSize={10}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {label}
                </text>
                <text
                  x={p.x}
                  y={p.y + 9}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                >
                  {sub}
                  {axis.score > 100 && mode === 'physique' ? ' OC' : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="relative mt-1 text-center font-mono text-[10px] text-zinc-400 sm:text-[11px]">
        虛線環 = 100 分精英門檻 · 橘金點 = 超頻突破 (&gt;100)
      </p>
    </div>
  );
}
