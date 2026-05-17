import { useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OptionSelectSheet from '../components/home/OptionSelectSheet';
import ToolResultModal, { type ToolResultModalOneRmPayload } from '../components/tools/ToolResultModal';
import { useOneRmCalculatorPage } from '../hooks/useOneRmCalculatorPage';
import { useToolResultReveal } from '../hooks/useToolResultReveal';

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
  const { displayValue, isBlocking, modalOpen, reveal, closeModal } = useToolResultReveal({ haptic: 'medium' });
  const [modalPayload, setModalPayload] = useState<ToolResultModalOneRmPayload | null>(null);

  const canCalculate = estimatedOneRmKg > 0;
  const previewKg = displayValue ?? estimatedOneRmKg;

  const methodOptions = useMemo(
    () =>
      [
        { value: 'average', label: t('tools.calculators.oneRm.methods.average') },
        { value: 'epley', label: t('tools.calculators.oneRm.methods.epley') },
        { value: 'brzycki', label: t('tools.calculators.oneRm.methods.brzycki') },
        { value: 'lombardi', label: t('tools.calculators.oneRm.methods.lombardi') },
      ] as const,
    [t]
  );

  const handleCalculate = useCallback(async () => {
    if (!canCalculate) return;
    const snapshot: ToolResultModalOneRmPayload = { oneRmKg: estimatedOneRmKg };
    const opened = await reveal(estimatedOneRmKg, canCalculate);
    if (opened) setModalPayload(snapshot);
  }, [canCalculate, estimatedOneRmKg, reveal]);

  const handleCloseModal = useCallback(() => {
    closeModal();
    setModalPayload(null);
  }, [closeModal]);

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
          <button type="button" className="ui-btn" onClick={onBack ?? (() => navigate(-1))} disabled={isBlocking}>
            {t('back')}
          </button>
        </header>

        <fieldset disabled={isBlocking} className="min-w-0 border-0 p-0">
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
                allowEmpty={false}
              />
            </label>

            <div className="rounded-xl border border-accent-primary/25 bg-gradient-to-br from-bg-panel to-bg-card px-4 py-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.oneRm.resultLabel')}
              </p>
              <p
                className={`mt-2 font-mono font-semibold text-accent-primary tabular-nums ${
                  isBlocking && !modalOpen ? 'text-4xl sm:text-5xl' : 'text-3xl'
                }`}
              >
                {previewKg > 0
                  ? t('tools.calculators.oneRm.resultValue', { value: previewKg.toFixed(1) })
                  : t('tools.calculators.oneRm.resultEmpty')}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                {t('tools.calculators.oneRm.hint')}
              </p>
            </div>

            <button
              type="button"
              className="ui-btn ui-btn-primary w-full min-h-12 text-base font-semibold"
              disabled={!canCalculate || isBlocking}
              onClick={() => void handleCalculate()}
            >
              {t('tools.calculators.oneRm.calculate')}
            </button>
          </section>
        </fieldset>
      </div>

      <ToolResultModal
        variant="oneRm"
        open={modalOpen}
        onClose={handleCloseModal}
        payload={modalPayload}
      />
    </main>
  );
};

export default OneRmCalculatorPage;
