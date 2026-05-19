import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface AssessmentPageHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/**
 * Shared assessment page title row — grid keeps the back control pinned top-right
 * (matches Strength assessment) even when kicker/title/subtitle wrap on narrow viewports.
 */
export const AssessmentPageHeader: FC<AssessmentPageHeaderProps> = ({
  kicker,
  title,
  subtitle,
  onBack,
}) => {
  const { t } = useTranslation('common');

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">{kicker}</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{title}</h1>
        {subtitle ? (
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {onBack ? (
        <button type="button" className="ui-btn shrink-0 self-start" onClick={onBack}>
          {t('back')}
        </button>
      ) : null}
    </header>
  );
};
