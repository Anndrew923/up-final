import type { FC, ReactNode } from 'react';
import type { PerformanceAuraKey } from '../../logic/core/performanceAura';
import { AURA_THEME } from './auraThemeTokens';

export interface AuraReactiveFrameProps {
  auraKey: PerformanceAuraKey;
  children: ReactNode;
  className?: string;
}

/**
 * Aura-reactive card shell — gradient border + compositor-friendly shimmer layers.
 */
const AuraReactiveFrame: FC<AuraReactiveFrameProps> = ({ auraKey, children, className = '' }) => {
  const theme = AURA_THEME[auraKey];

  return (
    <div className={`relative overflow-hidden rounded-2xl p-[1px] ${className}`}>
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r opacity-90 ${theme.borderGradient} ${theme.shimmer} motion-reduce:animate-none will-change-[transform,opacity]`}
        aria-hidden
      />
      <div className={`pointer-events-none absolute inset-0 ${theme.glow} motion-reduce:opacity-30`} aria-hidden />
      <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/95 px-5 py-5 shadow-panel backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
};

export default AuraReactiveFrame;
