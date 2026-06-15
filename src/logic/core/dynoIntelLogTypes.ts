import type { DynoClosingBeatKind } from './dynoIntelTypes';

/** Local-first DYNO INTEL uplink log — persisted per uid on device. */
export interface DynoIntelLogEntry {
  id: string;
  uid: string;
  timestamp: number;
  focusAxis: string;
  userQuestion: string;
  commentary: string;
  closingBeatKind: DynoClosingBeatKind;
}
