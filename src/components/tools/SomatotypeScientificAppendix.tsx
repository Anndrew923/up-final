import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Collapsible Heath–Carter algorithm guide for the lab input page.
 * WHY: Native `<details>` stays collapsed by default with no React state —
 * keeps the form surface clean while still disclosing wrist-proxy residual risk.
 */
export const SomatotypeScientificAppendix: FC = () => {
  const { t } = useTranslation('common');

  return (
    <details className="group rounded-xl border border-zinc-800 bg-zinc-950/50 open:border-zinc-700">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 font-mono text-[11px] tracking-wide text-zinc-500 marker:content-none hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">{t('tools.somatotypeLab.appendix.title')}</span>
        <span
          aria-hidden="true"
          className="shrink-0 text-zinc-600 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="space-y-3 border-t border-zinc-800/80 px-3 py-3 text-[11px] leading-relaxed text-zinc-400">
        <p>{t('tools.somatotypeLab.appendix.heathCarter')}</p>
        <p>{t('tools.somatotypeLab.appendix.legendaryDefense')}</p>
        <p>{t('tools.somatotypeLab.appendix.biaDisclaimer')}</p>
      </div>
    </details>
  );
};

export default SomatotypeScientificAppendix;
