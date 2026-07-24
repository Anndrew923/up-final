import { useEffect, useId, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export type SomatotypeScienceHelpKind = 'somatotype' | 'goldenRatio';

export interface SomatotypeScienceHelpSheetProps {
  open: boolean;
  kind: SomatotypeScienceHelpKind | null;
  onClose: () => void;
}

type AxisRow = { labelKey: string; bodyKey: string };

const SOMATOTYPE_AXES: readonly AxisRow[] = [
  { labelKey: 'endoLabel', bodyKey: 'endoBody' },
  { labelKey: 'mesoLabel', bodyKey: 'mesoBody' },
  { labelKey: 'ectoLabel', bodyKey: 'ectoBody' },
] as const;

type GoldenRow = { metricKey: string; maleKey: string; femaleKey: string };

const GOLDEN_ROWS: readonly GoldenRow[] = [
  { metricKey: 'rowWeight', maleKey: 'maleWeight', femaleKey: 'femaleWeight' },
  { metricKey: 'rowBf', maleKey: 'maleBf', femaleKey: 'femaleBf' },
  { metricKey: 'rowSmm', maleKey: 'maleSmm', femaleKey: 'femaleSmm' },
] as const;

/**
 * Nested morphology science help — structured list / table only (no HTML dump).
 * WHY: Sit above the report modal so (i) explainer never fights the parent sheet.
 */
export const SomatotypeScienceHelpSheet: FC<SomatotypeScienceHelpSheetProps> = ({
  open,
  kind,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const active = open && kind != null;
  useFocusTrap(dialogRef, active);
  useShellScrollLock(active);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [active, onClose]);

  if (!active || typeof document === 'undefined' || kind == null) return null;

  const ns = `tools.somatotypeLab.help.${kind}` as const;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.somatotypeScienceHelpSheet} flex items-end justify-center pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:items-center sm:px-4 sm:pt-[max(1rem,env(safe-area-inset-top,0px))] sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))]`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label={t('tools.somatotypeLab.help.closeAria')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(88vh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-zinc-700/90 bg-bg-card/95 shadow-panel sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2 pt-5">
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-zinc-50">
            {t(`${ns}.title`)}
          </h2>
          <p className="text-[13px] leading-relaxed text-zinc-400">{t(`${ns}.intro`)}</p>

          {kind === 'somatotype' ? (
            <ul className="space-y-2.5">
              {SOMATOTYPE_AXES.map((row) => (
                <li
                  key={row.labelKey}
                  className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 px-3 py-2.5"
                >
                  <p className="text-[12px] font-semibold tracking-wide text-accent-primary">
                    {t(`${ns}.${row.labelKey}`)}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-zinc-300">
                    {t(`${ns}.${row.bodyKey}`)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-800/90">
              <table className="w-full min-w-[18rem] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    <th className="px-3 py-2.5 font-medium">{t(`${ns}.colMetric`)}</th>
                    <th className="px-3 py-2.5 font-medium">{t(`${ns}.colMale`)}</th>
                    <th className="px-3 py-2.5 font-medium">{t(`${ns}.colFemale`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {GOLDEN_ROWS.map((row) => (
                    <tr key={row.metricKey} className="border-b border-zinc-900/90 last:border-0">
                      <th
                        scope="row"
                        className="whitespace-nowrap px-3 py-2.5 font-semibold text-amber-200/90"
                      >
                        {t(`${ns}.${row.metricKey}`)}
                      </th>
                      <td className="px-3 py-2.5 leading-snug text-zinc-200">
                        {t(`${ns}.${row.maleKey}`)}
                      </td>
                      <td className="px-3 py-2.5 leading-snug text-zinc-200">
                        {t(`${ns}.${row.femaleKey}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[13px] leading-relaxed text-zinc-400">{t(`${ns}.outro`)}</p>
        </div>

        <div className="ui-modal-safe-footer shrink-0 border-t border-zinc-800 px-5 sm:pb-4">
          <button type="button" className="ui-btn ui-btn-primary w-full" onClick={onClose}>
            {t('tools.somatotypeLab.help.dismiss')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SomatotypeScienceHelpSheet;
