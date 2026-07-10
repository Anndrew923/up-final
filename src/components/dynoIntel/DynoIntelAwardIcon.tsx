import type { FC, SVGProps } from 'react';

/** Minimal award medallion — overall-score chip glyph (WHY: stroke weight matches Crosshair). */
const DynoIntelAwardIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    {...props}
  >
    <circle cx="8" cy="6.5" r="3.75" stroke="currentColor" strokeWidth="0.85" />
    <path
      d="M6.1 9.6 5.2 13.2l2.8-1.35L10.8 13.2l-.9-3.6"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DynoIntelAwardIcon;
