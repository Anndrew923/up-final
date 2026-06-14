import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useDynoIntelLocalTelemetry } from '../../hooks/useDynoIntelLocalTelemetry';

const DynoIntelLocalTelemetryPanel: FC = () => {
  const { t } = useTranslation('common');
  const rows = useDynoIntelLocalTelemetry();

  return (
    <section className="ui-card space-y-3">
      <div>
        <h2 className="ui-section-title">{t('dynoIntel.localTelemetry.title')}</h2>
        <p className="mt-1 text-xs text-zinc-400">{t('dynoIntel.localTelemetry.subtitle')}</p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-2"
          >
            <span className="text-sm text-zinc-200">
              {t(`dynoIntel.localTelemetry.rows.${row.id}`)}
            </span>
            <span className="flex items-center gap-2 text-xs font-medium">
              <span
                className={`inline-block h-2 w-2 rounded-full ${row.active ? 'bg-[#DFFF00]' : 'bg-red-500'}`}
                aria-hidden
              />
              <span aria-live="polite">
                {row.active
                  ? t('dynoIntel.localTelemetry.statusOn')
                  : t('dynoIntel.localTelemetry.statusOff')}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-zinc-500">
        {t('dynoIntel.localTelemetry.serverNote')}
      </p>
    </section>
  );
};

export default DynoIntelLocalTelemetryPanel;
