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
      {/* Cold monospace UP monogram — dominantBaseline keeps it optically centered in the hex. */}
      <text
        x="48"
        y="48"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="14"
        fontWeight="700"
        letterSpacing="1.5"
      >
        UP
      </text>
    </svg>
  </div>
);

export default GuillocheCrest;
