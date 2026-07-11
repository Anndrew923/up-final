import { useEffect, useId, useMemo, useRef } from 'react';
import { useHomeFormCopy } from '../../hooks/useHomeFormCopy';
import { normalizeLadderDisplayName } from '../../services/ladderIdentityService';
import { ladderIdentityInitial } from '../../logic/core/ladderUploadPolicy';
import { useHomeSectionExpanded } from '../../hooks/useHomeSectionExpanded';
import { useLadderIdentityForm } from '../../hooks/useLadderIdentityForm';
import HomeCollapsibleCard from './HomeCollapsibleCard';

export default function HomeLadderIdentitySection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const nameFieldId = `${formId}-displayName`;
  const fileInputId = `${formId}-avatarFile`;
  const ladderCopy = useHomeFormCopy('ladderIdentity');
  const {
    t,
    displayName,
    setDisplayName,
    previewAvatarUrl,
    pickAvatarFile,
    clearAvatar,
    handleSubmit,
    saving,
    justSaved,
    errorKey,
    displayNameMax,
  } = useLadderIdentityForm();

  const savedName = normalizeLadderDisplayName(displayName);
  const hasSavedIdentity = savedName.length > 0;
  const forceExpanded = Boolean(errorKey);
  const { expanded, toggle, canCollapse, setExpanded } = useHomeSectionExpanded({
    sectionId: 'ladder-identity',
    forceExpanded,
    defaultExpanded: !hasSavedIdentity,
  });

  useEffect(() => {
    if (justSaved && hasSavedIdentity) {
      setExpanded(false);
    }
  }, [hasSavedIdentity, justSaved, setExpanded]);

  const collapsedSummary = useMemo(() => {
    const label = savedName || ladderCopy('collapsedEmpty');
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent-info/40 bg-zinc-900 text-sm font-semibold uppercase text-zinc-200">
          {previewAvatarUrl ? (
            <img
              src={previewAvatarUrl}
              alt=""
              className="h-full w-full object-cover"
              aria-hidden
            />
          ) : (
            <span aria-hidden>{ladderIdentityInitial(savedName)}</span>
          )}
        </div>
        <span className="truncate font-medium text-zinc-200">{label}</span>
      </div>
    );
  }, [ladderCopy, previewAvatarUrl, savedName]);

  return (
    <HomeCollapsibleCard
      instanceId="home-ladder-identity"
      expanded={expanded}
      onToggle={toggle}
      canCollapse={canCollapse}
      kicker={ladderCopy('kicker')}
      title={ladderCopy('title')}
      summarySlot={collapsedSummary}
      toggleExpandLabel={ladderCopy('toggleExpand')}
      toggleCollapseLabel={ladderCopy('toggleCollapse')}
    >
      <form
        className="space-y-5 border-t border-zinc-800/90 pt-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor={nameFieldId}>
          <span className="font-medium text-zinc-300">
            {t('home.ladderIdentity.displayName', { ns: 'common' })}
          </span>
          <input
            id={nameFieldId}
            type="text"
            maxLength={displayNameMax}
            autoComplete="nickname"
            className="ui-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-invalid={errorKey === 'home.ladderIdentity.errorEmptyName' || undefined}
          />
          <span className="text-[11px] text-zinc-500">
            {t('home.ladderIdentity.displayNameHint', { ns: 'common', max: displayNameMax })}
          </span>
        </label>

        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">
            {t('home.ladderIdentity.avatar', { ns: 'common' })}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent-info/40 bg-zinc-900 text-lg font-semibold uppercase text-zinc-200">
              {previewAvatarUrl ? (
                <img
                  src={previewAvatarUrl}
                  alt={t('home.ladderIdentity.avatarAlt', { ns: 'common' })}
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
                  {t('home.ladderIdentity.pickAvatar', { ns: 'common' })}
                </button>
                {previewAvatarUrl ? (
                  <button type="button" className="ui-btn py-1.5 text-xs" onClick={clearAvatar}>
                    {t('home.ladderIdentity.removeAvatar', { ns: 'common' })}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {errorKey ? (
          <p className="text-sm text-rose-300" role="alert">
            {t(errorKey, { ns: 'common' })}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="ui-btn ui-btn-primary" disabled={saving}>
            {saving
              ? t('home.ladderIdentity.saving', { ns: 'common' })
              : t('home.ladderIdentity.save', { ns: 'common' })}
          </button>
          {justSaved ? (
            <span className="text-sm font-medium text-emerald-400/90">
              {t('home.ladderIdentity.saved', { ns: 'common' })}
            </span>
          ) : null}
        </div>
      </form>
    </HomeCollapsibleCard>
  );
}
