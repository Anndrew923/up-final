import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OptionSelectSheet from '../components/home/OptionSelectSheet';
import { useOneRmCalculatorPage } from '../hooks/useOneRmCalculatorPage';

export interface OneRmCalculatorPageProps {
  onBack?: () => void;
}

const OneRmCalculatorPage: FC<OneRmCalculatorPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const {
    weightInput,
    repsInput,
    method,
    setWeightInput,
    setRepsInput,
    setMethod,
    estimatedOneRmKg,
  } = useOneRmCalculatorPage();
  const methodOptions = [
    { value: 'average', label: t('tools.calculators.oneRm.methods.average') },
    { value: 'epley', label: t('tools.calculators.oneRm.methods.epley') },
    { value: 'brzycki', label: t('tools.calculators.oneRm.methods.brzycki') },
    { value: 'lombardi', label: t('tools.calculators.oneRm.methods.lombardi') },
  ] as const;

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('tools.calculators.oneRm.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
              {t('tools.calculators.oneRm.title')}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              {t('tools.calculators.oneRm.subtitle')}
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
                {t('tools.calculators.oneRm.weightLabel')}
              </span>
              <input
                type="number"
                inputMode="decimal"
                className="ui-input"
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                placeholder={t('tools.calculators.oneRm.weightPlaceholder')}
              />
            </label>

            <label className="space-y-2 text-sm text-zinc-300">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.oneRm.repsLabel')}
              </span>
              <input
                type="number"
                inputMode="numeric"
                className="ui-input"
                value={repsInput}
                onChange={(event) => setRepsInput(event.target.value)}
                placeholder={t('tools.calculators.oneRm.repsPlaceholder')}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-zinc-300">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('tools.calculators.oneRm.methodLabel')}
            </span>
            <OptionSelectSheet
              value={method}
              onChange={(next) => setMethod((next || 'average') as typeof method)}
              placeholder={t('tools.calculators.oneRm.methods.average')}
              title={t('tools.calculators.oneRm.methodSheetTitle')}
              options={methodOptions}
            />
          </label>

          <div className="rounded-xl border border-accent-primary/25 bg-gradient-to-br from-bg-panel to-bg-card px-4 py-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {t('tools.calculators.oneRm.resultLabel')}
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold text-accent-primary">
              {estimatedOneRmKg > 0
                ? t('tools.calculators.oneRm.resultValue', { value: estimatedOneRmKg.toFixed(1) })
                : t('tools.calculators.oneRm.resultEmpty')}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {t('tools.calculators.oneRm.hint')}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default OneRmCalculatorPage;
