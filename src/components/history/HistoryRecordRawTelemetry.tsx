import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildHistoryRawTelemetryViewModel,
  formatClockMmSs,
  type HistoryRawTelemetryViewModel,
} from '../../logic/core/historyRawTelemetryViewModel';
import type { AssessmentRawInputsV1 } from '../../types/assessmentRawInputs';

export interface HistoryRecordRawTelemetryProps {
  rawInputs?: AssessmentRawInputsV1;
  /** Optional prebuilt model — tests / parents can inject without re-parsing. */
  viewModel?: HistoryRawTelemetryViewModel;
  className?: string;
}

const VALUE_CLASS = 'font-mono text-sm tabular-nums text-zinc-100';
const LABEL_CLASS = 'text-[10px] uppercase tracking-wide text-zinc-500';
const CARD_CLASS =
  'rounded-lg border border-zinc-800/90 bg-zinc-950/60 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';
const SECTION_TITLE_CLASS =
  'mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary/90';

const MetricRow: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2">
    {/* Label may wrap; never truncate. Values stay nowrap tabular so numbers never clip. */}
    <dt className={`${LABEL_CLASS} min-w-0 pr-2`}>{label}</dt>
    <dd className={`${VALUE_CLASS} shrink-0 whitespace-nowrap text-right`}>{children}</dd>
  </div>
);

const UnitSuffix: FC<{ text: string }> = ({ text }) => (
  <span className="ml-1 text-[10px] text-zinc-500">{text}</span>
);

const HistoryRecordRawTelemetry: FC<HistoryRecordRawTelemetryProps> = ({
  rawInputs,
  viewModel: injected,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const model = injected ?? buildHistoryRawTelemetryViewModel(rawInputs);

  if (!model.hasDisplayableTelemetry) {
    const hintKey = model.hasRawArchive
      ? 'history.rawTelemetry.archiveEmpty'
      : 'history.rawTelemetry.scoresOnly';
    return (
      <p
        className={`rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2.5 text-xs text-zinc-500 ${className}`}
        data-testid="history-raw-scores-only"
      >
        {t(hintKey)}
      </p>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-2 ${className}`}
      data-testid="history-raw-telemetry-grid"
    >
      {model.strengthLifts.length > 0 ? (
        <section
          className={CARD_CLASS}
          aria-label={t('history.rawTelemetry.sections.strength')}
        >
          <h3 className={SECTION_TITLE_CLASS}>{t('history.rawTelemetry.sections.strength')}</h3>
          <ul className="grid grid-cols-1 gap-1.5">
            {model.strengthLifts.map((lift) => (
              <li
                key={lift.liftKey}
                className="flex items-center justify-between gap-2 border-b border-zinc-800/60 py-1 last:border-b-0"
              >
                {/* Label may wrap; set readout stays nowrap so 1RM never clips. */}
                <span className="min-w-0 pr-2 text-xs text-zinc-400">
                  {t(`history.rawTelemetry.lifts.${lift.liftKey}`)}
                </span>
                <span className={`${VALUE_CLASS} shrink-0 whitespace-nowrap text-right text-xs`}>
                  {t('history.rawTelemetry.liftSet', {
                    weight: lift.weightKg,
                    reps: lift.reps,
                    oneRm: lift.oneRmKg,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.power ? (
        <section className={CARD_CLASS} aria-label={t('history.rawTelemetry.sections.power')}>
          <h3 className={SECTION_TITLE_CLASS}>{t('history.rawTelemetry.sections.power')}</h3>
          <dl className="space-y-1.5">
            {model.power.verticalJumpCm != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.verticalJump')}>
                {model.power.verticalJumpCm}
                <UnitSuffix text={t('history.rawTelemetry.units.cm')} />
              </MetricRow>
            ) : null}
            {model.power.standingLongJumpCm != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.standingLongJump')}>
                {model.power.standingLongJumpCm}
                <UnitSuffix text={t('history.rawTelemetry.units.cm')} />
              </MetricRow>
            ) : null}
            {model.power.sprintSeconds != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.sprint')}>
                {model.power.sprintSeconds}
                <UnitSuffix text={t('history.rawTelemetry.units.sec')} />
              </MetricRow>
            ) : null}
          </dl>
        </section>
      ) : null}

      {model.cardio ? (
        <section className={CARD_CLASS} aria-label={t('history.rawTelemetry.sections.cardio')}>
          <h3 className={SECTION_TITLE_CLASS}>{t('history.rawTelemetry.sections.cardio')}</h3>
          <dl className="space-y-1.5">
            {model.cardio.cooperDistanceM != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.cooperDistance')}>
                {model.cardio.cooperDistanceM}
                <UnitSuffix text={t('history.rawTelemetry.units.m')} />
              </MetricRow>
            ) : null}
            {model.cardio.run5Km ? (
              <>
                <MetricRow label={t('history.rawTelemetry.fields.run5KmTime')}>
                  {formatClockMmSs(model.cardio.run5Km.totalSeconds)}
                </MetricRow>
                {model.cardio.run5Km.paceInSeconds != null ? (
                  <MetricRow label={t('history.rawTelemetry.fields.run5KmPace')}>
                    {formatClockMmSs(model.cardio.run5Km.paceInSeconds)}
                    <UnitSuffix text={t('history.rawTelemetry.units.perKm')} />
                  </MetricRow>
                ) : null}
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      {model.physique ? (
        <section className={CARD_CLASS} aria-label={t('history.rawTelemetry.sections.physique')}>
          <h3 className={SECTION_TITLE_CLASS}>{t('history.rawTelemetry.sections.physique')}</h3>
          <dl className="space-y-1.5">
            {model.physique.bodyFatPct != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.bodyFatPct')}>
                {model.physique.bodyFatPct}
                <UnitSuffix text={t('history.rawTelemetry.units.pct')} />
              </MetricRow>
            ) : null}
            {model.physique.smmKg != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.smm')}>
                {model.physique.smmKg}
                <UnitSuffix text={t('history.rawTelemetry.units.kg')} />
              </MetricRow>
            ) : null}
            {model.physique.armCircumferenceCm != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.armCircumference')}>
                {model.physique.armCircumferenceCm}
                <UnitSuffix text={t('history.rawTelemetry.units.cm')} />
              </MetricRow>
            ) : null}
            {model.physique.heightCm != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.height')}>
                {model.physique.heightCm}
                <UnitSuffix text={t('history.rawTelemetry.units.cm')} />
              </MetricRow>
            ) : null}
            {model.physique.weightKg != null ? (
              <MetricRow label={t('history.rawTelemetry.fields.weight')}>
                {model.physique.weightKg}
                <UnitSuffix text={t('history.rawTelemetry.units.kg')} />
              </MetricRow>
            ) : null}
          </dl>
        </section>
      ) : null}

      {model.gripPeakKg != null ? (
        <section className={CARD_CLASS} aria-label={t('history.rawTelemetry.sections.grip')}>
          <h3 className={SECTION_TITLE_CLASS}>{t('history.rawTelemetry.sections.grip')}</h3>
          <dl>
            <MetricRow label={t('history.rawTelemetry.fields.gripPeak')}>
              {model.gripPeakKg}
              <UnitSuffix text={t('history.rawTelemetry.units.kg')} />
            </MetricRow>
          </dl>
        </section>
      ) : null}
    </div>
  );
};

export default HistoryRecordRawTelemetry;
