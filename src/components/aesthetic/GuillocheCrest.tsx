import { type FC } from 'react';
import { GUILLOCHE_UP_SVG_PATHS } from '../../lib/guillocheMonogramPaths';

/** Tick teeth along the outer seal ring — anti-counterfeit texture without radar spokes. */
const GUILLOCHE_TEETH = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
  const outer = 43.5;
  const inner = i % 5 === 0 ? 39.5 : 41.2;
  return {
    key: i,
    x1: 48 + Math.cos(a) * inner,
    y1: 48 + Math.sin(a) * inner,
    x2: 48 + Math.cos(a) * outer,
    y2: 48 + Math.sin(a) * outer,
    major: i % 5 === 0,
  };
});

/** Outer hex — vertices symmetric about (48, 48). */
const HEX_SHIELD_PATH = 'M48 27 L66 37.5 L66 58.5 L48 69 L30 58.5 L30 37.5 Z';

/** Micro anti-forgery diamonds at hex apex / nadir (vector, not text ◆). */
const HEX_DIAMOND_TOP = 'M48 25.2 L48.75 27 L48 28.8 L47.25 27 Z';
const HEX_DIAMOND_BOTTOM = 'M48 67.2 L48.75 69 L48 70.8 L47.25 69 Z';

/**
 * WHY: UP hex-shield seal — geometric anti-forgery crest centered on the plate, filling the
 * header→stamp vacuum without competing with foil type. Monogram paths live in
 * guillocheMonogramPaths so Canvas certificates cannot drift from this SVG.
 */
const GuillocheCrest: FC = () => (
  <div
    className="pointer-events-none relative mx-auto flex size-24 select-none items-center justify-center"
    data-testid="aesthetic-guilloche-crest"
    aria-hidden
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.12)_0%,_transparent_70%)]" />
    <svg className="size-20" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dual outer rings + micro tick teeth */}
      <g className="text-amber-300/60">
        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="0.7" />
        <circle cx="48" cy="48" r="40.5" stroke="currentColor" strokeWidth="0.45" />
        {GUILLOCHE_TEETH.map((tooth) => (
          <line
            key={tooth.key}
            x1={tooth.x1}
            y1={tooth.y1}
            x2={tooth.x2}
            y2={tooth.y2}
            stroke="currentColor"
            strokeWidth={tooth.major ? 0.7 : 0.35}
            opacity={tooth.major ? 0.85 : 0.5}
          />
        ))}
      </g>
      {/* Hex shield + apex/nadir registration diamonds */}
      <g className="text-amber-300/50">
        <path
          d={HEX_SHIELD_PATH}
          className="fill-amber-300/5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d={HEX_DIAMOND_TOP} className="fill-amber-300/40" stroke="currentColor" strokeWidth="0.4" />
        <path d={HEX_DIAMOND_BOTTOM} className="fill-amber-300/40" stroke="currentColor" strokeWidth="0.4" />
      </g>
      {/* Monolithic spine UP — symmetric about (48, 48). Paths are open polylines; stroke
          carries the mark. fill-* is kept for SVG inheritance if a segment is later closed. */}
      <g
        data-testid="aesthetic-guilloche-monogram"
        className="text-amber-300/80 fill-amber-300/15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {GUILLOCHE_UP_SVG_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  </div>
);

export default GuillocheCrest;
