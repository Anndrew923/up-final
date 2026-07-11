import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import {
  JOIN_ARENA_PRO_FEATURES,
  type JoinArenaProFeatureBodyKey,
  type JoinArenaProFeatureTitleKey,
  type JoinArenaProFeatureVariant,
} from './joinArenaFeatureKeys';

interface FeatureRowProps {
  variant: JoinArenaProFeatureVariant;
  titleKey: JoinArenaProFeatureTitleKey;
  bodyKey: JoinArenaProFeatureBodyKey;
  motionOn: boolean;
}

const iconAnimation: Record<JoinArenaProFeatureVariant, string> = {
  leaderboard: 'animate-arena-radar-sweep',
  cloud: 'animate-arena-cloud-breathe',
  'dyno-intel': 'animate-arena-telemetry-pulse',
};

const haloClass: Record<JoinArenaProFeatureVariant, string> = {
  leaderboard:
    'border-accent-primary/70 bg-accent-primary/25 shadow-[0_0_22px_rgba(255,140,0,0.75),0_0_40px_rgba(255,80,0,0.35)]',
  cloud:
    'border-accent-info/70 bg-accent-info/25 shadow-[0_0_22px_rgba(0,191,255,0.7),0_0_40px_rgba(0,140,255,0.3)]',
  'dyno-intel':
    'border-violet-400/70 bg-violet-500/25 shadow-[0_0_22px_rgba(167,139,250,0.75),0_0_40px_rgba(139,92,246,0.35)]',
};

const outerRingClass: Record<JoinArenaProFeatureVariant, string> = {
  leaderboard: 'border-accent-primary/35 shadow-[0_0_18px_rgba(255,140,0,0.35)]',
  cloud: 'border-accent-info/35 shadow-[0_0_18px_rgba(0,191,255,0.3)]',
  'dyno-intel': 'border-violet-400/35 shadow-[0_0_18px_rgba(139,92,246,0.3)]',
};

const dotClass: Record<JoinArenaProFeatureVariant, string> = {
  leaderboard: 'bg-accent-primary shadow-[0_0_10px_rgba(255,140,0,0.95)]',
  cloud: 'bg-accent-info shadow-[0_0_10px_rgba(0,191,255,0.95)]',
  'dyno-intel': 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.95)]',
};

const FeatureRow: FC<FeatureRowProps> = ({ variant, titleKey, bodyKey, motionOn }) => {
  const { t } = useTranslation('arena');
  const anim = motionOn ? iconAnimation[variant] : '';

  return (
    <li className="flex gap-4 text-zinc-200">
      <span className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center">
        <span
          className={`absolute -inset-1 rounded-full border ${outerRingClass[variant]} ${anim}`}
          aria-hidden
        />
        <span
          className={`absolute inset-0 rounded-full border ${haloClass[variant]} ${anim}`}
          aria-hidden
        />
        {variant === 'leaderboard' && motionOn ? (
          <span
            className="pointer-events-none absolute -inset-1.5 rounded-full border border-accent-primary/30 animate-[arena-radar-sweep_8s_linear_infinite]"
            aria-hidden
          />
        ) : null}
        <span className={`relative z-[1] h-2.5 w-2.5 rounded-full ${dotClass[variant]}`} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
        <p className="text-sm font-semibold tracking-tight text-zinc-50 text-pretty">{t(titleKey)}</p>
        <p className="text-[13px] leading-snug text-zinc-400 text-pretty sm:text-sm">{t(bodyKey)}</p>
      </div>
    </li>
  );
};

/**
 * Pro value kit — sole feature narrative on Join Arena after Core/Pro comparison removal.
 * WHY: One immersive neon panel avoids duplicate comparison copy and aligns with Dyno paywall.
 */
const JoinArenaProFeatures: FC = () => {
  const { t } = useTranslation('arena');
  const motionOn = !usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent-primary/35 bg-gradient-to-b from-zinc-950 via-bg-card/90 to-zinc-950 shadow-[0_0_36px_rgba(255,140,0,0.12),0_0_60px_rgba(0,191,255,0.08)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/80 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-accent-primary/20 blur-[70px]" />
      <div className="pointer-events-none absolute -right-12 bottom-6 h-36 w-36 rounded-full bg-accent-info/15 blur-[70px]" />
      <div className="pointer-events-none absolute inset-x-8 bottom-20 h-24 rounded-full bg-violet-500/10 blur-[50px]" />
      <div className="relative space-y-6 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-primary/90 drop-shadow-[0_0_12px_rgba(255,140,0,0.45)]">
          {t('featuresTitle')}
        </h2>
        <ul className="space-y-5">
          {JOIN_ARENA_PRO_FEATURES.map((feature) => (
            <FeatureRow
              key={feature.variant}
              variant={feature.variant}
              titleKey={feature.titleKey}
              bodyKey={feature.bodyKey}
              motionOn={motionOn}
            />
          ))}
        </ul>
        <p className="border-t border-zinc-800/80 pt-4 text-[11px] leading-snug text-pretty text-zinc-500 sm:text-xs">
          {t('disclaimer')}
        </p>
      </div>
    </section>
  );
};

export default JoinArenaProFeatures;
