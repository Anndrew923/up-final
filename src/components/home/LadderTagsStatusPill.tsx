import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface LadderTagsStatusPillProps {
  tagCount: number;
}

/**
 * Compact status chip for Home ladder-tags disclosure (WHY: raise affordance without forcing expand).
 * pointer-events-none — parent DisclosurePanel header owns the click target.
 */
const LadderTagsStatusPill: FC<LadderTagsStatusPillProps> = ({ tagCount }) => {
  const { t } = useTranslation('common');
  const empty = tagCount <= 0;

  return (
    <span
      className={cn(
        'pointer-events-none shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        empty
          ? 'border-accent-primary/45 bg-accent-primary/10 text-accent-primary'
          : 'border-accent-info/45 bg-accent-info/10 text-accent-info',
      )}
      aria-hidden
    >
      {empty
        ? t('home.profile.ladderTagsPillEmpty')
        : t('home.profile.ladderTagsPillActive', { count: tagCount })}
    </span>
  );
};

export default LadderTagsStatusPill;
