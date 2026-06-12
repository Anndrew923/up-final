import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import type { JoinArenaProFeatureKey } from './joinArenaFeatureKeys';

type FeatureVariant = 'leaderboard' | 'cloud' | 'dyno-intel';

interface FeatureRowProps {
  variant: FeatureVariant;
  labelKey: JoinArenaProFeatureKey;
  motionOn: boolean;
}

const iconAnimation: Record<FeatureVariant, string> = {
  leaderboard: 'animate-arena-radar-sweep',
  cloud: 'animate-arena-cloud-breathe',
  'dyno-intel': 'animate-arena-telemetry-pulse',
};

const haloClass: Record<FeatureVariant, string> = {
  leaderboard:
    'border-accent-primary/40 bg-accent-primary/15 shadow-[0_0_14px_rgba(255,140,0,0.45)]',
  cloud: 'border-accent-info/40 bg-accent-info/15 shadow-[0_0_14px_rgba(0,191,255,0.4)]',
  'dyno-intel': 'border-violet-400/40 bg-violet-500/15 shadow-[0_0_12px_rgba(139,92,246,0.4)]',
};

const dotClass: Record<FeatureVariant, string> = {
  leaderboard: 'bg-accent-primary',
  cloud: 'bg-accent-info',
  'dyno-intel': 'bg-violet-400',
};

const FeatureRow: FC<FeatureRowProps> = ({ variant, labelKey, motionOn }) => {
  const { t } = useTranslation('arena');
  const anim = motionOn ? iconAnimation[variant] : '';

  return (
    <li className="flex gap-3 text-[13px] leading-snug text-zinc-200 sm:text-sm sm:leading-snug">
      <span className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
        <span
          className={`absolute inset-0 rounded-full border ${haloClass[variant]} ${anim}`}
          aria-hidden
        />
        {variant === 'leaderboard' && motionOn ? (
          <span
            className="pointer-events-none absolute -inset-0.5 rounded-full border border-accent-primary/25 animate-[arena-radar-sweep_8s_linear_infinite]"
            aria-hidden
          />
        ) : null}
        <span
          className={`relative z-[1] h-2 w-2 rounded-full ${dotClass[variant]}`}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1 break-words pt-0.5 text-pretty">{t(labelKey)}</span>
    </li>
  );
};

const JoinArenaProFeatures: FC = () => {
  const { t } = useTranslation('arena');
  const motionOn = !usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-bg-card/80 shadow-panel backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/60 to-transparent" />
      <div className="space-y-5 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t('featuresTitle')}
        </h2>
        <ul className="space-y-4">
          <FeatureRow variant="leaderboard" labelKey="proFeatureLeaderboard" motionOn={motionOn} />
          <FeatureRow variant="cloud" labelKey="proFeatureCloudSync" motionOn={motionOn} />
          <FeatureRow variant="dyno-intel" labelKey="proFeatureDynoIntel" motionOn={motionOn} />
        </ul>
        <p className="border-t border-zinc-800/80 pt-4 text-[11px] leading-snug text-pretty text-zinc-500 sm:text-xs">
          {t('disclaimer')}
        </p>
      </div>
    </section>
  );
};

export default JoinArenaProFeatures;
