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

/** Must match server `CONFIRM_REMOVE_FROM_LADDER` / `CONFIRM_DELETE_ACCOUNT`. */
export const CONFIRM_REMOVE_FROM_LADDER = 'REMOVE';
export const CONFIRM_DELETE_ACCOUNT = 'DELETE';


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

export type AdminLadderUserLookup = {
  uid: string;
  email: string | null;
  authExists: boolean;
  userDocExists: boolean;
  isAdmin: boolean;
  onLadder: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  overallScore: number | null;
};

type LookupAdminLadderUserResponse = {
  ok: boolean;
  user?: AdminLadderUserLookup;
};

type AdminUserOpResponse = {
  ok: boolean;
  mode?: string;
  previewDeleted?: boolean;
  shardsDeleted?: number;
  authDeleted?: boolean;
  cloudDeleted?: boolean;
};

let lookupUserFn: HttpsCallable<{ query: string }, LookupAdminLadderUserResponse> | null = null;
let removeFromLadderFn: HttpsCallable<
  { targetUid: string; confirmPhrase: string },
  AdminUserOpResponse
> | null = null;
let deleteUserFn: HttpsCallable<
  { targetUid: string; confirmPhrase: string },
  AdminUserOpResponse
> | null = null;

function getLookupCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!lookupUserFn) {
    lookupUserFn = httpsCallable(functions, 'lookupAdminLadderUser');
  }
  return lookupUserFn;
}

function getRemoveCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!removeFromLadderFn) {
    removeFromLadderFn = httpsCallable(functions, 'adminRemoveFromLadder');
  }
  return removeFromLadderFn;
}

function getDeleteUserCallable() {
  const functions = getFirebaseFunctions();
  if (!functions) return null;
  if (!deleteUserFn) {
    deleteUserFn = httpsCallable(functions, 'adminDeleteUser');
  }
  return deleteUserFn;
}

export async function lookupAdminLadderUser(query: string): Promise<{
  ok: boolean;
  user: AdminLadderUserLookup | null;
} | null> {
  const callable = getLookupCallable();
  if (!callable) return null;
  try {
    const { data } = await callable({ query });
    return {
      ok: Boolean(data?.ok),
      user: data?.user ?? null,
    };
  } catch (err) {
    logLadderCallableError('lookupAdminLadderUser', err);
    throw err;
  }
}

export async function adminRemoveUserFromLadder(params: {
  targetUid: string;
  confirmPhrase: string;
}): Promise<AdminUserOpResponse | null> {
  const callable = getRemoveCallable();
  if (!callable) return null;
  try {
    const { data } = await callable(params);
    return data ?? { ok: false };
  } catch (err) {
    logLadderCallableError('adminRemoveFromLadder', err);
    throw err;
  }
}

export async function adminDeleteLadderUser(params: {
  targetUid: string;
  confirmPhrase: string;
}): Promise<AdminUserOpResponse | null> {
  const callable = getDeleteUserCallable();
  if (!callable) return null;
  try {
    const { data } = await callable(params);
    return data ?? { ok: false };
  } catch (err) {
    logLadderCallableError('adminDeleteUser', err);
    throw err;
  }
}
