import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { isLadderCallableWritesEnabled } from '../../config/ladderCallable';

/**
 * DEV-only write-path indicator on ladder sync surfaces.
 *
 * Design intent (WHY):
 * - Prevents silent misconfiguration: client direct Firestore writes look like "sync ran"
 *   but P2 rules block setDoc; only Callable (`ladderSyncBatch`) can persist scores.
 * - Complements `[ENV_CHECK]` console lines — visible on the same screen as「同步至天梯」.
 */
const LadderCallableWriteModeBadge: FC = () => {
  const { t } = useTranslation('common');

  if (!import.meta.env.DEV) return null;

  const callableEnabled = isLadderCallableWritesEnabled();

  if (!callableEnabled) {
    return (
      <span
        className="inline-flex max-w-[min(100%,18rem)] items-center rounded-md border border-amber-500/50 bg-amber-500/15 px-2 py-1 text-[10px] font-medium leading-snug text-amber-200"
        role="status"
      >
        {t('ladder.devWriteMode.clientDirectWarning')}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-md border border-emerald-800/40 bg-emerald-950/30 px-1.5 py-0.5 text-[10px] text-emerald-600/80"
      role="status"
      aria-label={t('ladder.devWriteMode.callableOk')}
    >
      {t('ladder.devWriteMode.callableOk')}
    </span>
  );
};

export default LadderCallableWriteModeBadge;
