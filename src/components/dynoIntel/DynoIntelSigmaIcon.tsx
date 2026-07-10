import type { FC, SVGProps } from 'react';

/** Sigma / summation stroke — methodology chip glyph (WHY: formula cue without emoji or font glyphs). */
const DynoIntelSigmaIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    {...props}
  >
    <path
      d="M11.6 3.2H4.4l3.6 4.8-3.6 4.8h7.2"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DynoIntelSigmaIcon;
