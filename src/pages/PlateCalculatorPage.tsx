import { useCallback, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import ToolResultModal, {
  type ToolResultModalPlatesPayload,
} from '../components/tools/ToolResultModal';
import UnitSystemToggle from '../components/units/UnitSystemToggle';
import { usePlateCalculatorPage } from '../hooks/usePlateCalculatorPage';
import { useToolResultReveal } from '../hooks/useToolResultReveal';
import { useUnit } from '../hooks/useUnit';
import { onInputEnterKey, scrollFocusedInputIntoView } from '../lib/formKeyboard';
import { recordTrainingFootprint } from '../services/trainingFootprintService';

const PlateCalculatorPage: FC = () => {
  const { t } = useTranslation('common');
  const { unitSystem, setUnitSystem, labels } = useUnit();
  const {
    targetTotalInput,
    barWeightInput,
    setTargetTotalInput,
    setBarWeightInput,
    resolvedBarWeightDisplay,
    picksDisplay,
    perSideDisplay,
    leftoverDisplay,
    isExactMatch,
    hasResult,
    activePlateSetDisplay,
  } = usePlateCalculatorPage();
  const { displayValue, isBlocking, modalOpen, reveal, closeModal } = useToolResultReveal({
    haptic: 'heavy',
  });
  const [modalPayload, setModalPayload] = useState<ToolResultModalPlatesPayload | null>(null);
  const barWeightInputRef = useRef<HTMLInputElement>(null);

  const unitLabel = labels.weight;
  const canCalculate = hasResult;
  const previewPerSide = displayValue ?? perSideDisplay;

  const handleCalculate = useCallback(async () => {
    if (!canCalculate) return;
    const snapshot: ToolResultModalPlatesPayload = {
      unitLabel,
      barWeight: resolvedBarWeightDisplay,
      perSide: perSideDisplay,
      picks: picksDisplay.map((pick) => ({ ...pick })),
      isExactMatch,
      leftover: leftoverDisplay,
    };
    const opened = await reveal(perSideDisplay, canCalculate);
    if (opened) {
      recordTrainingFootprint(1);
      setModalPayload(snapshot);
    }
  }, [
    canCalculate,
    isExactMatch,
    leftoverDisplay,
    perSideDisplay,
    picksDisplay,
    resolvedBarWeightDisplay,
    reveal,
    unitLabel,
  ]);

  const handleCloseModal = useCallback(() => {
    closeModal();
    setModalPayload(null);
  }, [closeModal]);

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-8">
        <AssessmentPageHeader
          kicker={t('tools.calculators.plates.kicker')}
          title={t('tools.calculators.plates.title')}
        />

        <fieldset disabled={isBlocking} className="min-w-0 border-0 p-0">
          <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.unitLabel')}
              </span>
              <UnitSystemToggle value={unitSystem} onChange={setUnitSystem} compact />
            </div>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.plates.targetLabel', { unit: unitLabel })}
              </span>
              <input
                type="number"
                inputMode="decimal"
                enterKeyHint="next"
                className="ui-input"
                value={targetTotalInput}
                onChange={(event) => setTargetTotalInput(event.target.value)}
                onFocus={(event) => scrollFocusedInputIntoView(event.currentTarget)}
                onKeyDown={(event) =>
                  onInputEnterKey(event, () => barWeightInputRef.current?.focus())
                }
                placeholder={t('tools.calculators.plates.targetPlaceholder')}
              />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.plates.barLabel', { unit: unitLabel })}
              </span>
              <input
                ref={barWeightInputRef}
                type="number"
                inputMode="decimal"
                enterKeyHint="done"
                className="ui-input"
                value={barWeightInput}
                onChange={(event) => setBarWeightInput(event.target.value)}
                onFocus={(event) => scrollFocusedInputIntoView(event.currentTarget)}
                onKeyDown={(event) => onInputEnterKey(event, () => void handleCalculate())}
                placeholder={t('tools.calculators.plates.barPlaceholder')}
              />
            </label>

            <button
              type="button"
              onClick={() => void handleCalculate()}
              disabled={!canCalculate || isBlocking}
              className="ui-btn ui-btn-primary w-full min-h-12 whitespace-nowrap text-base font-semibold disabled:cursor-not-allowed"
            >
              {t('tools.calculators.plates.calculate')}
            </button>

            <div className="rounded-xl border border-accent-primary/25 bg-gradient-to-br from-bg-panel to-bg-card px-4 py-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t('tools.calculators.plates.perSideLabel')}
              </p>
              <p
                className={`mt-2 font-mono font-semibold text-accent-primary tabular-nums ${
                  isBlocking && !modalOpen ? 'text-3xl sm:text-4xl' : 'text-2xl'
                }`}
              >
                {previewPerSide > 0
                  ? t('tools.calculators.plates.perSideValue', {
                      value: previewPerSide.toFixed(2),
                      unit: unitLabel,
                    })
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
                        {t('tools.calculators.plates.plateRow', {
                          value: pick.plateValue.toFixed(2),
                          unit: unitLabel,
                        })}
                      </span>
                      <span className="font-mono text-zinc-100">{`× ${pick.count}`}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-zinc-500">
                  {t('tools.calculators.plates.inputHint')}
                </p>
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
        </fieldset>
      </ShellFlowStack>

      <ToolResultModal
        variant="plates"
        open={modalOpen}
        onClose={handleCloseModal}
        payload={modalPayload}
      />
    </main>
  );
};

export default PlateCalculatorPage;
