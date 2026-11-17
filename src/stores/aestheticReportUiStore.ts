/**
 * Global open state for the aesthetic telemetry modal (home + assessment triggers).
 * WHY: Assessment pages need to open the plaque with a locked leaf without mounting
 * a second modal tree on every route. In-modal report switcher was removed — selection
 * is fixed at open time via openWithSmartDefault / openWithLeaf.
 */
import { create } from 'zustand';
import type { SingleLeafId } from '../logic/aesthetic/singleLeafReport';
import type { SmartDefaultSelection } from '../logic/aesthetic/singleLeafReport';

export type AestheticReportSelection =
  | { reportType: 'full' }
  | { reportType: 'single-leaf'; leaf: SingleLeafId };

export interface AestheticReportUiStore {
  isOpen: boolean;
  selection: AestheticReportSelection;
  openWithSmartDefault: (selection: SmartDefaultSelection) => void;
  openWithLeaf: (leaf: SingleLeafId) => void;
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
  close() {
    set({ isOpen: false });
  },
}));
