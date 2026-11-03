import { type FC } from 'react';

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

/**
 * WHY: Pure vector monogram — system <text> varies by WebView font metrics and reads as UI type,
 * not an engraved seal. 45° chamfers + stencil notches mimic watch-case / nameplate machining.
 *
 * Coordinate space: viewBox 0–96, optically centered in the hex (~34–62 × 39–57).
 */
const UP_MONOGRAM_U =
  'M35.2 39.6 L37.6 39.6 L37.6 49.4 L38.8 50.6 L42.4 50.6 L43.6 49.4 L43.6 39.6 L46.0 39.6 ' +
  'L46.0 50.0 L43.8 52.8 L37.4 52.8 L35.2 50.0 Z ' +
  // Stencil slit through the U bottom bar (evenodd hole).
  'M39.0 49.2 L43.0 49.2 L43.0 50.4 L39.0 50.4 Z';

const UP_MONOGRAM_P =
  // Stem with 45° top/bottom chamfers + mid stencil break.
  'M48.2 39.6 L50.6 39.6 L50.6 43.4 L49.4 44.6 L49.4 46.8 L50.6 48.0 L50.6 52.8 L48.2 52.8 ' +
  'L48.2 48.6 L49.4 47.4 L49.4 43.8 L48.2 42.6 Z ' +
  // Bowl with chamfered outer corners; micro gap at stem junction (stencil).
  'M51.4 39.8 L57.2 39.8 L59.4 42.0 L59.4 46.2 L57.2 48.4 L51.4 48.4 L51.4 46.6 L56.4 46.6 ' +
  'L57.4 45.6 L57.4 42.6 L56.4 41.6 L51.4 41.6 Z';

/**
 * WHY: UP hex-shield seal (not radial "radar") — geometric anti-forgery crest that reads as
 * brand monogram while filling the header→stamp vacuum without competing with foil type.
 */
const GuillocheCrest: FC = () => (
  <div
    className="pointer-events-none relative mx-auto flex size-28 select-none items-center justify-center"
    data-testid="aesthetic-guilloche-crest"
    aria-hidden
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.12)_0%,_transparent_70%)]" />
    <svg
      className="size-24 text-amber-300/35"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dual outer rings + micro tick teeth */}
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
      {/* Hex body-form shield */}
      <path
        d="M48 22 L66 32.5 L66 53.5 L48 64 L30 53.5 L30 32.5 Z"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
      <path
        d="M48 28 L61 35.5 L61 50.5 L48 58 L35 50.5 L35 35.5 Z"
        stroke="currentColor"
        strokeWidth="0.45"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Engraved chamfer UP — fill + hairline stroke for metal-cut depth */}
      <g data-testid="aesthetic-guilloche-monogram" fillRule="evenodd">
        <path
          d={UP_MONOGRAM_U}
          className="fill-amber-300/40 stroke-amber-300/50"
          strokeWidth="0.35"
          strokeLinejoin="miter"
        />
        <path
          d={UP_MONOGRAM_P}
          className="fill-amber-300/40 stroke-amber-300/50"
          strokeWidth="0.35"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  </div>
);

export default GuillocheCrest;
