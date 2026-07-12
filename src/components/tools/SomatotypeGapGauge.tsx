import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface SomatotypeGapGaugeProps {
  heightCm: number;
  wristCm: number;
  currentBodyFatPct: number;
  currentArmGirthCm: number;
  currentSmmKg: number;
  maxBodyFatPct: number;
  maxArmGirthCm: number;
  maxSmmKg: number;
  armGapCm: number;
  bodyFatGapPct: number;
  smmGapKg: number;
}

/**
 * Pure numeric gap panel — no vehicle/band naming; chassis code is height/wrist only.
 */
export const SomatotypeGapGauge: FC<SomatotypeGapGaugeProps> = ({
  heightCm,
  wristCm,
  currentBodyFatPct,
  currentArmGirthCm,
  currentSmmKg,
  maxBodyFatPct,
  maxArmGirthCm,
  maxSmmKg,
  armGapCm,
  bodyFatGapPct,
  smmGapKg,
}) => {
  const { t } = useTranslation('common');
  const fmt = (n: number, digits = 1) =>
    Number.isFinite(n) ? n.toFixed(digits) : '—';

  const hasArmHeadroom = armGapCm > 0.05;
  const hasSmmHeadroom = smmGapKg > 0.05;
  const hasBfCutRoom = bodyFatGapPct > 0.05;
  const upgradeKey =
    hasArmHeadroom || hasSmmHeadroom || hasBfCutRoom
      ? 'tools.somatotypeLab.gap.upgradeGuide'
      : 'tools.somatotypeLab.gap.upgradeGuideAtCeiling';

  return (
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 font-mono text-sm text-zinc-200">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary">
        {t('tools.somatotypeLab.gap.title', {
          height: fmt(heightCm, 0),
          wrist: fmt(wristCm, 1),
        })}
      </h3>

      <dl className="grid gap-2 text-[13px] leading-relaxed">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-zinc-900 pb-2">
          <dt className="text-zinc-500">{t('tools.somatotypeLab.gap.currentLabel')}</dt>
          <dd className="text-zinc-100">
            {t('tools.somatotypeLab.gap.currentValue', {
              bodyFat: fmt(currentBodyFatPct, 1),
              arm: fmt(currentArmGirthCm, 1),
              smm: fmt(currentSmmKg, 1),
            })}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-zinc-900 pb-2">
          <dt className="text-zinc-500">{t('tools.somatotypeLab.gap.maxLabel')}</dt>
          <dd className="text-emerald-300/90">
            {t('tools.somatotypeLab.gap.maxValue', {
              bodyFat: fmt(maxBodyFatPct, 1),
              arm: fmt(maxArmGirthCm, 1),
              smm: fmt(maxSmmKg, 1),
            })}
          </dd>
        </div>
      </dl>

      <p className="text-[13px] leading-relaxed text-zinc-300">
        {t(upgradeKey, {
          armGap: fmt(armGapCm, 1),
          smmGap: fmt(smmGapKg, 1),
          bfGap: fmt(bodyFatGapPct, 1),
        })}
      </p>
    </section>
  );
};

export default SomatotypeGapGauge;
