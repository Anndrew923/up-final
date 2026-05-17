import { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useBootSequenceRitual } from '../../hooks/useBootSequenceRitual';
import BootProfileBaselineForm from './BootProfileBaselineForm';

export interface BootSequenceOverlayProps {
  active: boolean;
  onComplete: () => void;
}

const BootSequenceOverlay: FC<BootSequenceOverlayProps> = ({ active, onComplete }) => {
  const { t } = useTranslation('common');
  const {
    step,
    variant,
    narrativePhase,
    spotlightRect,
    visibleText,
    typewriterDone,
    profileCommittedInBoot,
    canContinue,
    showIgnite,
    advancePhase,
    ignite,
    onProfileSaved,
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

  const phaseKicker =
    variant === 'profile_input'
      ? t('onboarding.profileInput.kicker')
      : narrativePhase
        ? t(`onboarding.phase${narrativePhase}.kicker`)
        : '';
  const showContinue = typewriterDone && step !== 'phase3';
  const useSpotlightScrim = spotlightRect != null;
  const isProfileStep = variant === 'profile_input';

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
        className={`pointer-events-none absolute inset-x-0 flex justify-center px-4 ${
          isProfileStep
            ? 'top-[max(5rem,env(safe-area-inset-top,0px))] bottom-[calc(88px+env(safe-area-inset-bottom,0px))]'
            : 'bottom-[calc(120px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <div
          className={`pointer-events-auto flex w-full max-w-md flex-col rounded-2xl border border-accent-primary/35 bg-zinc-950/95 shadow-[0_0_48px_rgba(56,189,248,0.12),inset_0_1px_0_rgba(56,189,248,0.2)] backdrop-blur-md ${
            isProfileStep ? 'max-h-full overflow-y-auto px-5 py-5' : 'px-5 py-5'
          }`}
        >
          <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-accent-primary/90">
            {phaseKicker}
          </p>
          <p className="mt-3 shrink-0 text-sm leading-relaxed text-zinc-200 [text-shadow:0_0_14px_rgba(56,189,248,0.28)]">
            {visibleText}
            {!typewriterDone ? (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent-primary/80 align-middle motion-reduce:hidden" />
            ) : null}
          </p>

          {isProfileStep && typewriterDone ? (
            <BootProfileBaselineForm
              onSaved={onProfileSaved}
              showComplete={profileCommittedInBoot}
            />
          ) : null}

          <div className="mt-5 flex min-h-12 shrink-0 items-center justify-end gap-2">
            {showContinue ? (
              <button
                type="button"
                className="ui-btn border-accent-primary/50 text-accent-primary hover:bg-accent-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={advancePhase}
                disabled={!canContinue}
                aria-disabled={!canContinue}
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
