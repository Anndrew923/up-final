import { type FC, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useAndroidBackDismiss } from '../../hooks/useAndroidBackDismiss';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import {
  formatLadderBlockedMicroUid,
  resolveLadderBlockedTitle,
} from '../../logic/core/ladderBlockList';
import { useLadderBlockStore } from '../../stores/ladderBlockStore';

export interface LadderBlockedUsersSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Local-only blocked UID manager (Settings).
 * WHY: Block hides rows from the ladder list — without this sheet there is no way to
 * reach `unblock`, because filtered users never reappear in preview modals.
 */
const LadderBlockedUsersSheet: FC<LadderBlockedUsersSheetProps> = ({ open, onClose }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const hydrate = useLadderBlockStore((s) => s.hydrate);
  const blockedEntries = useLadderBlockStore((s) => s.blockedEntries);
  const unblock = useLadderBlockStore((s) => s.unblock);

  useShellScrollLock(open);
  useAndroidBackDismiss(open, onClose);

  useEffect(() => {
    if (!open) return;
    hydrate();
  }, [open, hydrate]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.ladderBlockedUsersSheet} flex flex-col justify-end pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label={t('cancel')}
        onClick={onClose}
      />
      {/*
        WHY: Match LadderFilterSheet — outer overlay clears BottomNav + safe-area once;
        do not put ui-modal-safe-shell on the card (that token is for full-screen overlay shells).
      */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex min-h-0 w-full max-w-lg max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-bg-card shadow-panel sm:max-h-[min(88dvh,36rem)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WHY: Rigid 2-col grid — title must not shove cancel onto a second row on narrow widths. */}
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-4 pt-3 sm:pt-4">
          <h2
            id={titleId}
            className="min-w-0 text-sm font-semibold tracking-tight text-zinc-50 sm:text-base"
          >
            {t('settings.blocked_users_title')}
          </h2>
          <button
            type="button"
            className="ui-btn py-1 text-[11px] sm:py-1.5 sm:text-xs"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 [-webkit-overflow-scrolling:touch] sm:py-4">
          {blockedEntries.length === 0 ? (
            <p className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-4 text-sm text-zinc-400">
              {t('settings.blocked_empty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {blockedEntries.map((entry) => {
                const title = resolveLadderBlockedTitle(entry);
                const microUid = formatLadderBlockedMicroUid(entry.uid);
                // WHY: Legacy empty-name rows already use micro UID as title — avoid duplicate lines.
                const showMicroSubtitle = Boolean(entry.displayName.trim());
                return (
                  <li
                    key={entry.uid}
                    className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium text-zinc-100"
                        title={entry.displayName.trim() ? entry.uid : title}
                      >
                        {title}
                      </p>
                      {showMicroSubtitle ? (
                        <p
                          className="mt-0.5 truncate font-mono text-[10px] text-zinc-500"
                          title={entry.uid}
                        >
                          {microUid}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="ui-btn shrink-0 border-accent-info/40 py-1 text-[11px] text-accent-info hover:bg-accent-info/10 sm:text-xs"
                      onClick={() => unblock(entry.uid)}
                    >
                      {t('ladder.moderation.unblock')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
};

export default LadderBlockedUsersSheet;
