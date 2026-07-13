import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Collapsible Heath–Carter algorithm notes anchored under the lab CTA.
 * WHY: Native `<details>` stays collapsed by default with no React state —
 * cold geometric chrome keeps the form premium without toy emoji chrome.
 */
export const SomatotypeScientificAppendix: FC = () => {
  const { t } = useTranslation('common');

  return (
    <details className="group border border-zinc-700/80 bg-black/30 open:border-zinc-600">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 marker:content-none hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">{t('tools.somatotypeLab.appendix.title')}</span>
        <span
          aria-hidden="true"
          className="inline-block size-1.5 shrink-0 rotate-45 border-b border-r border-zinc-500 transition-transform group-open:translate-y-0.5 group-open:rotate-[225deg]"
        />
      </summary>
      <div className="space-y-3 border-t border-zinc-800 px-3 py-3 text-[11px] leading-relaxed text-zinc-400">
        <p>{t('tools.somatotypeLab.appendix.heathCarter')}</p>
        <p>{t('tools.somatotypeLab.appendix.genderTracks')}</p>
        <p>{t('tools.somatotypeLab.appendix.legendaryDefense')}</p>
        <p>{t('tools.somatotypeLab.appendix.biaDisclaimer')}</p>
      </div>
    </details>
  );
};

export default SomatotypeScientificAppendix;
