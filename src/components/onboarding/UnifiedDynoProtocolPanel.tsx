import type { FC } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatOnboardingBaselineFeatureLabel,
  ONBOARDING_BASELINE_FEATURE_KEYS,
  resolveOnboardingBaselineCopy,
} from '../../i18n/resolveOnboardingBaselineCopy';

const UnifiedDynoProtocolPanel: FC = () => {
  const { t, i18n } = useTranslation('common');
  const titleId = useId();
  const copy = resolveOnboardingBaselineCopy(t);
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <section
      className="mb-1 w-full rounded border border-zinc-800/80 bg-zinc-900/40 p-4 font-mono text-xs text-zinc-300"
      data-testid="unified-dyno-protocol-panel"
      aria-labelledby={titleId}
    >
      <h3 id={titleId} className="mb-2 text-sm font-black tracking-wider text-accent-primary">
        {copy.protocolTitle}
      </h3>
      <p className="mb-4 font-sans text-xs leading-relaxed text-zinc-400">{copy.protocolDesc}</p>

      <ul className="mb-4 flex list-none flex-col gap-3 p-0">
        {ONBOARDING_BASELINE_FEATURE_KEYS.map((key) => {
          const feature = copy.features[key];
          if (!feature.label && !feature.desc) return null;
          return (
            <li
              key={key}
              className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2"
            >
              <span className="shrink-0 font-bold text-accent-info sm:min-w-[8.5rem]">
                {formatOnboardingBaselineFeatureLabel(feature.label, language)}
              </span>
              <span className="font-sans leading-normal text-zinc-400">{feature.desc}</span>
            </li>
          );
        })}
      </ul>

      <p className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5 font-sans text-[11px] leading-relaxed text-amber-200/90">
        {copy.authorityFooter}
      </p>
    </section>
  );
};

export default UnifiedDynoProtocolPanel;
