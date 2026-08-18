import type { FC, ReactNode } from 'react';
import {
  HISTORY_TI_BEVEL_BORDER_ID,
  HISTORY_TI_BOLT_SYMBOL_ID,
  HISTORY_TI_BURNED_ACCENT_ID,
  HISTORY_TI_LASER_ENGRAVE_ID,
  HISTORY_TI_PLATE_GRAD_ID,
  HISTORY_TI_SELECTED_GLOW_ID,
  HISTORY_TI_SHEEN_GRAD_ID,
} from './TitaniumBadgeDefs';

const PLATE_W = 64;
const PLATE_H = 48;
const BOLT_SIZE = 6;
const GLYPH_SCALE = 0.7;
const GLYPH_ORIGIN = 12;
const LOCKED_PLATE = '#1A1C1D';
const LOCKED_MARK = '#333333';
const UNLOCKED_MARK = '#ECEFF4';
const BURNED_MARK = '#D4AF37';

const PLATE_FRAME = {
  x: 1.5,
  y: 1.5,
  width: PLATE_W - 3,
  height: PLATE_H - 3,
  rx: 5,
} as const;

const BOLTS = [
  { cx: 6, cy: 6 },
  { cx: PLATE_W - 6, cy: 6 },
  { cx: 6, cy: PLATE_H - 6 },
  { cx: PLATE_W - 6, cy: PLATE_H - 6 },
] as const;

export interface CompactTitaniumPlateProps {
  catalogId: string;
  unlocked: boolean;
  burned: boolean;
  selected: boolean;
  unseenGlow?: boolean;
  children: ReactNode;
}

function markColor(unlocked: boolean, burned: boolean): string {
  if (!unlocked) return LOCKED_MARK;
  if (burned) return BURNED_MARK;
  return UNLOCKED_MARK;
}

export const CompactTitaniumPlate: FC<CompactTitaniumPlateProps> = ({
  catalogId,
  unlocked,
  burned,
  selected,
  unseenGlow,
  children,
}) => {
  const showBurn = unlocked && burned;
  const markFill = markColor(unlocked, burned);
  const glyphX = 32 - GLYPH_ORIGIN * GLYPH_SCALE;
  const glyphY = 24 - GLYPH_ORIGIN * GLYPH_SCALE;

  return (
    <svg viewBox={`0 0 ${PLATE_W} ${PLATE_H}`} fill="none" className={`h-12 w-full sm:h-14${unseenGlow ? ' animate-unseen-glow motion-reduce:animate-none' : ''}`} aria-hidden>
      <g filter={selected ? `url(#${HISTORY_TI_SELECTED_GLOW_ID})` : undefined}>
        <rect
          {...PLATE_FRAME}
          fill={unlocked ? `url(#${HISTORY_TI_PLATE_GRAD_ID})` : LOCKED_PLATE}
          stroke={`url(#${HISTORY_TI_BEVEL_BORDER_ID})`}
          strokeWidth="1.25"
        />
        {unlocked ? <rect {...PLATE_FRAME} fill={`url(#${HISTORY_TI_SHEEN_GRAD_ID})`} /> : null}
      </g>
      {showBurn ? (
        <path
          d={`M 3 7 Q 3 2.5 8 2.5 H ${PLATE_W - 8} Q ${PLATE_W - 3} 2.5 ${PLATE_W - 3} 7 V 8 H 3 Z`}
          fill={`url(#${HISTORY_TI_BURNED_ACCENT_ID})`}
          opacity="0.95"
        />
      ) : null}
      <rect
        x="7"
        y="11"
        width={PLATE_W - 14}
        height={PLATE_H - 18}
        rx="3"
        fill="none"
        stroke="#121316"
        strokeWidth="0.9"
        opacity="0.85"
      />
      {BOLTS.map((bolt) => (
        <use
          key={`${bolt.cx}-${bolt.cy}`}
          href={`#${HISTORY_TI_BOLT_SYMBOL_ID}`}
          x={bolt.cx - BOLT_SIZE / 2}
          y={bolt.cy - BOLT_SIZE / 2}
          width={BOLT_SIZE}
          height={BOLT_SIZE}
        />
      ))}
      <g
        transform={`translate(${glyphX} ${glyphY}) scale(${GLYPH_SCALE})`}
        fill="none"
        stroke={markFill}
        filter={unlocked ? `url(#${HISTORY_TI_LASER_ENGRAVE_ID})` : undefined}
      >
        {children}
      </g>
      <text
        x="9"
        y="40.5"
        fill={markFill}
        fontSize="5.2"
        fontWeight="700"
        letterSpacing="0.08em"
        className="font-mono"
      >
        {catalogId}
      </text>
      {showBurn ? (
        <circle
          cx={PLATE_W - 12}
          cy={PLATE_H - 12}
          r="2"
          fill={`url(#${HISTORY_TI_BURNED_ACCENT_ID})`}
        />
      ) : null}
    </svg>
  );
};
