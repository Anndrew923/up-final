import type { FC } from 'react';
import type { NavIconId } from '../../config/nav.config';

type IconProps = { className?: string };

/** SVG shapes mirrored from reference-app-fitness `BottomNavBar.jsx` (stroke icons). */
const IconPeople: FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconHome: FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 9l9-7 9 7" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const IconLayersPlus: FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9v6" />
    <path d="M9 12h6" />
  </svg>
);

const IconGridRank: FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 3v18M17 3v18M3 9h18M3 15h18" />
  </svg>
);

const IconClock: FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconWrenchBox: FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6M9 15h6M12 9v6" />
  </svg>
);

const GLYPHS: Record<NavIconId, FC<IconProps>> = {
  people: IconPeople,
  home: IconHome,
  'layers-plus': IconLayersPlus,
  'grid-rank': IconGridRank,
  clock: IconClock,
  'wrench-box': IconWrenchBox,
};

export function NavGlyph({ iconId, className }: { iconId: NavIconId; className?: string }) {
  const Comp = GLYPHS[iconId];
  return <Comp className={className} />;
}
