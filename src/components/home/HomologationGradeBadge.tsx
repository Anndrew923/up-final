import { useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import LadderInfoSheet from '../ladder/LadderInfoSheet';
import { getOverallGradeKeys, type OverallGradeBandId } from '../../logic/core/scoreMeaningCatalog';
import { resolveOverallGradeTierCopy } from '../../i18n/resolveOverallGradeCopy';

export interface HomologationGradeBadgeProps {
  bandId: OverallGradeBandId;
  /** Shell/onboarding block — prevents opening detail sheet under global interaction lock. */
  disabled?: boolean;
}

/**
 * HUD homologation badge — homepage shows title (`name`) only.
 * WHY: Progressive disclosure (Spotify Wrapped / Strava badges): avoid stacking long grade copy
 * beside chassis identity on the console card; full `desc` opens in LadderInfoSheet on demand.
 * z-index: sheet uses z-[210]; resonance overlay z-[9999] — no overlap while ritual is closed.
 */
const HomologationGradeBadge: FC<HomologationGradeBadgeProps> = ({
  bandId,
  disabled = false,
}) => {
  const { t } = useTranslation('common');
  const [sheetOpen, setSheetOpen] = useState(false);
  const keys = getOverallGradeKeys(bandId);
  const { name: gradeName, desc: gradeDesc } = resolveOverallGradeTierCopy(t, bandId);

  // WHY: Score band can change after assessment sync; close sheet so title/body never go stale.
  useEffect(() => {
    setSheetOpen(false);
  }, [bandId]);

  const openSheet = useCallback(() => {
    if (disabled) return;
    setSheetOpen(true);
  }, [disabled]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    <>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {t(keys.kicker)}
      </p>
      <button
        type="button"
        disabled={disabled}
        aria-label={t(keys.hint)}
        className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-lg border border-accent-info/30 bg-zinc-900/60 p-3 text-left transition-all hover:bg-zinc-900/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={openSheet}
      >
        <span className="text-sm font-semibold leading-snug tracking-tight text-zinc-100">
          {gradeName}
        </span>
        <span
          className="ml-3 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-info/80"
          aria-hidden
        >
          +
        </span>
      </button>

      <LadderInfoSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={gradeName}
        body={gradeDesc}
      />
    </>
  );
};

export default HomologationGradeBadge;
