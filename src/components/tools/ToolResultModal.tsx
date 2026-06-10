import { useEffect, useId, useMemo, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { resolvePerformanceAura } from '../../logic/core/performanceAura';
import type { PlateDisplayPick } from '../../types/trainingToolsDisplay';
import { AURA_THEME, auraNeonCssVars } from '../assessment/auraThemeTokens';
import {
  TOOL_ONE_RM_AURA_STRENGTH_SCORE,
  buildTrainingPercentRows,
  expandPlateBlocks,
  formatToolWeight,
} from './toolResultConstants';

export interface ToolResultModalOneRmPayload {
  oneRmKg: number;
}

export interface ToolResultModalPlatesPayload {
  unitLabel: string;
  barWeight: number;
  perSide: number;
  picks: PlateDisplayPick[];
  isExactMatch: boolean;
  leftover: number;
}

export type ToolResultModalProps =
  | {
      variant: 'oneRm';
      open: boolean;
      onClose: () => void;
      payload: ToolResultModalOneRmPayload | null;
    }
  | {
      variant: 'plates';
      open: boolean;
      onClose: () => void;
      payload: ToolResultModalPlatesPayload | null;
    };

function PlateBlock({ value, unitLabel }: { value: number; unitLabel: string }) {
  return (
    <span
      className="inline-flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 flex-col items-center justify-center rounded-md border-2 border-accent-primary/70 bg-zinc-950 px-1 py-1 text-center shadow-[0_0_12px_rgba(255,140,0,0.15)]"
      aria-label={`${formatToolWeight(value)} ${unitLabel}`}
    >
      <span className="font-mono text-sm font-bold leading-none text-zinc-50">
        {formatToolWeight(value)}
      </span>
    </span>
  );
}

interface OneRmResultBodyProps {
  titleId: string;
  oneRmKg: number;
  strengthAuraStyle: ReturnType<typeof auraNeonCssVars>;
}

function OneRmResultBody({ titleId, oneRmKg, strengthAuraStyle }: OneRmResultBodyProps) {
  const { t } = useTranslation('common');
  const percentRows = buildTrainingPercentRows(oneRmKg);

  return (
    <>
      <header className="space-y-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
          {t('tools.calculators.resultModal.oneRm.kicker')}
        </p>
        <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
          {t('tools.calculators.resultModal.oneRm.title')}
        </h2>
        <p
          className="font-mono text-5xl font-bold tabular-nums text-zinc-50 text-aura-neon sm:text-6xl"
          style={strengthAuraStyle}
        >
          {t('tools.calculators.resultModal.oneRm.heroValue', {
            value: oneRmKg.toFixed(1),
          })}
        </p>
      </header>

      <div className="mt-6 border-t border-zinc-800/90 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t('tools.calculators.resultModal.oneRm.loadSpecLabel')}
        </p>
        <ul
          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label={t('tools.calculators.resultModal.oneRm.loadSpecLabel')}
        >
          {percentRows.map((row) => (
            <li
              key={row.percent}
              className="flex flex-col items-center justify-center rounded-lg border border-zinc-800/90 bg-black/25 p-3 text-center"
              aria-label={t('tools.calculators.resultModal.oneRm.loadSpecRowAria', {
                percent: row.percent,
                value: row.weightKg.toFixed(1),
              })}
            >
              <span className="whitespace-nowrap text-sm font-semibold text-zinc-100 md:text-base">
                {row.percent}%
              </span>
              <span className="mt-1 whitespace-nowrap font-mono text-xs text-zinc-400 md:text-sm">
                {t('tools.calculators.resultModal.oneRm.weightKgLine', {
                  value: row.weightKg.toFixed(1),
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

interface PlatesResultBodyProps {
  titleId: string;
  payload: ToolResultModalPlatesPayload;
}

function PlatesResultBody({ titleId, payload }: PlatesResultBodyProps) {
  const { t } = useTranslation('common');
  const blocks = expandPlateBlocks(payload.picks);

  return (
    <>
      <header className="space-y-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
          {t('tools.calculators.resultModal.plates.kicker')}
        </p>
        <h2 id={titleId} className="text-lg font-bold tracking-tight text-zinc-50">
          {t('tools.calculators.resultModal.plates.title')}
        </h2>
      </header>

      <div
        className="mt-6 overflow-x-auto"
        aria-label={t('tools.calculators.resultModal.plates.blueprintAria')}
      >
        <div className="flex min-w-min items-center justify-center gap-1.5 px-1">
          <div className="flex flex-row-reverse items-center gap-1">
            {blocks.map((value, index) => (
              <PlateBlock key={`l-${value}-${index}`} value={value} unitLabel={payload.unitLabel} />
            ))}
          </div>
          <div className="flex shrink-0 flex-col items-center px-1">
            <span className="whitespace-nowrap rounded border border-zinc-600 bg-zinc-900 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              {t('tools.calculators.resultModal.plates.barCenter')}
            </span>
            <span
              className="mt-1 h-2 w-16 rounded-full bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600"
              aria-hidden
            />
          </div>
          <div className="flex items-center gap-1">
            {blocks.map((value, index) => (
              <PlateBlock key={`r-${value}-${index}`} value={value} unitLabel={payload.unitLabel} />
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-accent-primary">
          {t('tools.calculators.resultModal.plates.barBase', {
            value: formatToolWeight(payload.barWeight),
            unit: payload.unitLabel,
          })}
        </p>
      </div>

      <div className="mt-6 space-y-3 border-t border-zinc-800/90 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t('tools.calculators.resultModal.plates.perSideHeading')}
        </p>
        <ul className="space-y-2">
          {payload.picks.map((pick) => (
            <li
              key={pick.plateValue}
              className="text-center font-mono text-xl font-bold text-zinc-50 sm:text-2xl"
            >
              {t('tools.calculators.resultModal.plates.loadLine', {
                value: formatToolWeight(pick.plateValue),
                unit: payload.unitLabel,
                count: pick.count,
              })}
            </li>
          ))}
        </ul>
        <p className="text-center font-mono text-2xl font-bold text-accent-primary sm:text-3xl">
          {t('tools.calculators.resultModal.plates.perSideTotal', {
            value: payload.perSide.toFixed(2),
            unit: payload.unitLabel,
          })}
        </p>
        {!payload.isExactMatch ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100/90">
            {t('tools.calculators.resultModal.plates.leftoverWarning', {
              value: payload.leftover.toFixed(2),
              unit: payload.unitLabel,
            })}
          </p>
        ) : null}
      </div>
    </>
  );
}

const ToolResultModal: FC<ToolResultModalProps> = (props) => {
  const { open, onClose, variant, payload } = props;
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const strengthAuraStyle = useMemo(() => {
    const auraKey = resolvePerformanceAura('strength', TOOL_ONE_RM_AURA_STRENGTH_SCORE);
    return auraNeonCssVars(AURA_THEME[auraKey].neonRgb);
  }, []);

  if (!open || !payload || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex items-center justify-center px-4`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label={t('tools.calculators.resultModal.closeAria')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg motion-reduce:animate-none animate-breakthrough-enter rounded-2xl border border-zinc-700/90 bg-bg-card/98 p-6 shadow-panel will-change-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        {variant === 'oneRm' ? (
          <OneRmResultBody
            titleId={titleId}
            oneRmKg={(payload as ToolResultModalOneRmPayload).oneRmKg}
            strengthAuraStyle={strengthAuraStyle}
          />
        ) : (
          <PlatesResultBody titleId={titleId} payload={payload as ToolResultModalPlatesPayload} />
        )}

        <div className="mt-6 flex justify-center">
          <button type="button" className="ui-btn ui-btn-primary min-w-[8rem]" onClick={onClose}>
            {t('tools.calculators.resultModal.dismiss')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ToolResultModal;
