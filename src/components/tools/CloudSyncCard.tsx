import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { joinArenaPath } from '../../lib/joinArenaNavigation';
import { formatCloudSyncUpdatedAt } from '../../logic/core/formatCloudSyncUpdatedAt';
import type { CloudSyncCardModel } from '../../hooks/useCloudSyncCard';
import CloudSyncRestoreConfirmDialog from './CloudSyncRestoreConfirmDialog';

export type CloudSyncCardProps = CloudSyncCardModel;

function resolveStatusLine(
  t: (key: string, options?: Record<string, unknown>) => string,
  model: Pick<CloudSyncCardModel, 'canSync' | 'statusLoading' | 'status'>
): string {
  if (!model.canSync) return t('tools.sync.status.locked');
  if (model.statusLoading) return t('tools.sync.status.loading');
  if (!model.status.exists || !model.status.cloudUpdatedAt) {
    return t('tools.sync.status.empty');
  }
  return t('tools.sync.status.updatedAt', {
    time: formatCloudSyncUpdatedAt(model.status.cloudUpdatedAt),
  });
}

/** Presentational Tools cloud-sync inset card — orchestration stays in `useCloudSyncCard`. */
const CloudSyncCard: FC<CloudSyncCardProps> = (model) => {
  const { t } = useTranslation('common');
  const {
    canSync,
    busy,
    feedback,
    restoreConfirmOpen,
    requestBackup,
    requestRestore,
    confirmRestore,
    cancelRestore,
  } = model;

  const statusLine = resolveStatusLine(t, model);
  const actionsDisabled = !canSync || busy;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent-primary/25 bg-gradient-to-br from-bg-card via-bg-panel to-bg-card p-8 shadow-panel">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/45 to-transparent" />
      <header className="space-y-1.5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-accent-primary">
          {t('tools.syncTitle')}
        </h2>
        <p className="text-sm text-zinc-400">{statusLine}</p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          className="ui-btn ui-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          onClick={requestBackup}
          disabled={actionsDisabled}
        >
          {t('tools.syncBackup')}
        </button>
        <button
          type="button"
          className="ui-btn disabled:cursor-not-allowed disabled:opacity-40"
          onClick={requestRestore}
          disabled={actionsDisabled}
        >
          {t('tools.syncRestore')}
        </button>
        {!canSync ? (
          <Link to={joinArenaPath('backup')} className="ui-btn inline-flex border-zinc-600">
            {t('tools.syncUpgrade')}
          </Link>
        ) : null}
      </div>

      {feedback ? (
        <p className="mt-4 text-sm text-zinc-300" role="status">
          {feedback}
        </p>
      ) : null}

      <p className="mt-6 border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
        {t('tools.sync.footerHint')}
      </p>

      <CloudSyncRestoreConfirmDialog
        open={restoreConfirmOpen}
        onCancel={cancelRestore}
        onConfirm={confirmRestore}
      />
    </section>
  );
};

export default CloudSyncCard;
