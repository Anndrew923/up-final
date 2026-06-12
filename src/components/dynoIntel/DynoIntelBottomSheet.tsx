import { type FC, FormEvent, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import type { DynoIntelChatStatus } from '../../hooks/useDynoIntelChat';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import type { DynoIntelMode } from '../../logic/core/dynoIntelTypes';
import { hasProAccess } from '../../logic/core/entitlement';
import type { EntitlementState } from '../../types/entitlement';
import type { DynoIntelPaywallReason } from '../../types/dynoIntelPaywall';
import DynoIntelPaywallView from './DynoIntelPaywallView';

export type DynoIntelSheetView = 'chat' | 'paywall';

export interface DynoIntelChipView {
  id: string;
  label: string;
  mode: DynoIntelMode;
  onSelect: () => void;
  locked?: boolean;
}

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
  mode: DynoIntelMode;
  onModeChange: (mode: DynoIntelMode) => void;
  entitlement: EntitlementState;
  commentary: string;
  actionDirective: string;
  status: DynoIntelChatStatus;
  errorMessage: string | null;
  chips: DynoIntelChipView[];
  onSubmitQuestion: (question: string) => void;
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
  mode,
  onModeChange,
  entitlement,
  commentary,
  actionDirective,
  status,
  errorMessage,
  chips,
  onSubmitQuestion,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const [draft, setDraft] = useState('');
  const isPro = hasProAccess(entitlement);

  useShellScrollLock(open);

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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.dynoIntelSheet} flex flex-col justify-end`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        aria-label={t('dynoIntel.close')}
        onClick={view === 'paywall' ? onPaywallDismiss : onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[60dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-cyan-500/25 bg-zinc-950/92 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
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

          {view === 'chat' && isPro ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(['single-axis', 'cross-axis', 'weight-simulation'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onModeChange(value)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    mode === value
                      ? 'border-cyan-400/60 bg-cyan-950/50 text-cyan-100'
                      : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  {t(
                    `dynoIntel.modes.${value === 'single-axis' ? 'singleAxis' : value === 'cross-axis' ? 'crossAxis' : 'weightSimulation'}`
                  )}
                </button>
              ))}
            </div>
          ) : null}
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
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [-webkit-overflow-scrolling:touch]">
              {status === 'loading' ? (
                <p className="text-sm text-zinc-400">{t('dynoIntel.loading')}</p>
              ) : null}
              {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
              {commentary ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
                  {commentary}
                </p>
              ) : (
                !errorMessage &&
                status !== 'loading' && (
                  <p className="text-sm text-zinc-500">{t('dynoIntel.inputPlaceholder')}</p>
                )
              )}
              {actionDirective ? (
                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                    {t('dynoIntel.actionKicker')}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{actionDirective}</p>
                </div>
              ) : null}
            </div>

            <footer className="shrink-0 border-t border-zinc-800/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={status === 'loading' || status === 'typing'}
                    onClick={chip.onSelect}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      chip.locked
                        ? 'border-zinc-700/80 bg-zinc-950/60 text-zinc-500 hover:border-cyan-500/30'
                        : 'border-zinc-600 bg-zinc-900/80 text-zinc-200 hover:border-cyan-500/40'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
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
