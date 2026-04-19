import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FFMI_TABLE_FEMALE_ORDER,
  FFMI_TABLE_MALE_ORDER,
} from '../../logic/core/ffmiTableRows';

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <span className="text-zinc-500" aria-hidden>
      {expanded ? '▲' : '▼'}
    </span>
  );
}

export const FfmiEducationPanels: FC = () => {
  const { t } = useTranslation('common');
  const [infoOpen, setInfoOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-800 bg-bg-card/90 shadow-panel backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-zinc-100 hover:bg-zinc-800/40"
          aria-expanded={infoOpen}
          onClick={() => setInfoOpen((o) => !o)}
        >
          <span className="text-base font-semibold tracking-tight">{t('ffmi.info.whatIsTitle')}</span>
          <Chevron expanded={infoOpen} />
        </button>
        {infoOpen ? (
          <div className="border-t border-zinc-800 px-5 pb-5 pt-3 text-sm leading-relaxed text-zinc-300">
            <p>{t('ffmi.info.whatIsIntro')}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-400">
              <li>{t('ffmi.info.caveats.tall')}</li>
              <li>{t('ffmi.info.caveats.highFat')}</li>
              <li>{t('ffmi.info.caveats.heavy')}</li>
            </ol>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-bg-card/90 shadow-panel backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-zinc-100 hover:bg-zinc-800/40"
          aria-expanded={tableOpen}
          onClick={() => setTableOpen((o) => !o)}
        >
          <span className="text-base font-semibold tracking-tight">{t('ffmi.table.sectionTitle')}</span>
          <Chevron expanded={tableOpen} />
        </button>
        {tableOpen ? (
          <div className="border-t border-zinc-800 px-5 pb-5 pt-4">
            <p className="mb-4 text-xs text-zinc-500">{t('ffmi.table.sectionHint')}</p>

            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-primary">
              {t('ffmi.table.genderMale')}
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-700 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">{t('ffmi.table.columns.range')}</th>
                    <th className="py-2 font-medium">{t('ffmi.table.columns.evaluation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FFMI_TABLE_MALE_ORDER.map((suffix) => (
                    <tr key={suffix} className="border-b border-zinc-800/80">
                      <td className="py-2 pr-4 font-mono text-zinc-200">
                        {t(`ffmi.table.rangeMale.${suffix}`)}
                      </td>
                      <td className="py-2">{t(`ffmi.category.male.${suffix}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-accent-primary">
              {t('ffmi.table.genderFemale')}
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-sm text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-700 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pr-4 font-medium">{t('ffmi.table.columns.range')}</th>
                    <th className="py-2 font-medium">{t('ffmi.table.columns.evaluation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {FFMI_TABLE_FEMALE_ORDER.map((suffix) => (
                    <tr key={suffix} className="border-b border-zinc-800/80">
                      <td className="py-2 pr-4 font-mono text-zinc-200">
                        {t(`ffmi.table.rangeFemale.${suffix}`)}
                      </td>
                      <td className="py-2">{t(`ffmi.category.female.${suffix}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default FfmiEducationPanels;
