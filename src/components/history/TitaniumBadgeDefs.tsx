import type { FC } from 'react';

export const HISTORY_TI_PLATE_GRAD_ID = 'history-ti-plate-grad';
export const HISTORY_TI_SHEEN_GRAD_ID = 'history-ti-sheen-grad';
export const HISTORY_TI_BEVEL_BORDER_ID = 'history-ti-bevel-border';
export const HISTORY_TI_BURNED_ACCENT_ID = 'history-ti-burned-accent';
export const HISTORY_TI_BOLT_HEAD_ID = 'history-ti-bolt-head';
export const HISTORY_TI_BOLT_SYMBOL_ID = 'history-ti-bolt';
export const HISTORY_TI_LASER_ENGRAVE_ID = 'history-ti-laser-engrave';
export const HISTORY_TI_SELECTED_GLOW_ID = 'history-ti-selected-glow';
/** Matches radar cyan (`radarVisualTokens`) so selected glow stays in the same accent family. */
const SELECTED_GLOW_FLOOD = '#22d3ee';

/** Shared titanium fills/symbols — mount once so IDs stay unique in the document. */
export const TitaniumBadgeDefs: FC = () => (
  <svg
    width="0"
    height="0"
    className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden"
    aria-hidden
  >
    <defs>
      <linearGradient id={HISTORY_TI_PLATE_GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3A4450" />
        <stop offset="18%" stopColor="#556677" />
        <stop offset="38%" stopColor="#1A1E24" />
        <stop offset="62%" stopColor="#4A5560" />
        <stop offset="82%" stopColor="#16181C" />
        <stop offset="100%" stopColor="#2C333C" />
      </linearGradient>
      <linearGradient id={HISTORY_TI_SHEEN_GRAD_ID} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DDEEFF" stopOpacity="0" />
        <stop offset="45%" stopColor="#DDEEFF" stopOpacity="0.14" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.32" />
        <stop offset="55%" stopColor="#DDEEFF" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={HISTORY_TI_BEVEL_BORDER_ID} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#C5CDD8" stopOpacity="0.9" />
        <stop offset="45%" stopColor="#4A5160" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#0A0B0D" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id={HISTORY_TI_BURNED_ACCENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0038AA" />
        <stop offset="28%" stopColor="#5B1FD6" />
        <stop offset="42%" stopColor="#C44BFF" />
        <stop offset="52%" stopColor="#E8C04A" />
        <stop offset="68%" stopColor="#00E0FF" />
        <stop offset="100%" stopColor="#0077CC" />
      </linearGradient>
      <linearGradient id={HISTORY_TI_BOLT_HEAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8A929E" />
        <stop offset="100%" stopColor="#1A1C20" />
      </linearGradient>
      <filter id={HISTORY_TI_LASER_ENGRAVE_ID} x="-20%" y="-20%" width="140%" height="140%">
        <feOffset dx="0" dy="1" in="SourceAlpha" result="off" />
        <feGaussianBlur in="off" stdDeviation="0.5" result="blur" />
        <feComposite in="SourceAlpha" in2="blur" operator="arithmetic" k2="-1" k3="1" result="inner" />
        <feFlood floodColor="#000000" floodOpacity="0.55" result="shade" />
        <feComposite in="shade" in2="inner" operator="in" result="inset" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="inset" />
        </feMerge>
      </filter>
      <filter id={HISTORY_TI_SELECTED_GLOW_ID} x="-35%" y="-35%" width="170%" height="170%">
        <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={SELECTED_GLOW_FLOOD} floodOpacity="0.5" />
      </filter>
      <symbol id={HISTORY_TI_BOLT_SYMBOL_ID} viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="2.75" fill="none" stroke="#6A7380" strokeWidth="0.35" />
        <circle
          cx="3"
          cy="3"
          r="2.15"
          fill={`url(#${HISTORY_TI_BOLT_HEAD_ID})`}
          stroke="#0E0F12"
          strokeWidth="0.4"
        />
        <polygon points="3,1.95 3.9,2.48 3.9,3.52 3,4.05 2.1,3.52 2.1,2.48" fill="#08090A" />
      </symbol>
    </defs>
  </svg>
);
