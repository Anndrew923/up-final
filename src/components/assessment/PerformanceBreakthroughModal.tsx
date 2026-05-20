import { useEffect, useId, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import type { PerformanceBreakthroughPayload } from '../../logic/core/performanceBreakthrough';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { AURA_THEME } from './auraThemeTokens';
import AuraReactiveFrame from './AuraReactiveFrame';
import TachometerMilestoneBar from './TachometerMilestoneBar';

export interface PerformanceBreakthroughModalProps {
  open: boolean;
  payload: PerformanceBreakthroughPayload | null;
  onClose: () => void;
}

const PerformanceBreakthroughModal: FC<PerformanceBreakthroughModalProps> = ({
  open,
  payload,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !payload || typeof document === 'undefined') return null;

  const theme = AURA_THEME[payload.auraKey];

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.performanceBreakthroughModal} flex items-center justify-center px-4`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label={t('assessment.breakthrough.closeAria')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md motion-reduce:animate-none animate-breakthrough-enter will-change-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        <AuraReactiveFrame auraKey={payload.auraKey}>
          <header className="space-y-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
              {t('assessment.breakthrough.kicker')}
            </p>
            {payload.rankLabel !== payload.title ? (
              <p className={`text-xs font-semibold tracking-wide text-aura-neon ${theme.text}`}>
                {payload.rankLabel}
              </p>
            ) : null}
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-zinc-50">
              {payload.title}
            </h2>
            <p className={`font-mono text-4xl font-bold tabular-nums text-aura-neon text-zinc-50`}>
              {payload.scoreDisplay}
            </p>
          </header>

          <p className="mt-4 text-center text-sm leading-relaxed text-zinc-300">
            {payload.summary}
          </p>

          <div className="mt-6 border-t border-zinc-800/90 pt-5">
            <TachometerMilestoneBar
              progress01={payload.milestone.progress01}
              remainingPoints={payload.milestone.remainingPoints}
              auraKey={payload.auraKey}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <button type="button" className="ui-btn ui-btn-primary min-w-[8rem]" onClick={onClose}>
              {t('assessment.breakthrough.dismiss')}
            </button>
          </div>
        </AuraReactiveFrame>
      </div>
    </div>,
    document.body
  );
};

export default PerformanceBreakthroughModal;
