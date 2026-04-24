import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OptionSelectSheet from '../components/home/OptionSelectSheet';
import { usePlateCalculatorPage } from '../hooks/usePlateCalculatorPage';

export interface PlateCalculatorPageProps {
  onBack?: () => void;
}

const PlateCalculatorPage: FC<PlateCalculatorPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const {
    unit,
    barbellPreset,
    plateSetPreset,
    targetTotalInput,
    barWeightInput,
    setUnit,
    setBarbellPreset,
    setPlateSetPreset,
    setTargetTotalInput,
    setBarWeightInput,
    usesCustomBarWeight,
    resolvedBarWeightDisplay,
    picksDisplay,
    perSideDisplay,
    leftoverDisplay,
    isExactMatch,
    hasResult,
    activePlateSetDisplay,
  } = usePlateCalculatorPage();
  const unitOptions = [
    { value: 'kg', label: t('tools.calculators.plates.unitOptions.kg') },
    { value: 'lb', label: t('tools.calculators.plates.unitOptions.lb') },
  ] as const;
  const barbellPresetOptions = [
    { value: 'olympic', label: t('tools.calculators.plates.barbellOptions.olympic') },
    { value: 'women', label: t('tools.calculators.plates.barbellOptions.women') },
    { value: 'technique', label: t('tools.calculators.plates.barbellOptions.technique') },
    { value: 'custom', label: t('tools.calculators.plates.barbellOptions.custom') },
  ] as const;
  const plateSetPresetOptions = [
    { value: 'commercial', label: t('tools.calculators.plates.plateSetOptions.commercial') },
    { value: 'competition', label: t('tools.calculators.plates.plateSetOptions.competition') },
    { value: 'homeBasic', label: t('tools.calculators.plates.plateSetOptions.homeBasic') },
  ] as const;
  const unitLabel = t(`tools.calculators.plates.unitOptions.${unit}`);

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('tools.calculators.plates.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
              {t('tools.calculators.plates.title')}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              {t('tools.calculators.plates.subtitle')}
            </p>
          </div>
          <button type="button" className="ui-btn" onClick={onBack ?? (() => navigate(-1))}>
            {t('back')}
          </button>
        </header>

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-zinc-300">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.plates.unitLabel')}
              </span>
              <OptionSelectSheet
                value={unit}
                onChange={(next) => setUnit((next || 'kg') as typeof unit)}
                placeholder={t('tools.calculators.plates.unitOptions.kg')}
                title={t('tools.calculators.plates.unitSheetTitle')}
                options={unitOptions}
                allowEmpty={false}
              />
            </label>
            <label className="space-y-2 text-sm text-zinc-300">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.plates.plateSetLabel')}
              </span>
              <OptionSelectSheet
                value={plateSetPreset}
                onChange={(next) => setPlateSetPreset((next || 'commercial') as typeof plateSetPreset)}
                placeholder={t('tools.calculators.plates.plateSetOptions.commercial')}
                title={t('tools.calculators.plates.plateSetSheetTitle')}
                options={plateSetPresetOptions}
                allowEmpty={false}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-zinc-300">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('tools.calculators.plates.barbellTypeLabel')}
            </span>
            <OptionSelectSheet
              value={barbellPreset}
              onChange={(next) => setBarbellPreset((next || 'olympic') as typeof barbellPreset)}
              placeholder={t('tools.calculators.plates.barbellOptions.olympic')}
              title={t('tools.calculators.plates.barbellSheetTitle')}
              options={barbellPresetOptions}
              allowEmpty={false}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-zinc-300">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.plates.targetLabel', { unit: unitLabel })}
              </span>
              <input
                type="number"
                inputMode="decimal"
                className="ui-input"
                value={targetTotalInput}
                onChange={(event) => setTargetTotalInput(event.target.value)}
                placeholder={t('tools.calculators.plates.targetPlaceholder')}
              />
            </label>

            {usesCustomBarWeight ? (
              <label className="space-y-2 text-sm text-zinc-300">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('tools.calculators.plates.barLabel', { unit: unitLabel })}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="ui-input"
                  value={barWeightInput}
                  onChange={(event) => setBarWeightInput(event.target.value)}
                  placeholder={t('tools.calculators.plates.barPlaceholder')}
                />
              </label>
            ) : (
              <div className="space-y-2 text-sm text-zinc-300">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('tools.calculators.plates.barResolvedLabel')}
                </span>
                <div className="ui-input flex min-h-[2.75rem] items-center text-zinc-100">
                  {t('tools.calculators.plates.barResolvedValue', {
                    value: resolvedBarWeightDisplay.toFixed(2),
                    unit: unitLabel,
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-accent-primary/25 bg-gradient-to-br from-bg-panel to-bg-card px-4 py-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {t('tools.calculators.plates.perSideLabel')}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-accent-primary">
              {perSideDisplay > 0
                ? t('tools.calculators.plates.perSideValue', { value: perSideDisplay.toFixed(2), unit: unitLabel })
                : t('tools.calculators.plates.resultEmpty')}
            </p>

            {hasResult ? (
              <ul className="mt-4 space-y-2">
                {picksDisplay.map((pick) => (
                  <li
                    key={pick.plateValue}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-300">
                      {t('tools.calculators.plates.plateRow', { value: pick.plateValue.toFixed(2), unit: unitLabel })}
                    </span>
                    <span className="font-mono text-zinc-100">{`× ${pick.count}`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-zinc-500">{t('tools.calculators.plates.inputHint')}</p>
            )}

            {hasResult && !isExactMatch ? (
              <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                {t('tools.calculators.plates.leftoverWarning', {
                  value: leftoverDisplay.toFixed(2),
                  unit: unitLabel,
                })}
              </p>
            ) : null}

            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              {t('tools.calculators.plates.activePlateSet', {
                values: activePlateSetDisplay.map((value) => value.toFixed(2)).join(' / '),
                unit: unitLabel,
              })}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PlateCalculatorPage;
