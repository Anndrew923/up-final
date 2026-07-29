import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getRun5KmSpecClockParams } from '../../logic/core/cardioScoring';
import { ReferenceDataBlock, ReferenceLabelledLine } from './AssessmentReferenceProse';

/** Immutable clocks from scoring norms — shared with DynoIntel methodology briefs. */
const RUN_5KM_SPEC_CLOCKS = getRun5KmSpecClockParams();

/**
 * Scheme C compact anchors for the 5 km reference disclosure.
 * WHY: Legal disclaimer lives in the global Terms Gatekeeper — keep this panel scoring-only.
 */
export const Run5KmSpecReferencePanel: FC = () => {
  const { t } = useTranslation('common');

  return (
    <ReferenceDataBlock
      className="text-xs leading-snug"
      aria-label={t('cardio.run5kmInfo.title')}
    >
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {t('cardio.run5kmSpec.baseLabel')}
        </p>
        <p className="font-mono tabular-nums font-medium text-zinc-100">
          {t('cardio.run5kmSpec.baseMale', {
            t100: RUN_5KM_SPEC_CLOCKS.maleT100,
            t0: RUN_5KM_SPEC_CLOCKS.maleT0,
          })}
        </p>
        <p className="font-mono tabular-nums font-medium text-zinc-100">
          {t('cardio.run5kmSpec.baseFemale', {
            t100: RUN_5KM_SPEC_CLOCKS.femaleT100,
            t0: RUN_5KM_SPEC_CLOCKS.femaleT0,
          })}
        </p>
      </div>
      <ReferenceLabelledLine label={t('cardio.run5kmSpec.overflowLabel')}>
        <span className="text-zinc-400">{t('cardio.run5kmSpec.overflow')}</span>
      </ReferenceLabelledLine>
      <ReferenceLabelledLine label={t('cardio.run5kmSpec.ceilingLabel')}>
        <span className="font-mono tabular-nums font-medium text-zinc-100">
          {t('cardio.run5kmSpec.ceiling', {
            maleFloor: RUN_5KM_SPEC_CLOCKS.maleFloor,
            femaleFloor: RUN_5KM_SPEC_CLOCKS.femaleFloor,
          })}
        </span>
      </ReferenceLabelledLine>
      <p className="border-t border-zinc-800/80 pt-2 text-[11px] leading-snug text-zinc-500">
        {t('cardio.run5kmSpec.specialtyNote')}
      </p>
    </ReferenceDataBlock>
  );
};

export default Run5KmSpecReferencePanel;
