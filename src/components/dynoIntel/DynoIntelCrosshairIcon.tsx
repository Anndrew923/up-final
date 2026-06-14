import type { FC, SVGProps } from 'react';

/** Four-line digital radar crosshair — collapsed trigger glyph (WHY: SVG avoids font glyph drift). */
const DynoIntelCrosshairIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    {...props}
  >
    <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
    <path d="M8 2.5v2.25M8 11.25V13.5M2.5 8h2.25M11.25 8H13.5" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" />
  </svg>
);

export default DynoIntelCrosshairIcon;
