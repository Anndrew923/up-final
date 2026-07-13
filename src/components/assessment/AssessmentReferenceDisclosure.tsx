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

export interface AssessmentReferenceFooterProps {
  children: ReactNode;
}

/**
 * Bottom-anchored chrome for assessment reference copy.
 * Design intent: keep core form / ladder sync as the primary path, then park science docs
 * below a clear visual break. `!mt-8` is required because parent `space-y-*` child selectors
 * outrank a plain `mt-8` and would otherwise collapse the intended breathing room.
 */
export const AssessmentReferenceFooter: FC<AssessmentReferenceFooterProps> = ({ children }) => (
  <div className="!mt-8 border-t border-zinc-800/80 pt-6">{children}</div>
);

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
