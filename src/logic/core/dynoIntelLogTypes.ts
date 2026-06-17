import type { DynoClosingBeatKind } from './dynoIntelTypes';
import type { DynoIntelDisplayMeta } from './resolveDynoIntelDisplayMeta';

/** Local-first DYNO INTEL uplink log — persisted per uid on device. */
export interface DynoIntelLogEntry {
  id: string;
  uid: string;
  timestamp: number;
  focusAxis: string;
  userQuestion: string;
  commentary: string;
  closingBeatKind: DynoClosingBeatKind;
  /** v3.0 — UI card snapshot for telemetry log replay. */
  displayMeta?: DynoIntelDisplayMeta | null;
}
