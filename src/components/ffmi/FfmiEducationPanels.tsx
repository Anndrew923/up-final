import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DisclosurePanel } from '../DisclosurePanel';
import {
  FFMI_TABLE_FEMALE_ORDER,
  FFMI_TABLE_MALE_ORDER,
} from '../../logic/core/ffmiTableRows';

export const FfmiEducationPanels: FC = () => {
  const { t } = useTranslation('common');
  const [referenceOpen, setReferenceOpen] = useState(false);

  return (
    <DisclosurePanel
      instanceId="ffmi-reference"
      expanded={referenceOpen}
      onToggle={() => setReferenceOpen((v) => !v)}
      title={t('assessment.referenceInfo.title')}
      toggleExpandLabel={t('assessment.referenceInfo.toggleExpand')}
      toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse')}
      panelBodyClassName="space-y-4 px-5 pb-5 pt-4 text-sm leading-relaxed text-zinc-300"
    >
      <h3 className="text-sm font-semibold tracking-tight text-zinc-100">{t('ffmi.info.whatIsTitle')}</h3>
      <p>{t('ffmi.info.whatIsIntro')}</p>
      <ol className="list-decimal space-y-2 pl-5 text-zinc-400">
        <li>{t('ffmi.info.caveats.tall')}</li>
        <li>{t('ffmi.info.caveats.highFat')}</li>
        <li>{t('ffmi.info.caveats.heavy')}</li>
      </ol>

      <div className="border-t border-zinc-800/80 pt-4">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-100">{t('ffmi.table.sectionTitle')}</h3>
        <p className="mt-1 text-xs text-zinc-500">{t('ffmi.table.sectionHint')}</p>
      </div>

      <h4 className="text-xs font-semibold uppercase tracking-wide text-accent-primary">
        {t('ffmi.table.genderMale')}
      </h4>
      <div className="overflow-x-auto">
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
                <td className="py-2 pr-4 font-mono text-zinc-200">{t(`ffmi.table.rangeMale.${suffix}`)}</td>
                <td className="py-2">{t(`ffmi.category.male.${suffix}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="pt-2 text-xs font-semibold uppercase tracking-wide text-accent-primary">
        {t('ffmi.table.genderFemale')}
      </h4>
      <div className="overflow-x-auto">
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
                <td className="py-2 pr-4 font-mono text-zinc-200">{t(`ffmi.table.rangeFemale.${suffix}`)}</td>
                <td className="py-2">{t(`ffmi.category.female.${suffix}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DisclosurePanel>
  );
};

export default FfmiEducationPanels;
