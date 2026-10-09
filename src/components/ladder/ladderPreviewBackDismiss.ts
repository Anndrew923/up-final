export interface LadderPreviewBackDismissInput {
  reportSheetOpen: boolean;
  closeReport: () => void;
  closePreview: () => void;
}

/**
 * Android back on the user-preview surface.
 * WHY: The report sheet is nested above the profile card. Back must peel one
 * layer so a single press does not skip the profile and exit the app.
 */
export function handleLadderPreviewBack({
  reportSheetOpen,
  closeReport,
  closePreview,
}: LadderPreviewBackDismissInput): boolean {
  if (reportSheetOpen) {
    closeReport();
    return true;
  }
  closePreview();
  return true;
}
