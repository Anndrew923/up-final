import { useId, type FC } from 'react';
import { cn } from '../../lib/cn';
import { FOIL_HEX } from './aestheticChrome';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const CORNER_CLASS: Record<Corner, string> = {
  tl: 'left-[7px] top-[7px]',
  tr: 'right-[7px] top-[7px] rotate-90',
  bl: 'bottom-[7px] left-[7px] -rotate-90',
  br: 'bottom-[7px] right-[7px] rotate-180',
};

/** React `useId()` emits colons; Safari / canvas `url(#:id:)` paint servers fail. */
function svgPaintId(reactId: string): string {
  return reactId.replace(/:/g, '_');
}

const HexRivet: FC<{ className: string }> = ({ className }) => {
  const fillId = svgPaintId(useId());
  return (
    <svg className={cn('h-1.5 w-1.5', className)} viewBox="0 0 8 8" aria-hidden>
      <defs>
        <radialGradient id={fillId} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor={FOIL_HEX.light} />
          <stop offset="42%" stopColor={FOIL_HEX.mid} />
          <stop offset="100%" stopColor="#292524" />
        </radialGradient>
      </defs>
      <polygon
        points="4,0.6 7.3,2.3 7.3,5.7 4,7.4 0.7,5.7 0.7,2.3"
        fill={`url(#${fillId})`}
        stroke="#78716c"
        strokeWidth="0.35"
      />
      <circle cx="3.2" cy="2.9" r="0.7" fill="#fef3c7" opacity="0.55" />
    </svg>
  );
};

const CornerGuide: FC<{ corner: Corner }> = ({ corner }) => (
  <div className={cn('absolute h-5 w-5', CORNER_CLASS[corner])}>
    <div className="absolute left-0 top-0 h-px w-5 bg-gradient-to-r from-[#f3e6c8] via-[#c9a227] to-transparent" />
    <div className="absolute left-0 top-0 h-5 w-px bg-gradient-to-b from-[#f3e6c8] via-[#c9a227] to-transparent" />
    <HexRivet className="absolute left-[2px] top-[2px]" />
  </div>
);

/**
 * Cold-steel certificate plaque — hairline frame + one rivet per corner.
 * WHY: Swiss Master Chronometer plate, not mecha HUD (no hazard stripes / grid / veins).
 */
const AestheticCardArmor: FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
      <div className="absolute inset-0 bg-bg-base" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(24,24,27,0.28)_0%,rgba(5,5,5,0.55)_62%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 opacity-[0.035] mix-blend-soft-light [background-image:radial-gradient(ellipse_at_22%_18%,rgba(243,230,200,0.35)_0,transparent_42%),radial-gradient(ellipse_at_78%_64%,rgba(201,162,39,0.22)_0,transparent_46%),radial-gradient(ellipse_at_48%_92%,rgba(161,161,170,0.18)_0,transparent_40%)]" />

      <div className="absolute inset-[6px] rounded-[0.95rem] border border-[#c9a227]/40" />
      <div className="absolute inset-[8px] rounded-[0.85rem] border border-zinc-400/22 shadow-[inset_0_0_16px_rgba(0,0,0,0.42)]" />

      <CornerGuide corner="tl" />
      <CornerGuide corner="tr" />
      <CornerGuide corner="bl" />
      <CornerGuide corner="br" />
    </div>
  );
};

export default AestheticCardArmor;
