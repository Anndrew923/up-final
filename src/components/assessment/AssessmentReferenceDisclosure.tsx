import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DisclosurePanel } from '../DisclosurePanel';
import { ASSESSMENT_REFERENCE_PANEL_BODY_CLASS } from './AssessmentReferenceProse';

export interface AssessmentReferenceDisclosureProps {
  instanceId: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  panelBodyClassName?: string;
  collapsedHint?: string;
}

/** Standardized collapsible wrapper for assessment reference copy (title + toggle i18n in one place). */
export const AssessmentReferenceDisclosure: FC<AssessmentReferenceDisclosureProps> = ({
  instanceId,
  expanded,
  onToggle,
  children,
  panelBodyClassName = ASSESSMENT_REFERENCE_PANEL_BODY_CLASS,
  collapsedHint,
}) => {
  const { t } = useTranslation('common');

  return (
    <DisclosurePanel
      instanceId={instanceId}
      expanded={expanded}
      onToggle={onToggle}
      title={t('assessment.referenceInfo.title')}
      toggleExpandLabel={t('assessment.referenceInfo.toggleExpand')}
      toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse')}
      panelBodyClassName={panelBodyClassName}
      collapsedHint={collapsedHint}
    >
      {children}
    </DisclosurePanel>
  );
};

export default AssessmentReferenceDisclosure;
