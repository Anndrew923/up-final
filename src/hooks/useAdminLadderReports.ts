import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminLadderReports,
  processAdminLadderReport,
  type LadderAdminReportRow,
  type LadderAdminReportsCursor,
  type ProcessLadderReportAction,
} from '../services/ladderAdminService';
import { fetchCurrentUserIsAdmin } from '../services/adminEntitlementService';

export type AdminReportsPhase = 'checking' | 'forbidden' | 'ready' | 'error';

export function useAdminLadderReports() {
  const [phase, setPhase] = useState<AdminReportsPhase>('checking');
  const [reports, setReports] = useState<LadderAdminReportRow[]>([]);
  const [nextCursor, setNextCursor] = useState<LadderAdminReportsCursor | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<'idle' | 'process-ok' | 'process-fail' | 'list-fail'>(
    'idle'
  );
  const listRequestIdRef = useRef(0);
  const processingRef = useRef(false);

  const loadReports = useCallback(async (opts?: {
    append?: boolean;
    cursor?: LadderAdminReportsCursor | null;
  }) => {
    const requestId = ++listRequestIdRef.current;
    setLoadingList(true);
    setBanner('idle');
    try {
      const result = await fetchAdminLadderReports({
        limit: 20,
        cursor: opts?.cursor ?? null,
      });
      if (requestId !== listRequestIdRef.current) return;
      if (!result?.ok) {
        setBanner('list-fail');
        return;
      }
      setReports((prev) => (opts?.append ? [...prev, ...result.reports] : result.reports));
      setNextCursor(result.nextCursor);
    } catch {
      if (requestId !== listRequestIdRef.current) return;
      setBanner('list-fail');
    } finally {
      if (requestId === listRequestIdRef.current) {
        setLoadingList(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const isAdmin = await fetchCurrentUserIsAdmin();
      if (cancelled) return;
      if (!isAdmin) {
        setPhase('forbidden');
        return;
      }
      setPhase('ready');
      await loadReports();
    })().catch(() => {
      if (!cancelled) setPhase('error');
    });
    return () => {
      cancelled = true;
      listRequestIdRef.current += 1;
    };
  }, [loadReports]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingList) return;
    await loadReports({ append: true, cursor: nextCursor });
  }, [loadReports, loadingList, nextCursor]);

  const processReport = useCallback(async (reportId: string, action: ProcessLadderReportAction) => {
    if (processingRef.current) return false;
    processingRef.current = true;
    setProcessingId(reportId);
    setBanner('idle');
    try {
      const result = await processAdminLadderReport({ reportId, action });
      if (!result?.ok) {
        setBanner('process-fail');
        return false;
      }
      setReports((prev) => prev.filter((row) => row.id !== reportId));
      setBanner('process-ok');
      return true;
    } catch {
      setBanner('process-fail');
      return false;
    } finally {
      processingRef.current = false;
      setProcessingId(null);
    }
  }, []);

  return {
    phase,
    reports,
    nextCursor,
    loadingList,
    processingId,
    banner,
    refresh: () => loadReports(),
    loadMore,
    processReport,
  };
}
