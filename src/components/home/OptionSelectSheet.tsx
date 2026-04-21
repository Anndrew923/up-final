import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export interface OptionSelectItem<T extends string> {
  value: T;
  label: string;
}

export interface OptionSelectSheetProps<T extends string> {
  value: T | '';
  onChange: (next: T | '') => void;
  placeholder: string;
  title: string;
  options: readonly OptionSelectItem<T>[];
  'aria-invalid'?: boolean;
}

export default function OptionSelectSheet<T extends string>({
  value,
  onChange,
  placeholder,
  title,
  options,
  'aria-invalid': ariaInvalid,
}: OptionSelectSheetProps<T>) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const selectedLabel = options.find((x) => x.value === value)?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (next: T | '') => {
    onChange(next);
    setOpen(false);
  };

  const sheet =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex flex-col justify-end pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]"
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
            {title}
          </h2>

          <div className="mt-5 max-h-[56vh] overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-left text-base font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
                onClick={() => pick('')}
              >
                {placeholder}
              </button>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-left text-base font-medium text-zinc-100 transition hover:border-accent-info/50 hover:bg-zinc-800"
                  onClick={() => pick(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
        onClick={() => setOpen(true)}
      >
        <span className={value ? 'text-zinc-100' : 'text-zinc-500'}>{selectedLabel}</span>
        <span className="pointer-events-none text-zinc-500" aria-hidden>
          ▾
        </span>
      </button>
      {sheet}
    </>
  );
}

