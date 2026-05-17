import { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useBootSequenceRitual } from '../../hooks/useBootSequenceRitual';

export interface BootSequenceOverlayProps {
  active: boolean;
  onComplete: () => void;
}

const BootSequenceOverlay: FC<BootSequenceOverlayProps> = ({ active, onComplete }) => {
  const { t } = useTranslation('common');
  const {
    phase,
    spotlightRect,
    visibleText,
    typewriterDone,
    showIgnite,
    advancePhase,
    ignite,
  } = useBootSequenceRitual({ active, onComplete });

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (!active) return null;

  const phaseKicker = t(`onboarding.phase${phase}.kicker`);
  const showContinue = typewriterDone && phase < 3;
  const useSpotlightScrim = spotlightRect != null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] isolate"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.overlayAria')}
    >
      {useSpotlightScrim ? (
        <button
          type="button"
          className="pointer-events-auto absolute motion-reduce:transition-none motion-safe:transition-[top,left,width,height] motion-safe:duration-300"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            borderRadius: 16,
            boxShadow:
              '0 0 0 9999px rgba(0,0,0,0.9), 0 0 32px rgba(34,211,238,0.45), inset 0 0 0 2px rgba(34,211,238,0.75)',
          }}
          aria-label={t('onboarding.scrimDismissBlocked')}
          onClick={(event) => event.preventDefault()}
        />
      ) : (
        <button
          type="button"
          className="pointer-events-auto absolute inset-0 bg-black/88 motion-reduce:transition-none motion-safe:transition-opacity motion-safe:duration-300"
          aria-label={t('onboarding.scrimDismissBlocked')}
          onClick={(event) => event.preventDefault()}
        />
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-[calc(120px+env(safe-area-inset-bottom,0px))] flex justify-center px-6"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-accent-primary/35 bg-zinc-950/95 px-5 py-5 shadow-[0_0_48px_rgba(56,189,248,0.12),inset_0_1px_0_rgba(56,189,248,0.2)] backdrop-blur-md"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-primary/90">
            {phaseKicker}
          </p>
          <p className="mt-3 min-h-[5.5rem] text-sm leading-relaxed text-zinc-200 [text-shadow:0_0_14px_rgba(56,189,248,0.28)]">
            {visibleText}
            {!typewriterDone ? (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent-primary/80 align-middle motion-reduce:hidden" />
            ) : null}
          </p>

          <div className="mt-5 flex min-h-12 items-center justify-end gap-2">
            {showContinue ? (
              <button
                type="button"
                className="ui-btn border-accent-primary/50 text-accent-primary hover:bg-accent-primary/10"
                onClick={advancePhase}
              >
                {t('onboarding.next')}
              </button>
            ) : null}
            {showIgnite ? (
              <button
                type="button"
                className="ui-btn ui-btn-primary font-mono uppercase tracking-[0.2em] shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                onClick={ignite}
              >
                {t('onboarding.ignite')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BootSequenceOverlay;
