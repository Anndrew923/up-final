/**
 * Global open state for the aesthetic telemetry modal (home + assessment triggers).
 * WHY: Assessment pages need to open the plaque with a locked leaf/axis without mounting
 * a second modal tree on every route. In-modal report switcher was removed — selection
 * is fixed at open time via openWithSmartDefault / openWithLeaf / openWithAxisSummary.
 */
import { create } from 'zustand';
import type { AestheticAxisSummaryAxis } from '../logic/aesthetic/axisSummaryReport';
import type { SingleLeafId } from '../logic/aesthetic/singleLeafReport';
import type { SmartDefaultSelection } from '../logic/aesthetic/singleLeafReport';

export type AestheticAxisSummarySelection = {
  reportType: 'axis-summary';
  axis: AestheticAxisSummaryAxis;
  heroScore: number;
  coveredCount: number;
};

export type AestheticReportSelection =
  | { reportType: 'full' }
  | { reportType: 'single-leaf'; leaf: SingleLeafId }
  | AestheticAxisSummarySelection;

export interface AestheticReportUiStore {
  isOpen: boolean;
  selection: AestheticReportSelection;
  openWithSmartDefault: (selection: SmartDefaultSelection) => void;
  openWithLeaf: (leaf: SingleLeafId) => void;
  openWithAxisSummary: (
    axis: AestheticAxisSummaryAxis,
    payload: { heroScore: number; coveredCount: number }
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
      },
    });
  },
  close() {
    set({ isOpen: false });
  },
}));
