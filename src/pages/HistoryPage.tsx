import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SIX_AXIS_METRICS } from '../types/scoring';
import { useHistoryStore } from '../stores/historyStore';

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : iso;
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const records = useHistoryStore((s) => s.records);
  const loadLocalHistory = useHistoryStore((s) => s.loadLocalHistory);

  useEffect(() => {
    loadLocalHistory();
  }, [loadLocalHistory]);

  return (
    <main className="ui-shell max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-xl border border-accent-primary/35 bg-bg-card shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
        <div className="border-b border-zinc-800 px-5 py-6 md:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
            {t('history.kicker', { ns: 'common' })}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">
            {t('history.title', { ns: 'common' })}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{t('history.subtitle', { ns: 'common' })}</p>
        </div>

        <div className="overflow-x-auto px-3 py-4 md:px-6">
          {records.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              {t('history.empty', { ns: 'common' })}
            </p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-left text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="whitespace-nowrap px-2 py-2">
                    {t('history.colDate', { ns: 'common' })}
                  </th>
                  <th className="whitespace-nowrap px-2 py-2">
                    {t('history.colOverall', { ns: 'common' })}
                  </th>
                  {SIX_AXIS_METRICS.map((m) => (
                    <th key={m} className="whitespace-nowrap px-1 py-2 font-normal">
                      {t(`history.shortAxis.${m}`, { ns: 'common' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800/80 hover:bg-bg-panel/40">
                    <td className="max-w-[10rem] truncate px-2 py-2 font-mono text-[11px] text-zinc-400">
                      {formatSavedAt(row.createdAt)}
                    </td>
                    <td className="px-2 py-2 font-mono tabular-nums text-accent-info">
                      {row.overallScore}
                    </td>
                    {SIX_AXIS_METRICS.map((m) => (
                      <td key={m} className="px-1 py-2 font-mono tabular-nums text-zinc-400">
                        {row.scores[m] != null
                          ? row.scores[m]
                          : t('history.valueEmpty', { ns: 'common' })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
