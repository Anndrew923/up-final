import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  backupLocalToCloud,
  fetchCloudSyncStatus,
  restoreCloudToLocal,
  type CloudSyncStatus,
} from '../services/cloudSyncService';
import { useUiGate } from './useUiGate';

export type CloudSyncCardModel = {
  canSync: boolean;
  statusLoading: boolean;
  busy: boolean;
  status: CloudSyncStatus;
  feedback: string | null;
  restoreConfirmOpen: boolean;
  requestBackup: () => void;
  requestRestore: () => void;
  confirmRestore: () => void;
  cancelRestore: () => void;
};

function outcomeMessage(
  t: (key: string, options?: { ns: string }) => string,
  kind: 'backup' | 'restore',
  reason: string
): string {
  if (reason === 'auth-failed') return t('tools.sync.authFail', { ns: 'common' });
  if (reason === 'unavailable') return t('tools.sync.unavailable', { ns: 'common' });
  if (reason === 'permission-denied') return t('tools.sync.permissionDenied', { ns: 'common' });
  if (reason === 'empty-restore') return t('tools.sync.restoreEmpty', { ns: 'common' });
  return kind === 'backup'
    ? t('tools.sync.backupFail', { ns: 'common' })
    : t('tools.sync.restoreFail', { ns: 'common' });
}

/**
 * Tools deck cloud-sync card: entitlement-aware status probe + backup/restore flows.
 * WHY: Firestore status reads only when UI gate is clear; upgrade CTA lives on the card Link.
 */
export function useCloudSyncCard(): CloudSyncCardModel {
  const { t } = useTranslation();
  const syncUiGate = useUiGate('cloud-sync');
  const canSync = syncUiGate.kind === 'none';

  const [status, setStatus] = useState<CloudSyncStatus>({
    exists: false,
    cloudUpdatedAt: null,
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!canSync) {
      setStatus({ exists: false, cloudUpdatedAt: null });
      setStatusLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setStatusLoading(true);
    void fetchCloudSyncStatus()
      .then((next) => {
        if (cancelled) return;
        setStatus(next);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canSync]);

  const refreshStatus = useCallback(async () => {
    if (!canSync) return;
    const next = await fetchCloudSyncStatus();
    setStatus(next);
  }, [canSync]);

  const requestBackup = useCallback(() => {
    if (!canSync || busy) return;
    void (async () => {
      setBusy(true);
      setFeedback(null);
      try {
        const r = await backupLocalToCloud();
        if (r.ok) {
          setFeedback(t('tools.sync.backupOk', { ns: 'common' }));
          await refreshStatus();
          return;
        }
        setFeedback(outcomeMessage(t, 'backup', r.reason));
      } finally {
        setBusy(false);
      }
    })();
  }, [busy, canSync, refreshStatus, t]);

  const requestRestore = useCallback(() => {
    if (!canSync || busy) return;
    setRestoreConfirmOpen(true);
  }, [busy, canSync]);

  const cancelRestore = useCallback(() => {
    setRestoreConfirmOpen(false);
  }, []);

  const confirmRestore = useCallback(() => {
    if (busy) return;
    setRestoreConfirmOpen(false);
    void (async () => {
      setBusy(true);
      setFeedback(null);
      try {
        const r = await restoreCloudToLocal();
        if (r.ok) {
          setFeedback(t('tools.sync.restoreOk', { ns: 'common' }));
          await refreshStatus();
          return;
        }
        setFeedback(outcomeMessage(t, 'restore', r.reason));
      } finally {
        setBusy(false);
      }
    })();
  }, [busy, refreshStatus, t]);

  return {
    canSync,
    statusLoading,
    busy,
    status,
    feedback,
    restoreConfirmOpen,
    requestBackup,
    requestRestore,
    confirmRestore,
    cancelRestore,
  };
}
