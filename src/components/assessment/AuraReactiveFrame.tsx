import type { FC, ReactNode } from 'react';
import type { PerformanceAuraKey } from '../../logic/core/performanceAura';
import { AURA_THEME, auraNeonCssVars } from './auraThemeTokens';

export interface AuraReactiveFrameProps {
  auraKey: PerformanceAuraKey;
  children: ReactNode;
  className?: string;
}

/**
 * Aura-reactive card shell — border shimmer, diffused bleed, Magitek chassis grid.
 * WHY: glow layers use transform/opacity/filter only to stay on the compositor (60 FPS target).
 */
const AuraReactiveFrame: FC<AuraReactiveFrameProps> = ({ auraKey, children, className = '' }) => {
  const theme = AURA_THEME[auraKey];

  return (
    <div className={`relative ${className}`} style={auraNeonCssVars(theme.neonRgb)}>
      <div
        className={`pointer-events-none absolute -inset-10 z-0 motion-reduce:animate-none motion-reduce:opacity-40 animate-aura-bleed-enter will-change-[transform,opacity] ${theme.diffusedRadial}`}
        style={{ filter: 'blur(25px)' }}
        aria-hidden
      />
      <div className="relative z-10 overflow-hidden rounded-2xl p-[1px]">
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-r opacity-90 ${theme.borderGradient} ${theme.shimmer} motion-reduce:animate-none will-change-[transform,opacity]`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute inset-0 ${theme.glow} motion-reduce:opacity-30`}
          aria-hidden
        />
        <div className="magitek-chassis-grid relative rounded-2xl border border-zinc-800/80 bg-zinc-950/95 px-5 py-5 shadow-panel backdrop-blur-sm">
          <div className="relative z-[1]">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuraReactiveFrame;
