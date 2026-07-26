import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { UnitSystem } from '../../logic/core/unitConverters';

export interface UnitSystemToggleProps {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
  className?: string;
  /** When true, use compact labels for tight tool headers. */
  compact?: boolean;
}

/**
 * Segmented Metric | Imperial control for profile / tools.
 * Presentational only — persistence lives in `useUnit` / unitPreferenceStore.
 */
const UnitSystemToggle: FC<UnitSystemToggleProps> = ({
  value,
  onChange,
  className = '',
  compact = false,
}) => {
  const { t } = useTranslation('common');
  const metricLabel = compact
    ? t('units.system.metricShort')
    : t('units.system.metric');
  const imperialLabel = compact
    ? t('units.system.imperialShort')
    : t('units.system.imperial');

  return (
    <div
      className={`inline-flex rounded-lg border border-zinc-700/90 bg-black/30 p-0.5 ${className}`}
      role="group"
      aria-label={t('units.system.aria')}
    >
      <button
        type="button"
        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors sm:px-3 ${
          value === 'metric'
            ? 'bg-zinc-100 text-zinc-950'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
        aria-pressed={value === 'metric'}
        onClick={() => onChange('metric')}
      >
        {metricLabel}
      </button>
      <button
        type="button"
        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors sm:px-3 ${
          value === 'imperial'
            ? 'bg-zinc-100 text-zinc-950'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
        aria-pressed={value === 'imperial'}
        onClick={() => onChange('imperial')}
      >
        {imperialLabel}
      </button>
    </div>
  );
};

export default UnitSystemToggle;
