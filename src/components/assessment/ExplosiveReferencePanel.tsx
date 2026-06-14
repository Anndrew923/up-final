import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExplosivePowerNormAnchors } from '../../logic/core/powerScoring';
import {
  ReferenceBulletList,
  ReferenceCallout,
  ReferenceDataBlock,
  ReferenceDataList,
  ReferenceFootnote,
  ReferenceLabelledLine,
  ReferenceLead,
  ReferenceParagraph,
} from './AssessmentReferenceProse';

/** Why page-owned: keeps presentational panel free of profile domain types. */
export type ExplosiveAnchorsFallback = 'profile_incomplete' | 'age_out_of_range';

export interface ExplosiveReferencePanelProps {
  powerNormAnchors: ExplosivePowerNormAnchors | null;
  /** When norms are null — `age_out_of_range` vs incomplete profile — derived by the page. */
  anchorsFallback: ExplosiveAnchorsFallback | null;
}

function formatExplosiveAnchorCm(n: number): string {
  return n.toFixed(0);
}

function formatExplosiveAnchorSprintS(n: number): string {
  return n.toFixed(1);
}

export const ExplosiveReferencePanel: FC<ExplosiveReferencePanelProps> = ({
  powerNormAnchors,
  anchorsFallback,
}) => {
  const { t } = useTranslation('common');

  return (
    <>
      <ReferenceLead>{t('explosive.howToInfo.verticalJump')}</ReferenceLead>
      <ReferenceParagraph>{t('explosive.howToInfo.standingLongJump')}</ReferenceParagraph>
      <ReferenceParagraph>{t('explosive.howToInfo.sprint')}</ReferenceParagraph>
      <ReferenceParagraph>{t('explosive.fieldsHint')}</ReferenceParagraph>
      <ReferenceFootnote>{t('explosive.howToInfo.tip')}</ReferenceFootnote>
      <ReferenceParagraph>{t('explosive.standardsInfo.disclaimer')}</ReferenceParagraph>

      {powerNormAnchors ? (
        <ReferenceDataBlock>
          <ReferenceLead>{t('explosive.standardsInfo.anchorsIntro')}</ReferenceLead>
          <ReferenceFootnote>
            {t('explosive.standardsInfo.ageBand', {
              band: t(`explosive.standardsInfo.ageBands.${powerNormAnchors.ageRange}`),
            })}
          </ReferenceFootnote>
          <ReferenceDataList>
            <li>
              {t('explosive.standardsInfo.anchorVerticalLine', {
                v0: formatExplosiveAnchorCm(powerNormAnchors.vjump[0]),
                v50: formatExplosiveAnchorCm(powerNormAnchors.vjump[50]),
                v100: formatExplosiveAnchorCm(powerNormAnchors.vjump[100]),
              })}
            </li>
            <li>
              {t('explosive.standardsInfo.anchorSljLine', {
                v0: formatExplosiveAnchorCm(powerNormAnchors.slj[0]),
                v50: formatExplosiveAnchorCm(powerNormAnchors.slj[50]),
                v100: formatExplosiveAnchorCm(powerNormAnchors.slj[100]),
              })}
            </li>
            <li>
              {t('explosive.standardsInfo.anchorSprintLine', {
                v0: formatExplosiveAnchorSprintS(powerNormAnchors.sprint[0]),
                v50: formatExplosiveAnchorSprintS(powerNormAnchors.sprint[50]),
                v100: formatExplosiveAnchorSprintS(powerNormAnchors.sprint[100]),
              })}
            </li>
          </ReferenceDataList>
        </ReferenceDataBlock>
      ) : anchorsFallback === 'age_out_of_range' ? (
        <ReferenceCallout>{t('explosive.standardsInfo.noAnchorsHint')}</ReferenceCallout>
      ) : (
        <ReferenceFootnote>{t('explosive.standardsInfo.profileIncompleteForAnchors')}</ReferenceFootnote>
      )}

      <ReferenceLabelledLine label={t('explosive.standardsInfo.sourceLabel')}>
        {t('explosive.standardsInfo.sourceBody')}
      </ReferenceLabelledLine>

      <ReferenceLead>{t('explosive.standardsInfo.basisLabel')}</ReferenceLead>
      <ReferenceBulletList>
        <li>{t('explosive.standardsInfo.basisVjump')}</li>
        <li>{t('explosive.standardsInfo.basisSlj')}</li>
        <li>{t('explosive.standardsInfo.basisSprint')}</li>
      </ReferenceBulletList>

      <ReferenceFootnote>{t('explosive.standardsInfo.remark')}</ReferenceFootnote>
    </>
  );
};

export default ExplosiveReferencePanel;
