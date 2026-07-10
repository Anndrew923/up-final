import { type FC, FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import type { DynoIntelChatStatus } from '../../hooks/useDynoIntelChat';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import {
  DYNO_INTEL_SHEET_PANEL_TRANSITION,
  DYNO_INTEL_SHEET_PANEL_HEIGHT_CLASS,
  DYNO_INTEL_SHEET_SCRIM_TRANSITION,
  DYNO_INTEL_SHEET_SLIDE_MS,
  dynoIntelSheetPanelVisible,
  dynoIntelSheetScrimVisible,
} from '../../lib/dynoIntelTriggerMotion';
import { cn } from '../../lib/cn';
import { splitDynoIntelCommentaryParagraphs } from '../../logic/core/dynoIntelCommentaryFormat';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import type { DynoIntelPaywallReason } from '../../types/dynoIntelPaywall';
import type { DynoIntelLogEntry } from '../../logic/core/dynoIntelLogTypes';
import type { DynoIntelDisplayMeta } from '../../logic/core/resolveDynoIntelDisplayMeta';
import DynoIntelDisplayCards from './DynoIntelDisplayCards';
import DynoIntelPaywallView from './DynoIntelPaywallView';
import DynoIntelSuggestionChips from './DynoIntelSuggestionChips';
import DynoIntelTelemetryLogAccordion from './DynoIntelTelemetryLogAccordion';
import type { DynoIntelSuggestionItem } from '../../logic/core/buildDynoIntelSuggestions';

export type DynoIntelSheetView = 'chat' | 'paywall';

export interface DynoIntelBottomSheetProps {
  open: boolean;
  onClose: () => void;
  view: DynoIntelSheetView;
  paywallReason: DynoIntelPaywallReason;
  weakestAxisLabel: string;
  paywallScoreLabel: string;
  paywallBusy: boolean;
  paywallBillingError: boolean;
  onPaywallSubscribe: () => void;
  onPaywallDismiss: () => void;
  consoleLabel: string;
  remaining: number;
  limit: number;
  commentary: string;
  displayMeta?: DynoIntelDisplayMeta | null;
  status: DynoIntelChatStatus;
  errorMessage: string | null;
  onSubmitQuestion: (question: string) => void;
  suggestionItems?: readonly DynoIntelSuggestionItem[];
  showSuggestionChips?: boolean;
  suggestionGroupAriaLabel?: string;
  onSuggestionSelect?: (question: string) => void;
  telemetryLogs: DynoIntelLogEntry[];
  telemetryLogCap: number | null;
  isProTelemetry: boolean;
}

const DynoIntelBottomSheet: FC<DynoIntelBottomSheetProps> = ({
  open,
  onClose,
  view,
  paywallReason,
  weakestAxisLabel,
  paywallScoreLabel,
  paywallBusy,
  paywallBillingError,
  onPaywallSubscribe,
  onPaywallDismiss,
  consoleLabel,
  remaining,
  limit,
  commentary,
  displayMeta = null,
  status,
  errorMessage,
  onSubmitQuestion,
  suggestionItems = [],
  showSuggestionChips = false,
  suggestionGroupAriaLabel,
  onSuggestionSelect,
  telemetryLogs,
  telemetryLogCap,
  isProTelemetry,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const [draft, setDraft] = useState('');
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const commentaryParagraphs = useMemo(
    () => splitDynoIntelCommentaryParagraphs(commentary),
    [commentary]
  );

  useShellScrollLock(mounted);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (reducedMotion) {
        setVisible(true);
        return;
      }
      let cancelled = false;
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) setVisible(true);
        });
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(raf);
      };
    }

    setVisible(false);
    const timer = window.setTimeout(
      () => setMounted(false),
      reducedMotion ? 0 : DYNO_INTEL_SHEET_SLIDE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'paywall') {
          onPaywallDismiss();
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPaywallDismiss, open, view]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || status === 'loading' || status === 'typing') return;
    onSubmitQuestion(trimmed);
    setDraft('');
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex flex-col justify-end',
        Z_INDEX_CLASS.dynoIntelSheet,
      )}
      role="presentation"
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-black/70 backdrop-blur-md',
          DYNO_INTEL_SHEET_SCRIM_TRANSITION,
          dynoIntelSheetScrimVisible(visible),
          !visible && 'pointer-events-none',
        )}
        aria-label={t('dynoIntel.close')}
        onClick={view === 'paywall' ? onPaywallDismiss : onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden rounded-t-2xl border border-cyan-500/25 bg-zinc-950/92 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl',
          DYNO_INTEL_SHEET_PANEL_HEIGHT_CLASS,
          DYNO_INTEL_SHEET_PANEL_TRANSITION,
          dynoIntelSheetPanelVisible(visible),
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-zinc-800/80 px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-300/80">
                {consoleLabel}
              </p>
              <h2 id={titleId} className="text-base font-semibold tracking-tight text-zinc-50">
                {t('dynoIntel.sheetTitle')}
              </h2>
            </div>
            {view === 'chat' ? (
              <p className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 font-mono text-[10px] text-zinc-300">
                {t('dynoIntel.quotaLabel', { remaining, limit })}
              </p>
            ) : null}
          </div>
        </header>

        {view === 'paywall' ? (
          <DynoIntelPaywallView
            reason={paywallReason}
            weakestAxisLabel={weakestAxisLabel}
            scoreLabel={paywallScoreLabel}
            busy={paywallBusy}
            billingError={paywallBillingError}
            onSubscribe={onPaywallSubscribe}
            onDismiss={onPaywallDismiss}
          />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3 [-webkit-overflow-scrolling:touch]">
              {status === 'loading' ? (
                <p className="text-sm text-zinc-400">{t('dynoIntel.loading')}</p>
              ) : null}
              {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
              <DynoIntelDisplayCards displayMeta={displayMeta} />
              {commentaryParagraphs.length > 0 ? (
                <div className="space-y-3 text-sm leading-7 text-zinc-100">
                  {commentaryParagraphs.map((paragraph, index) => (
                    <p key={index} className={index > 0 ? 'mt-3' : undefined}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                !errorMessage &&
                status !== 'loading' && (
                  <div className="text-xs leading-relaxed text-slate-400">
                    <p>
                      {t('dynoIntel.welcomeIntroduction.line1Prefix')}
                      <span className="font-semibold text-[#DFFF00]">
                        {t('dynoIntel.welcomeIntroduction.line1Highlight')}
                      </span>
                      {t('dynoIntel.welcomeIntroduction.line1Suffix')}
                    </p>
                    <p className="mt-1">{t('dynoIntel.welcomeIntroduction.line2')}</p>
                    <p className="mt-1">
                      {t('dynoIntel.welcomeIntroduction.line3Prefix')}
                      <span className="font-semibold text-[#DFFF00]">
                        {t('dynoIntel.welcomeIntroduction.line3Highlight')}
                      </span>
                      {t('dynoIntel.welcomeIntroduction.line3Suffix')}
                    </p>
                    <p className="mt-1 text-zinc-500">{t('dynoIntel.welcomeIntroduction.line4')}</p>
                  </div>
                )
              )}
              <DynoIntelTelemetryLogAccordion
                entries={telemetryLogs}
                logCap={telemetryLogCap}
                isPro={isProTelemetry}
              />
            </div>

            <footer className="shrink-0 border-t border-zinc-800/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <DynoIntelSuggestionChips
                items={suggestionItems}
                visible={showSuggestionChips}
                disabled={status === 'loading' || status === 'typing'}
                groupAriaLabel={suggestionGroupAriaLabel}
                onSelect={(query) => onSuggestionSelect?.(query)}
              />
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('dynoIntel.inputPlaceholder')}
                  disabled={status === 'loading' || status === 'typing'}
                  className="min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'typing' || !draft.trim()}
                  className="min-h-11 shrink-0 rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-4 text-sm font-semibold text-cyan-100 disabled:opacity-40"
                >
                  {t('dynoIntel.send')}
                </button>
              </form>
            </footer>
          </>
        )}
      </section>
    </div>,
    document.body
  );
};

export default DynoIntelBottomSheet;
