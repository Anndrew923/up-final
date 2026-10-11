import type { FC } from 'react';

/** Compact hexagon + radar reticule for the Dyno six-axis HUD entry. */
export const DynoSixAxisRadarIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <path
      d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M12 5.5v2.2M12 16.3v2.2M5.5 12h2.2M16.3 12h2.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M12 12 16.5 8.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export default DynoSixAxisRadarIcon;
