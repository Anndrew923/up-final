import { useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import {
  toGoldenRatioGaugeValues,
  type SomatotypeLabSnapshot,
} from '../../logic/core/somatotypeLab';
import SomatochartView from './SomatochartView';
import SomatotypeGapGauge from './SomatotypeGapGauge';
import SomatotypeScienceHelpSheet, {
  type SomatotypeScienceHelpKind,
} from './SomatotypeScienceHelpSheet';

export interface SomatotypeReportModalProps {
  open: boolean;
  onClose: () => void;
  snapshot: SomatotypeLabSnapshot | null;
  /** Remount token so point-A slide animation replays on each open. */
  animationKey: string;
}

/**
 * Full report sheet for the somatotype lab ritual — chart + gap gauge + notices.
 */
export const SomatotypeReportModal: FC<SomatotypeReportModalProps> = ({
  open,
  onClose,
  snapshot,
  animationKey,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [helpKind, setHelpKind] = useState<SomatotypeScienceHelpKind | null>(null);
  useFocusTrap(dialogRef, open && helpKind == null);
  useShellScrollLock(open);

  useEffect(() => {
    if (!open) setHelpKind(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (helpKind != null) {
        setHelpKind(null);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, helpKind]);

  if (!open || !snapshot || typeof document === 'undefined') return null;

  const snap = snapshot;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex items-end justify-center sm:items-center sm:px-4`}
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          aria-label={t('tools.somatotypeLab.report.closeAria')}
          onClick={() => {
            // Defense: never dismiss the report under an open science help overlay.
            if (helpKind != null) return;
            onClose();
          }}
        />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative z-10 flex max-h-[min(92vh,52rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-700/90 bg-bg-card/98 shadow-panel motion-reduce:animate-none animate-breakthrough-enter sm:rounded-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="shrink-0 space-y-1 border-b border-zinc-800 px-5 pb-4 pt-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent-primary">
              {t('tools.somatotypeLab.report.kicker')}
            </p>
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
              {t('tools.somatotypeLab.report.title')}
            </h2>
            <p className="pt-1 font-mono text-[11px] leading-snug text-zinc-400">
              {t('tools.somatotypeLab.report.tierLine', {
                tier: t(
                  `tools.somatotypeLab.physiqueLabels.${snap.gender}.${snap.physiqueTier}`
                ),
              })}
            </p>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {snap.maxTuned.legendaryArmMode ? (
              <p
                role="status"
                className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90"
              >
                {t('tools.somatotypeLab.legendaryNotice')}
              </p>
            ) : null}
            {snap.current.atypicalProportion ? (
              <p
                role="status"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90"
              >
                {t('tools.somatotypeLab.atypicalWarning')}
              </p>
            ) : null}

            <div className="flex justify-center">
              <SomatochartView
                key={animationKey}
                pointA={snap.currentPoint}
                pointB={snap.maxTuned.coordinates}
                pointGolden={snap.goldenRatio?.coordinates ?? null}
                gapBenchmark={snap.gapBenchmark}
              />
            </div>

            <SomatotypeGapGauge
              heightCm={snap.metrics.heightCm}
              wristCm={snap.metrics.wristCm}
              currentWeightKg={snap.metrics.weightKg}
              currentBodyFatPct={snap.metrics.bodyFatPct}
              currentArmGirthCm={snap.metrics.flexedArmGirthCm}
              currentSmmKg={snap.currentSmmKg}
              maxTotalWeightKg={snap.maxTuned.maxTotalWeightKg}
              maxBodyFatPct={snap.maxTuned.bodyFatPct}
              maxArmGirthCm={snap.maxTuned.armGirthMaxCm}
              maxSmmKg={snap.maxSmmKg}
              armGapCm={snap.armGapCm}
              smmGapKg={snap.smmGapKg}
              weightGapKg={snap.weightGapKg}
              beyondHumanLimits={snap.beyondHumanLimits}
              gender={snap.gender}
              guideMode={snap.guideMode}
              fatToLoseKg={snap.fatToLoseKg}
              goldenRatio={
                snap.goldenRatio ? toGoldenRatioGaugeValues(snap.goldenRatio) : null
              }
              onOpenSomatotypeHelp={() => setHelpKind('somatotype')}
              onOpenGoldenRatioHelp={() => setHelpKind('goldenRatio')}
            />
          </div>

          <div className="shrink-0 border-t border-zinc-800 px-5 py-4">
            <button type="button" className="ui-btn ui-btn-primary w-full" onClick={onClose}>
              {t('tools.somatotypeLab.report.dismiss')}
            </button>
          </div>
        </div>
      </div>

      <SomatotypeScienceHelpSheet
        open={helpKind != null}
        kind={helpKind}
        onClose={() => setHelpKind(null)}
      />
    </>,
    document.body
  );
};

export default SomatotypeReportModal;
