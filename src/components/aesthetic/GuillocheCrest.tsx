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
 * WHY: One continuous closed ribbon per glyph (no stencil slits, no stem/bowl gaps) —
 * thick filled stencil reads as blocky UI type at 24px; hairline stroke + micro fill
 * matches cold-steel seal chrome while keeping ~35% hex breathing room.
 *
 * Glyph box ≈ y 42–54; U/P gap ≈ 2.4 units. Ribbon thickness ≈ 1.4–1.6 (stroke 1.2 sits on edge).
 */
const UP_MONOGRAM_U =
  'M36.0 42.0 L37.5 42.0 L37.5 50.8 L38.8 52.0 L43.8 52.0 L45.1 50.8 L45.1 42.0 L46.6 42.0 ' +
  'L46.6 51.4 L44.6 53.8 L38.0 53.8 L36.0 51.4 Z';

const UP_MONOGRAM_P =
  // Continuous stem+bowl ribbon: enter bowl counter at the join so the eye stays open —
  // never a floating gap between stem and bowl.
  'M49.0 42.0 L50.5 42.0 L50.5 43.0 L55.8 43.0 L57.6 44.8 L57.6 47.8 L55.8 49.6 L50.5 49.6 ' +
  'L50.5 48.4 L55.0 48.4 L55.8 47.6 L55.8 45.0 L55.0 44.2 L50.5 44.2 L50.5 53.8 L49.0 53.8 Z';

const UP_MONOGRAM_PATH_CLASS = 'fill-amber-300/15';

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
      className="size-24 text-amber-300/60"
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
      {/* Hairline chiseled UP — continuous ribbons, stroke-driven cold steel */}
      <g data-testid="aesthetic-guilloche-monogram">
        <path
          d={UP_MONOGRAM_U}
          className={UP_MONOGRAM_PATH_CLASS}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={UP_MONOGRAM_P}
          className={UP_MONOGRAM_PATH_CLASS}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  </div>
);

export default GuillocheCrest;
