import { useEffect, useId, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useAndroidBackDismiss } from '../../hooks/useAndroidBackDismiss';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import type { GuildDoc, GuildMemberSnapshot } from '../../types/guild';
import type { GuildCallableFailureReason } from '../../services/guildCallableService';

export interface CoachManageDrawerProps {
  open: boolean;
  onClose: () => void;
  guild: GuildDoc;
  members: GuildMemberSnapshot[];
  coachUid: string;
  busy: boolean;
  actionError: GuildCallableFailureReason | null;
  onKick: (uid: string) => Promise<unknown>;
  onRename: (input: { name?: string; tag?: string }) => Promise<unknown>;
  onDisband: () => Promise<unknown>;
  onClearError: () => void;
}

const CoachManageDrawer: FC<CoachManageDrawerProps> = ({
  open,
  onClose,
  guild,
  members,
  coachUid,
  busy,
  actionError,
  onKick,
  onRename,
  onDisband,
  onClearError,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const [nameDraft, setNameDraft] = useState(guild.name);
  const [tagDraft, setTagDraft] = useState(guild.tag);
  const [kickTarget, setKickTarget] = useState<GuildMemberSnapshot | null>(null);
  const [disbandConfirm, setDisbandConfirm] = useState(false);

  useShellScrollLock(open);
  useAndroidBackDismiss(open, onClose);

  useEffect(() => {
    if (!open) return;
    setNameDraft(guild.name);
    setTagDraft(guild.tag);
    setKickTarget(null);
    setDisbandConfirm(false);
    onClearError();
  }, [open, guild.name, guild.tag, onClearError]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const roster = members.filter((m) => m.uid !== coachUid);

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.toolResultModal} flex items-end justify-center ui-modal-safe-shell sm:items-center`}
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-200">
            {t('crew.manage.title')}
          </h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            onClick={onClose}
          >
            {t('crew.manage.close')}
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('crew.manage.roster')}
            </h3>
            {roster.length === 0 ? (
              <p className="text-sm text-zinc-500">—</p>
            ) : (
              <ul className="space-y-2">
                {roster.map((m) => (
                  <li
                    key={m.uid}
                    className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-black/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-100">{m.displayName}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{m.ladderScore.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-rose-500/40 px-2 py-1 text-xs font-semibold text-rose-300 disabled:opacity-40"
                      disabled={busy}
                      onClick={() => setKickTarget(m)}
                    >
                      {t('crew.manage.kick')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('crew.manage.renameTitle')}
            </h3>
            <input
              type="text"
              maxLength={24}
              value={nameDraft}
              disabled={busy}
              onChange={(e) => {
                onClearError();
                setNameDraft(e.target.value);
              }}
              className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500/50 focus:outline-none"
            />
            <h3 className="pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('crew.manage.tagTitle')}
            </h3>
            <input
              type="text"
              maxLength={4}
              value={tagDraft}
              disabled={busy}
              onChange={(e) => {
                onClearError();
                setTagDraft(e.target.value.toUpperCase());
              }}
              className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 font-mono text-sm uppercase tracking-wider text-zinc-100 focus:border-cyan-500/50 focus:outline-none"
            />
            <button
              type="button"
              className="ui-btn ui-btn-primary w-full disabled:opacity-40"
              disabled={busy}
              onClick={() => void onRename({ name: nameDraft, tag: tagDraft })}
            >
              {busy ? t('crew.manage.renaming') : t('crew.manage.renameCta')}
            </button>
          </section>

          <section className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              {t('crew.manage.dangerTitle')}
            </h3>
            {!disbandConfirm ? (
              <button
                type="button"
                className="w-full rounded-xl border border-rose-500/50 px-3 py-2 text-sm font-semibold text-rose-200 disabled:opacity-40"
                disabled={busy}
                onClick={() => setDisbandConfirm(true)}
              >
                {t('crew.manage.disbandCta')}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-rose-100/90">
                  {t('crew.manage.disbandConfirmBody')}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-300"
                    onClick={() => setDisbandConfirm(false)}
                  >
                    {t('crew.leave.cancel')}
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-rose-500/60 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-40"
                    disabled={busy}
                    onClick={() => void onDisband()}
                  >
                    {busy ? t('crew.manage.disbanding') : t('crew.manage.disbandConfirm')}
                  </button>
                </div>
              </div>
            )}
          </section>

          {actionError ? (
            <p role="alert" className="text-sm text-rose-300">
              {t(`crew.errors.${actionError}`)}
            </p>
          ) : null}
        </div>

        {kickTarget ? (
          <div className="ui-modal-safe-footer border-t border-zinc-800 px-4 py-3">
            <p className="text-sm text-zinc-200">
              {t('crew.manage.kickConfirm', { name: kickTarget.displayName })}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-300"
                onClick={() => setKickTarget(null)}
              >
                {t('crew.leave.cancel')}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border border-rose-500/50 px-3 py-2 text-xs font-semibold text-rose-200 disabled:opacity-40"
                disabled={busy}
                onClick={() => {
                  void onKick(kickTarget.uid).then((result) => {
                    // WHY: Keep confirm open on failure so coach can retry without re-picking the member.
                    if (
                      result &&
                      typeof result === 'object' &&
                      'ok' in result &&
                      (result as { ok: boolean }).ok
                    ) {
                      setKickTarget(null);
                    }
                  });
                }}
              >
                {busy ? t('crew.manage.kicking') : t('crew.manage.kick')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

export default CoachManageDrawer;
