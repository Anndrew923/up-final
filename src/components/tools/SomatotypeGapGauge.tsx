import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  SomatotypeGender,
  SomatotypeGuideMode,
} from '../../logic/core/somatotypeLab';

export interface SomatotypeGoldenRatioGaugeValues {
  weightKg: number;
  bodyFatPct: number;
  armGirthCm: number;
  smmKg: number;
}

export interface SomatotypeGapGaugeProps {
  heightCm: number;
  wristCm: number;
  currentWeightKg: number;
  currentBodyFatPct: number;
  currentArmGirthCm: number;
  currentSmmKg: number;
  maxTotalWeightKg: number;
  maxBodyFatPct: number;
  maxArmGirthCm: number;
  maxSmmKg: number;
  armGapCm: number;
  smmGapKg: number;
  weightGapKg: number;
  /** Peak-horizon transcendence — swaps upgrade guide for gender-tuned easter-egg copy. */
  beyondHumanLimits?: boolean;
  gender?: SomatotypeGender;
  /** Dual-track golden-ratio mid-target row between current and max-tuned. */
  goldenRatio?: SomatotypeGoldenRatioGaugeValues | null;
  /** Three-stage guide: cut / bulkToGolden / pushToLimit. */
  guideMode?: SomatotypeGuideMode;
  /** Cut-mode adipose mass to shed (1dp). */
  fatToLoseKg?: number;
  /** Opens Heath–Carter somatotype science help. */
  onOpenSomatotypeHelp?: () => void;
  /** Opens Golden Ratio formula help (only when golden row is shown). */
  onOpenGoldenRatioHelp?: () => void;
}

function resolveUpgradeGuideKey(
  guideMode: SomatotypeGuideMode,
  gender: SomatotypeGender
): string {
  const suffix = gender === 'female' ? 'female' : 'male';
  if (guideMode === 'cut') {
    return `tools.somatotypeLab.gap.upgradeGuideCut_${suffix}`;
  }
  if (guideMode === 'bulkToGolden') {
    return `tools.somatotypeLab.gap.upgradeGuideGolden_${suffix}`;
  }
  return `tools.somatotypeLab.gap.upgradeGuideLimit_${suffix}`;
}

const helpBtnClass =
  'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-600/90 bg-zinc-900/70 text-[11px] leading-none text-zinc-300 transition hover:border-zinc-400 hover:text-zinc-50';

/**
 * Pure numeric gap panel — height/wrist geometry ID only; no vehicle naming.
 */
export const SomatotypeGapGauge: FC<SomatotypeGapGaugeProps> = ({
  heightCm,
  wristCm,
  currentWeightKg,
  currentBodyFatPct,
  currentArmGirthCm,
  currentSmmKg,
  maxTotalWeightKg,
  maxBodyFatPct,
  maxArmGirthCm,
  maxSmmKg,
  armGapCm,
  smmGapKg,
  weightGapKg,
  beyondHumanLimits = false,
  gender = 'male',
  goldenRatio = null,
  guideMode = 'pushToLimit',
  fatToLoseKg = 0,
  onOpenSomatotypeHelp,
  onOpenGoldenRatioHelp,
}) => {
  const { t } = useTranslation('common');
  const fmt = (n: number, digits = 1) =>
    Number.isFinite(n) ? n.toFixed(digits) : '—';

  const showGolden = goldenRatio != null;
  const upgradeKey = resolveUpgradeGuideKey(guideMode, gender);
  const beyondTitleKey =
    gender === 'female'
      ? 'tools.somatotypeLab.gap.beyondTitle_female'
      : 'tools.somatotypeLab.gap.beyondTitle_male';
  const beyondBodyKey =
    gender === 'female'
      ? 'tools.somatotypeLab.gap.beyondBody_female'
      : 'tools.somatotypeLab.gap.beyondBody_male';

  return (
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 font-mono text-sm text-zinc-200">
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary">
          {t('tools.somatotypeLab.gap.title', {
            height: fmt(heightCm, 0),
            wrist: fmt(wristCm, 1),
          })}
        </h3>
        {onOpenSomatotypeHelp ? (
          <button
            type="button"
            className={helpBtnClass}
            aria-label={t('tools.somatotypeLab.help.somatotype.infoAria')}
            onClick={onOpenSomatotypeHelp}
          >
            ⓘ
          </button>
        ) : null}
      </div>

      <dl className="grid gap-2 text-[13px] leading-relaxed">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-zinc-900 pb-2">
          <dt className="text-zinc-500">{t('tools.somatotypeLab.gap.currentLabel')}</dt>
          <dd className="text-zinc-100">
            {t('tools.somatotypeLab.gap.currentValue', {
              weight: fmt(currentWeightKg, 1),
              bodyFat: fmt(currentBodyFatPct, 1),
              arm: fmt(currentArmGirthCm, 1),
              smm: fmt(currentSmmKg, 1),
            })}
          </dd>
        </div>
        {showGolden ? (
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-zinc-900 pb-2">
            <dt className="flex min-w-0 items-center gap-2 text-amber-300/90">
              <span className="min-w-0">{t('tools.somatotypeLab.gap.goldenLabel')}</span>
              {onOpenGoldenRatioHelp ? (
                <button
                  type="button"
                  className={helpBtnClass}
                  aria-label={t('tools.somatotypeLab.help.goldenRatio.infoAria')}
                  onClick={onOpenGoldenRatioHelp}
                >
                  ⓘ
                </button>
              ) : null}
            </dt>
            <dd className="text-amber-100/90">
              {t('tools.somatotypeLab.gap.goldenValue', {
                weight: fmt(goldenRatio.weightKg, 1),
                bodyFat: fmt(goldenRatio.bodyFatPct, 1),
                arm: fmt(goldenRatio.armGirthCm, 1),
                smm: fmt(goldenRatio.smmKg, 1),
              })}
            </dd>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-zinc-900 pb-2">
          <dt className="text-zinc-500">{t('tools.somatotypeLab.gap.maxLabel')}</dt>
          <dd className="text-emerald-300/90">
            {t('tools.somatotypeLab.gap.maxValue', {
              weight: fmt(maxTotalWeightKg, 1),
              bodyFat: fmt(maxBodyFatPct, 1),
              arm: fmt(maxArmGirthCm, 1),
              smm: fmt(maxSmmKg, 1),
            })}
          </dd>
        </div>
      </dl>

      {beyondHumanLimits ? (
        <div className="space-y-1.5 border border-amber-500/35 bg-amber-500/10 px-3 py-2.5">
          <p className="text-[12px] font-semibold tracking-wide text-amber-100/95">{t(beyondTitleKey)}</p>
          <p className="text-[13px] leading-relaxed text-amber-50/90">{t(beyondBodyKey)}</p>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-zinc-300">
          {t(upgradeKey, {
            fatToLoseKg: fmt(fatToLoseKg, 1),
            armGap: fmt(armGapCm, 1),
            smmGap: fmt(smmGapKg, 1),
            weightGap: fmt(weightGapKg, 1),
          })}
        </p>
      )}
    </section>
  );
};

export default SomatotypeGapGauge;
