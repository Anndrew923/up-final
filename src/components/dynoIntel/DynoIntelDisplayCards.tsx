import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { DynoIntelDisplayMeta } from '../../logic/core/resolveDynoIntelDisplayMeta';

export interface DynoIntelDisplayCardsProps {
  displayMeta: DynoIntelDisplayMeta | null;
}

const DynoIntelDisplayCards: FC<DynoIntelDisplayCardsProps> = ({ displayMeta }) => {
  const { t } = useTranslation('common');

  if (!displayMeta?.scoreLabel && !displayMeta?.tierTitle && !displayMeta?.methodologyNudge) {
    return null;
  }

  const scoreText =
    displayMeta.axisKey === 'overall'
      ? t('dynoIntel.displayCard.overallScoreLabel', { score: displayMeta.scoreLabel })
      : displayMeta.scoreLabel
        ? t('dynoIntel.displayCard.scoreLabel', { score: displayMeta.scoreLabel })
        : null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {scoreText ? (
        <span className="inline-flex items-center rounded-lg border border-cyan-500/40 bg-cyan-950/50 px-3 py-1.5 text-sm font-bold tabular-nums text-cyan-100">
          {scoreText}
        </span>
      ) : null}
      {displayMeta.tierTitle ? (
        <span className="inline-flex items-center rounded-lg border border-[#DFFF00]/30 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#DFFF00]">
          {t('dynoIntel.displayCard.tierPrefix')}【{displayMeta.tierTitle}】
        </span>
      ) : null}
      {displayMeta.methodologyNudge ? (
        <p className="w-full text-xs leading-relaxed text-zinc-400">{displayMeta.methodologyNudge}</p>
      ) : null}
    </div>
  );
};

export default DynoIntelDisplayCards;
