import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';

export type GenderValue = '' | 'male' | 'female';

export interface GenderSelectSheetProps {
  value: GenderValue;
  onChange: (next: GenderValue) => void;
  'aria-invalid'?: boolean;
}

export default function GenderSelectSheet({
  value,
  onChange,
  'aria-invalid': ariaInvalid,
}: GenderSelectSheetProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const label =
    value === 'male'
      ? t('home.profile.male')
      : value === 'female'
        ? t('home.profile.female')
        : t('home.profile.selectGender');

  const pick = (next: GenderValue) => {
    onChange(next);
    setOpen(false);
  };

  const sheet =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      /* Reserve same bottom inset as AppShell (`layer-shell-scroll` pb) so sheet clears BottomNav + safe area. */
      <div
        className={`fixed inset-0 ${Z_INDEX_CLASS.genderSelectSheet} flex flex-col justify-end pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]`}
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          aria-label={t('cancel')}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-50">
            {t('home.profile.genderSheetTitle')}
          </h2>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              className="min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-left text-base font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
              onClick={() => pick('')}
            >
              {t('home.profile.selectGender')}
            </button>
            <button
              type="button"
              className="min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-left text-base font-medium text-zinc-100 transition hover:border-accent-info/50 hover:bg-zinc-800"
              onClick={() => pick('male')}
            >
              {t('home.profile.male')}
            </button>
            <button
              type="button"
              className="min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-left text-base font-medium text-zinc-100 transition hover:border-accent-info/50 hover:bg-zinc-800"
              onClick={() => pick('female')}
            >
              {t('home.profile.female')}
            </button>
          </div>

          <button
            type="button"
            className="mt-5 w-full min-h-12 rounded-xl border border-zinc-600 bg-transparent text-base font-semibold text-zinc-200 hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            {t('cancel')}
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        className="ui-input flex min-h-[2.75rem] items-center justify-between text-left text-base leading-snug"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={ariaInvalid || undefined}
        aria-required
        onClick={() => setOpen(true)}
      >
        <span className={value ? 'text-zinc-100' : 'text-zinc-500'}>{label}</span>
        <span className="pointer-events-none text-zinc-500" aria-hidden>
          ▾
        </span>
      </button>
      {sheet}
    </>
  );
}
