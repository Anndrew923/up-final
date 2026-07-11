import { useEffect, useId, useRef, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { ladderIdentityInitial } from '../../logic/core/ladderUploadPolicy';
import { useLadderIdentityForm } from '../../hooks/useLadderIdentityForm';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export interface LadderIdentitySheetProps {
  open: boolean;
  onClose: () => void;
  /** Fires after a successful save so sync bars can resume the upload path. */
  onSaved?: () => void;
}

interface LadderIdentitySheetBodyProps {
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Body remounts each open so fields re-read local storage and save callbacks cannot leak
 * across open cycles (e.g. stale `justSaved` / toast windows).
 */
const LadderIdentitySheetBody: FC<LadderIdentitySheetBodyProps> = ({ onClose, onSaved }) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const formId = useId();
  const nameFieldId = `${formId}-displayName`;
  const fileInputId = `${formId}-avatarFile`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onSavedRef = useRef(onSaved);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSavedRef.current = onSaved;
    onCloseRef.current = onClose;
  }, [onSaved, onClose]);

  const {
    displayName,
    setDisplayName,
    previewAvatarUrl,
    pickAvatarFile,
    clearAvatar,
    handleSubmit,
    saving,
    errorKey,
    displayNameMax,
  } = useLadderIdentityForm({
    onSaveSuccess: () => {
      onSavedRef.current?.();
      onCloseRef.current();
    },
  });

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="relative z-10 max-h-[min(85vh,640px)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-50">
        {t('ladder.syncAll.identitySheetTitle')}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        {t('ladder.syncAll.identitySheetBody')}
      </p>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor={nameFieldId}>
          <span className="font-medium text-zinc-300">{t('home.ladderIdentity.displayName')}</span>
          <input
            id={nameFieldId}
            type="text"
            maxLength={displayNameMax}
            autoComplete="nickname"
            autoFocus
            className="ui-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-invalid={errorKey === 'home.ladderIdentity.errorEmptyName' || undefined}
          />
          <span className="text-[11px] text-zinc-500">
            {t('home.ladderIdentity.displayNameHint', { max: displayNameMax })}
          </span>
        </label>

        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">{t('home.ladderIdentity.avatar')}</span>
          <p className="text-[11px] text-zinc-500">{t('ladder.syncAll.identityAvatarOptional')}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent-info/40 bg-zinc-900 text-lg font-semibold uppercase text-zinc-200">
              {previewAvatarUrl ? (
                <img
                  src={previewAvatarUrl}
                  alt={t('home.ladderIdentity.avatarAlt')}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden>{ladderIdentityInitial(displayName)}</span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  void pickAvatarFile(f);
                  e.target.value = '';
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-btn py-1.5 text-xs"
                  aria-controls={fileInputId}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('home.ladderIdentity.pickAvatar')}
                </button>
                {previewAvatarUrl ? (
                  <button type="button" className="ui-btn py-1.5 text-xs" onClick={clearAvatar}>
                    {t('home.ladderIdentity.removeAvatar')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {errorKey ? (
          <p className="text-sm text-rose-300" role="alert">
            {t(errorKey)}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" className="ui-btn ui-btn-primary min-h-12 flex-1" disabled={saving}>
            {saving ? t('home.ladderIdentity.saving') : t('home.ladderIdentity.save')}
          </button>
          <button type="button" className="ui-btn min-h-12 flex-1" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </section>
  );
};

/**
 * In-place arena identity drawer — opened from sync CTAs when display name is missing.
 * WHY: Avoid full-page jumps; keep the user on the radar / assessment surface.
 */
const LadderIdentitySheet: FC<LadderIdentitySheetProps> = ({ open, onClose, onSaved }) => {
  const { t } = useTranslation('common');

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.optionSelectSheet} flex flex-col justify-end pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label={t('cancel')}
        onClick={onClose}
      />
      <LadderIdentitySheetBody onClose={onClose} onSaved={onSaved} />
    </div>,
    document.body
  );
};

export default LadderIdentitySheet;
