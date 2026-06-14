import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FFMI_TABLE_FEMALE_ORDER, FFMI_TABLE_MALE_ORDER } from '../../logic/core/ffmiTableRows';
import AssessmentReferenceDisclosure from '../assessment/AssessmentReferenceDisclosure';
import {
  ASSESSMENT_REFERENCE_STRUCTURED_PANEL_BODY_CLASS,
  ReferenceOrderedList,
  ReferenceParagraph,
  ReferenceSection,
  ReferenceSectionHint,
  ReferenceSectionTitle,
} from '../assessment/AssessmentReferenceProse';

export const FfmiEducationPanels: FC = () => {
  const { t } = useTranslation('common');
  const [referenceOpen, setReferenceOpen] = useState(false);

  return (
    <AssessmentReferenceDisclosure
      instanceId="ffmi-reference"
      expanded={referenceOpen}
      onToggle={() => setReferenceOpen((v) => !v)}
      panelBodyClassName={ASSESSMENT_REFERENCE_STRUCTURED_PANEL_BODY_CLASS}
    >
      <ReferenceSectionTitle>{t('ffmi.info.whatIsTitle')}</ReferenceSectionTitle>
      <ReferenceParagraph>{t('ffmi.info.whatIsIntro')}</ReferenceParagraph>
      <ReferenceOrderedList>
        <li>{t('ffmi.info.caveats.tall')}</li>
        <li>{t('ffmi.info.caveats.highFat')}</li>
        <li>{t('ffmi.info.caveats.heavy')}</li>
      </ReferenceOrderedList>

      <ReferenceSection>
        <ReferenceSectionTitle>{t('ffmi.table.sectionTitle')}</ReferenceSectionTitle>
        <ReferenceSectionHint>{t('ffmi.table.sectionHint')}</ReferenceSectionHint>
      </ReferenceSection>

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
                <td className="py-2 pr-4 font-mono text-zinc-200">
                  {t(`ffmi.table.rangeMale.${suffix}`)}
                </td>
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
                <td className="py-2 pr-4 font-mono text-zinc-200">
                  {t(`ffmi.table.rangeFemale.${suffix}`)}
                </td>
                <td className="py-2">{t(`ffmi.category.female.${suffix}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AssessmentReferenceDisclosure>
  );
};

export default FfmiEducationPanels;
