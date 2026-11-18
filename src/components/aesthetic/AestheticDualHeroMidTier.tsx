/**
 * Carbon DOM mid-axis ceremonial tier plaque — WYSIWYG with Canvas carbon plaque.
 */
import type { FC } from 'react';
import { FOIL_HERO_WING_LEFT_CLASS, FOIL_HERO_WING_RIGHT_CLASS } from './aestheticChrome';

export interface AestheticDualHeroMidTierProps {
  tierCapsule: string;
  isOverflow: boolean;
  testIdPrefix?: string;
}

const AestheticDualHeroMidTier: FC<AestheticDualHeroMidTierProps> = ({
  tierCapsule,
  isOverflow,
  testIdPrefix = 'aesthetic-dual-hero',
}) => {
  if (!tierCapsule.trim()) return null;
  return (
    <div
      data-testid={`${testIdPrefix}-mid-tier`}
      className="relative flex w-full items-center justify-center gap-2 px-2 py-1.5"
    >
      <span className={FOIL_HERO_WING_LEFT_CLASS} aria-hidden="true" />
      <span
        data-testid={
          isOverflow ? `${testIdPrefix}-overflow` : `${testIdPrefix}-tier`
        }
        className="relative inline-flex min-w-[5.5rem] items-center justify-center border border-[#D4AF37] bg-gradient-to-r from-[rgba(212,175,55,0.26)] via-[rgba(253,230,138,0.14)] to-[rgba(212,175,55,0.26)] px-3 py-1.5 text-[clamp(0.55rem,2.4vw,0.72rem)] font-bold tracking-[0.14em] text-[#FDE68A] shadow-[0_0_12px_rgba(212,175,55,0.35)]"
      >
        <span className="pointer-events-none absolute inset-1 border border-[rgba(253,230,138,0.45)]" />
        <span className="relative z-[1]">{tierCapsule}</span>
      </span>
      <span className={FOIL_HERO_WING_RIGHT_CLASS} aria-hidden="true" />
    </div>
  );
};

export default AestheticDualHeroMidTier;
