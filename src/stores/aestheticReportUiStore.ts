/**
 * Global open state for the aesthetic telemetry modal (home + assessment triggers).
 * WHY: Assessment pages need to open the plaque with a locked leaf/axis without mounting
 * a second modal tree on every route. In-modal report switcher was removed — selection
 * is fixed at open time via openWithSmartDefault / openWithLeaf / openWithAxisSummary.
 */
import { create } from 'zustand';
import type { AestheticAxisSummaryAxis } from '../logic/aesthetic/axisSummaryReport';
import type { MuscleAxisMeasuredMetrics } from '../logic/aesthetic/muscleAxisMeasured';
import type { SingleLeafId } from '../logic/aesthetic/singleLeafReport';
import type { SmartDefaultSelection } from '../logic/aesthetic/singleLeafReport';

export type AestheticAxisSummarySelection = {
  reportType: 'axis-summary';
  axis: AestheticAxisSummaryAxis;
  heroScore: number;
  coveredCount: number;
  /** WHY: Muscle plate left column shows measured kg/% instead of "N 項綜合". */
  muscleMeasured?: MuscleAxisMeasuredMetrics;
};

export type AestheticReportSelection =
  | { reportType: 'full' }
  | { reportType: 'single-leaf'; leaf: SingleLeafId }
  | AestheticAxisSummarySelection;

export type AestheticAxisSummaryOpenPayload = {
  heroScore: number;
  coveredCount: number;
  muscleMeasured?: MuscleAxisMeasuredMetrics;
};

export interface AestheticReportUiStore {
  isOpen: boolean;
  selection: AestheticReportSelection;
  openWithSmartDefault: (selection: SmartDefaultSelection) => void;
  openWithLeaf: (leaf: SingleLeafId) => void;
  openWithAxisSummary: (
    axis: AestheticAxisSummaryAxis,
    payload: AestheticAxisSummaryOpenPayload
  ) => void;
  close: () => void;
}

export const useAestheticReportUiStore = create<AestheticReportUiStore>((set) => ({
  isOpen: false,
  selection: { reportType: 'full' },
  openWithSmartDefault(selection) {
    set({
      isOpen: true,
      selection,
    });
  },
  openWithLeaf(leaf) {
    set({
      isOpen: true,
      selection: { reportType: 'single-leaf', leaf },
    });
  },
  openWithAxisSummary(axis, payload) {
    set({
      isOpen: true,
      selection: {
        reportType: 'axis-summary',
        axis,
        heroScore: payload.heroScore,
        coveredCount: payload.coveredCount,
        ...(payload.muscleMeasured ? { muscleMeasured: payload.muscleMeasured } : {}),
      },
    });
  },
  close() {
    set({ isOpen: false });
  },
}));
