import { useId, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SomatochartPoint } from '../../logic/core/somatotypeLab';

export interface SomatochartViewProps {
  pointA: SomatochartPoint;
  pointB: SomatochartPoint;
  className?: string;
}

const VIEW = 220;
const CX = 110;
const CY = 118;
const BASE_SCALE = 7.2;
/** Keep extreme meso athletes inside the shield viewport (report: no hard Y lock). */
const FIT_RADIUS = 72;

function resolveScale(a: SomatochartPoint, b: SomatochartPoint): number {
  const maxAbs = Math.max(
    Math.abs(a.x),
    Math.abs(a.y),
    Math.abs(b.x),
    Math.abs(b.y),
    1
  );
  return Math.min(BASE_SCALE, FIT_RADIUS / maxAbs);
}

function toSvg(p: SomatochartPoint, scale: number): { x: number; y: number } {
  return {
    x: CX + p.x * scale,
    y: CY - p.y * scale,
  };
}

/**
 * Presentational Reuleaux-style somatochart shield.
 * Vertices: top = meso, bottom-left = endo, bottom-right = ecto.
 */
export const SomatochartView: FC<SomatochartViewProps> = ({ pointA, pointB, className }) => {
  const { t } = useTranslation('common');
  const animId = useId().replace(/:/g, '_');
  const glowId = useId().replace(/:/g, '_');

  const scale = resolveScale(pointA, pointB);
  const a = toSvg(pointA, scale);
  const b = toSvg(pointB, scale);

  const meso = { x: CX, y: 28 };
  const endo = { x: 38, y: 188 };
  const ecto = { x: 182, y: 188 };
  const shieldPath = `M ${meso.x} ${meso.y} L ${ecto.x} ${ecto.y} L ${endo.x} ${endo.y} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className={className ?? 'h-auto w-full max-w-md'}
      role="img"
      aria-label={t('tools.somatotypeLab.chart.aria')}
    >
      <defs>
        <filter id={`gap-glow-${glowId}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes somato-slide-${animId} {
            from { transform: translate(${CX - a.x}px, ${CY - a.y}px); opacity: 0; }
            to { transform: translate(0, 0); opacity: 1; }
          }
          @keyframes somato-gap-pulse-${animId} {
            0%, 100% { stroke-opacity: 0.45; }
            50% { stroke-opacity: 1; }
          }
          .somato-point-a-${animId} {
            animation: somato-slide-${animId} 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
            transform-box: fill-box;
            transform-origin: center;
          }
          .somato-gap-${animId} {
            animation: somato-gap-pulse-${animId} 1.8s ease-in-out infinite;
          }
        `}</style>
      </defs>

      <rect width={VIEW} height={VIEW} className="fill-zinc-950" rx="12" />

      {[1, 2, 3].map((ring) => (
        <circle
          key={ring}
          cx={CX}
          cy={CY}
          r={28 * ring}
          fill="none"
          className="stroke-zinc-800"
          strokeWidth="0.8"
          opacity={0.55}
        />
      ))}

      <path
        d={shieldPath}
        className="fill-orange-500/[0.06] stroke-zinc-700"
        strokeWidth="1.4"
      />
      <line x1={meso.x} y1={meso.y} x2={CX} y2={CY} className="stroke-zinc-700" strokeWidth="0.7" />
      <line x1={endo.x} y1={endo.y} x2={CX} y2={CY} className="stroke-zinc-700" strokeWidth="0.7" />
      <line x1={ecto.x} y1={ecto.y} x2={CX} y2={CY} className="stroke-zinc-700" strokeWidth="0.7" />

      <text
        x={meso.x}
        y={meso.y - 8}
        textAnchor="middle"
        className="fill-zinc-300 font-mono text-[9px]"
      >
        {t('tools.somatotypeLab.chart.meso')}
      </text>
      <text
        x={endo.x - 2}
        y={endo.y + 14}
        textAnchor="middle"
        className="fill-zinc-400 font-mono text-[8px]"
      >
        {t('tools.somatotypeLab.chart.endo')}
      </text>
      <text
        x={ecto.x + 2}
        y={ecto.y + 14}
        textAnchor="middle"
        className="fill-zinc-400 font-mono text-[8px]"
      >
        {t('tools.somatotypeLab.chart.ecto')}
      </text>

      <circle cx={CX} cy={CY} r="2.2" className="fill-zinc-600" />

      <line
        className={`somato-gap-${animId} stroke-amber-300`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        strokeWidth="1.6"
        strokeDasharray="4 3"
        filter={`url(#gap-glow-${glowId})`}
      />

      <g className={`somato-point-a-${animId}`}>
        <circle
          cx={a.x}
          cy={a.y}
          r="5.5"
          className="fill-red-500 stroke-red-200"
          strokeWidth="1.2"
        />
      </g>
      <circle
        cx={b.x}
        cy={b.y}
        r="5.5"
        className="fill-emerald-500 stroke-emerald-200"
        strokeWidth="1.2"
      />

      <g className="font-mono text-[8px]">
        <text x={12} y={16} className="fill-red-400">
          {t('tools.somatotypeLab.chart.legendA')}
        </text>
        <text x={12} y={28} className="fill-emerald-400">
          {t('tools.somatotypeLab.chart.legendB')}
        </text>
      </g>
    </svg>
  );
};

export default SomatochartView;
