import { describe, expect, it, vi } from 'vitest';
import { handleLadderPreviewBack } from '../ladderPreviewBackDismiss';

describe('handleLadderPreviewBack', () => {
  it('closes the report sheet first and keeps the profile open', () => {
    const closeReport = vi.fn();
    const closePreview = vi.fn();

    expect(
      handleLadderPreviewBack({
        reportSheetOpen: true,
        closeReport,
        closePreview,
      })
    ).toBe(true);
    expect(closeReport).toHaveBeenCalledTimes(1);
    expect(closePreview).not.toHaveBeenCalled();
  });

  it('closes the profile when no nested report sheet is open', () => {
    const closeReport = vi.fn();
    const closePreview = vi.fn();

    expect(
      handleLadderPreviewBack({
        reportSheetOpen: false,
        closeReport,
        closePreview,
      })
    ).toBe(true);
    expect(closePreview).toHaveBeenCalledTimes(1);
    expect(closeReport).not.toHaveBeenCalled();
  });
});
