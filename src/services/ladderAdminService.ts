import { httpsCallable, type HttpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from './firebaseClient';
import { logLadderCallableError } from '../lib/ladderCallableDevLog';

export type LadderAdminReportType = 'nickname' | 'avatar' | 'both';

export type LadderAdminReportRow = {
  id: string;
  reporterUid: string;
  targetUid: string;
  type: LadderAdminReportType;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  target: { displayName: string | null; avatarUrl: string | null } | null;
  reporter: { displayName: string | null } | null;
};

export type LadderAdminReportsCursor = {
  createdAt: string;
  id: string;
};

export type ProcessLadderReportAction = 'APPROVE' | 'REJECT';

type GetAdminLadderReportsResponse = {
  ok: boolean;
  reports?: LadderAdminReportRow[];
  nextCursor?: LadderAdminReportsCursor | null;
};

type ProcessLadderReportResponse = {
  ok: boolean;
  status?: string;
  sanitized?: boolean;
  shardsTouched?: number;
};

let getReportsFn: HttpsCallable<
  { limit?: number; cursor?: LadderAdminReportsCursor | null },
  GetAdminLadderReportsResponse
> | null = null;

let processReportFn: HttpsCallable<
  { reportId: string; action: ProcessLadderReportAction; notes?: string },
  ProcessLadderReportResponse
> | null = null;

function getListCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!getReportsFn) {
    getReportsFn = httpsCallable(functions, 'getAdminLadderReports');
  }
  return getReportsFn;
}

function getProcessCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!processReportFn) {
    processReportFn = httpsCallable(functions, 'processLadderReport');
  }
  return processReportFn;
}

export async function fetchAdminLadderReports(params?: {
  limit?: number;
  cursor?: LadderAdminReportsCursor | null;
}): Promise<{
  ok: boolean;
  reports: LadderAdminReportRow[];
  nextCursor: LadderAdminReportsCursor | null;
} | null> {
  const callable = getListCallable();
  if (!callable) return null;
  try {
    const { data } = await callable({
      limit: params?.limit,
      cursor: params?.cursor ?? undefined,
    });
    return {
      ok: Boolean(data?.ok),
      reports: Array.isArray(data?.reports) ? data.reports : [],
      nextCursor: data?.nextCursor ?? null,
    };
  } catch (err) {
    logLadderCallableError('getAdminLadderReports', err);
    throw err;
  }
}

export async function processAdminLadderReport(params: {
  reportId: string;
  action: ProcessLadderReportAction;
  notes?: string;
}): Promise<ProcessLadderReportResponse | null> {
  const callable = getProcessCallable();
  if (!callable) return null;
  try {
    const { data } = await callable(params);
    return data ?? { ok: false };
  } catch (err) {
    logLadderCallableError('processLadderReport', err);
    throw err;
  }
}
