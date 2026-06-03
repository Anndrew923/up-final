import { logLadderCallableError } from '../lib/ladderCallableDevLog';
import { callLadderReportUser } from './ladderCallableService';

export type LadderReportType = 'nickname' | 'avatar' | 'both';

export type LadderReportResult =
  | { ok: true; reportId: string }
  | {
      ok: false;
      reason:
        | 'unauthenticated'
        | 'permission-denied'
        | 'duplicate'
        | 'invalid'
        | 'unavailable'
        | 'not-found'
        | 'daily-cap'
        | 'unknown';
    };

export async function submitLadderReport(params: {
  targetUid: string;
  type: LadderReportType;
}): Promise<LadderReportResult> {
  try {
    const result = await callLadderReportUser(params);
    if (!result) {
      return { ok: false, reason: 'unavailable' };
    }
    if (result.ok && result.reportId) {
      return { ok: true, reportId: result.reportId };
    }
    return { ok: false, reason: 'unknown' };
  } catch (err) {
    return mapLadderReportError(err);
  }
}

/** Maps Firebase callable errors to stable client reasons. */
export function mapLadderReportError(err: unknown): LadderReportResult {
  logLadderCallableError('ladderReportUser', err);
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  if (code.includes('unauthenticated')) return { ok: false, reason: 'unauthenticated' };
  if (code.includes('permission-denied')) return { ok: false, reason: 'permission-denied' };
  if (code.includes('already-exists')) return { ok: false, reason: 'duplicate' };
  if (code.includes('resource-exhausted')) return { ok: false, reason: 'daily-cap' };
  if (code.includes('not-found')) return { ok: false, reason: 'not-found' };
  if (code.includes('invalid-argument')) return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'unknown' };
}
