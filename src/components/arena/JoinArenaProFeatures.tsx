import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { JOIN_ARENA_PRO_FEATURES } from './joinArenaFeatureKeys';

/**
 * Pro value telemetry sheet — mono index chips + compact type, no icons/emoji.
 * WHY: Spec-sheet density (~90–115px) keeps plan picker / invite code above the fold
 * while titles carry flagship weight and chips stay secondary instrumentation.
 */
const JoinArenaProFeatures: FC = () => {
  const { t } = useTranslation('arena');

  return (
    <section aria-label={t('featuresTitle')}>
      {/* WHY: Ordered list matches 01–03 telemetry channels; list-none keeps custom mono chips. */}
      <ol className="list-none space-y-3">
        {JOIN_ARENA_PRO_FEATURES.map((feature) => (
          <li key={feature.variant} className="flex items-center gap-3">
            <span className="inline-flex h-5 shrink-0 items-center rounded-sm border border-amber-500/20 bg-amber-500/10 px-1.5 font-mono text-[10px] font-semibold tracking-widest text-amber-400/90">
              {feature.index}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold tracking-tight text-white text-pretty">
                {t(feature.titleKey)}
              </p>
              <p className="mt-0.5 text-xs font-medium leading-tight text-zinc-300 text-pretty">
                {t(feature.bodyKey)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default JoinArenaProFeatures;
