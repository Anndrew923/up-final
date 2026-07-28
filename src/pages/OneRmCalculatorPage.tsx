import { useCallback, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OptionSelectSheet from '../components/home/OptionSelectSheet';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import ToolResultModal, {
  type ToolResultModalOneRmPayload,
} from '../components/tools/ToolResultModal';
import UnitSystemToggle from '../components/units/UnitSystemToggle';
import { useOneRmCalculatorPage } from '../hooks/useOneRmCalculatorPage';
import { useToolResultReveal } from '../hooks/useToolResultReveal';
import { useUnit } from '../hooks/useUnit';
import { onInputEnterKey, scrollFocusedInputIntoView } from '../lib/formKeyboard';

export interface OneRmCalculatorPageProps {
  onBack?: () => void;
}

const OneRmCalculatorPage: FC<OneRmCalculatorPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { unitSystem, setUnitSystem, labels, displayWeight } = useUnit();
  const {
    weightInput,
    repsInput,
    method,
    setWeightInput,
    setRepsInput,
    setMethod,
    estimatedOneRmKg,
    estimatedOneRmDisplay,
  } = useOneRmCalculatorPage();
  const { displayValue, isBlocking, modalOpen, reveal, closeModal } = useToolResultReveal({
    haptic: 'medium',
  });
  const [modalPayload, setModalPayload] = useState<ToolResultModalOneRmPayload | null>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);

  const canCalculate = estimatedOneRmKg > 0;
  const previewDisplay =
    displayValue !== null ? displayWeight(displayValue) : estimatedOneRmDisplay;

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
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-8">
        <AssessmentPageHeader
          kicker={t('tools.calculators.oneRm.kicker')}
          title={t('tools.calculators.oneRm.title')}
          backDisabled={isBlocking}
          onBack={onBack ?? (() => navigate(-1))}
        />

        <fieldset disabled={isBlocking} className="min-w-0 border-0 p-0">
          <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.unitLabel')}
              </span>
              <UnitSystemToggle
                value={unitSystem}
                onChange={setUnitSystem}
                compact
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('tools.calculators.oneRm.weightLabel', { unit: labels.weight })}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  enterKeyHint="next"
                  className="ui-input"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                  onFocus={(event) => scrollFocusedInputIntoView(event.currentTarget)}
                  onKeyDown={(event) =>
                    onInputEnterKey(event, () => repsInputRef.current?.focus())
                  }
                  placeholder={t('tools.calculators.oneRm.weightPlaceholder')}
                />
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('tools.calculators.oneRm.repsLabel')}
                </span>
                <input
                  ref={repsInputRef}
                  type="number"
                  inputMode="numeric"
                  enterKeyHint="done"
                  className="ui-input"
                  value={repsInput}
                  onChange={(event) => setRepsInput(event.target.value)}
                  onFocus={(event) => scrollFocusedInputIntoView(event.currentTarget)}
                  onKeyDown={(event) => onInputEnterKey(event, () => void handleCalculate())}
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

            <button
              type="button"
              onClick={() => void handleCalculate()}
              disabled={!canCalculate || isBlocking}
              className="ui-btn ui-btn-primary w-full min-h-12 whitespace-nowrap text-base font-semibold disabled:cursor-not-allowed"
            >
              {t('tools.calculators.oneRm.calculate')}
            </button>

            <div className="rounded-xl border border-accent-primary/25 bg-gradient-to-br from-bg-panel to-bg-card px-4 py-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.oneRm.resultLabel')}
              </p>
              <p
                className={`mt-2 font-mono font-semibold text-accent-primary tabular-nums ${
                  isBlocking && !modalOpen ? 'text-4xl sm:text-5xl' : 'text-3xl'
                }`}
              >
                {previewDisplay > 0
                  ? t('tools.calculators.oneRm.resultValue', {
                      value: previewDisplay.toFixed(1),
                      unit: labels.weight,
                    })
                  : t('tools.calculators.oneRm.resultEmpty')}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                {t('tools.calculators.oneRm.hint')}
              </p>
            </div>
          </section>
        </fieldset>
      </ShellFlowStack>

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
