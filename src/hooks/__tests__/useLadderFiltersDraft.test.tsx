/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDefaultProjectForDivision } from '../../logic/core/ladderShards';
import { useLadderFiltersDraft, type UseLadderFiltersDraftResult } from '../useLadderFiltersDraft';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderHookHarness(
  onAppliedChange?: (next: ReturnType<typeof useLadderFiltersDraft>['applied']) => void
): { getCurrent: () => UseLadderFiltersDraftResult | null; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: UseLadderFiltersDraftResult | null = null;

  function Harness() {
    latest = useLadderFiltersDraft({ onAppliedChange });
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    getCurrent: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

function selectDetailedFilters(api: UseLadderFiltersDraftResult) {
  api.setDraftDivision('stats_sbdTotal');
  api.setDraftProject('deadlift');
  api.setDraftGender('male');
  api.setDraftAgeBucket('20-29');
  api.setDraftHeightBucket('170-180');
  api.setDraftWeightBucket('70-80kg');
  api.setDraftJobCategory('engineering');
  api.setDraftCountryCode('TW');
  api.setDraftCity('Taipei');
  api.setDraftDistrict('Xinyi');
}

function expectClearedTags(values: UseLadderFiltersDraftResult['applied']) {
  expect(values.gender).toBe('all');
  expect(values.ageBucket).toBe('all');
  expect(values.heightBucket).toBe('all');
  expect(values.weightBucket).toBe('all');
  expect(values.jobCategory).toBe('all');
  expect(values.countryCode).toBe('all');
  expect(values.city).toBe('all');
  expect(values.district).toBe('all');
}

describe('useLadderFiltersDraft', () => {
  it('resets project to division default when division changes', () => {
    const harness = renderHookHarness();

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.setDraftDivision('stats_sbdTotal');
      harness.getCurrent()!.setDraftProject('bench');
      harness.getCurrent()!.setDraftDivision('stats_cooper');
    });

    const current = harness.getCurrent()!;
    expect(current.draft.division).toBe('stats_cooper');
    expect(current.draft.filterProject).toBe(getDefaultProjectForDivision('stats_cooper'));

    harness.unmount();
  });

  it('clearDraftFilters clears only detailed filters and preserves division/project', () => {
    const harness = renderHookHarness();

    act(() => {
      harness.getCurrent()!.openSheet();
    });
    act(() => {
      selectDetailedFilters(harness.getCurrent()!);
    });
    act(() => {
      harness.getCurrent()!.clearDraftFilters();
    });

    const current = harness.getCurrent()!;
    expect(current.draft.division).toBe('stats_sbdTotal');
    expect(current.draft.filterProject).toBe('deadlift');
    expect(current.applied.division).toBe('ladderScore');
    expect(current.applied.filterProject).toBe(getDefaultProjectForDivision('ladderScore'));
    expectClearedTags(current.draft);
    expectClearedTags(current.applied);
    expect(current.sheetOpen).toBe(true);
    expect(current.hasUnappliedChanges).toBe(true);

    harness.unmount();
  });

  it('clearDraftFilters commits cleared tags immediately without a second apply', () => {
    const onAppliedChange = vi.fn();
    const harness = renderHookHarness(onAppliedChange);

    act(() => {
      harness.getCurrent()!.openSheet();
    });
    act(() => {
      selectDetailedFilters(harness.getCurrent()!);
    });
    act(() => {
      harness.getCurrent()!.applyDraft();
    });

    onAppliedChange.mockClear();

    act(() => {
      harness.getCurrent()!.openSheet();
    });
    act(() => {
      harness.getCurrent()!.clearDraftFilters();
    });

    const current = harness.getCurrent()!;
    expect(current.applied.division).toBe('stats_sbdTotal');
    expect(current.applied.filterProject).toBe('deadlift');
    expectClearedTags(current.applied);
    expectClearedTags(current.draft);
    expect(current.draft.division).toBe('stats_sbdTotal');
    expect(current.draft.filterProject).toBe('deadlift');
    expect(current.sheetOpen).toBe(true);
    expect(current.hasUnappliedChanges).toBe(false);
    expect(current.activeAppliedFilterCount).toBe(0);
    expect(onAppliedChange).toHaveBeenCalledTimes(1);
    expect(onAppliedChange).toHaveBeenCalledWith(current.applied);

    harness.unmount();
  });

  it('does not notify when clear is a no-op', () => {
    const onAppliedChange = vi.fn();
    const harness = renderHookHarness(onAppliedChange);

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.clearDraftFilters();
    });

    expect(onAppliedChange).not.toHaveBeenCalled();
    expect(harness.getCurrent()!.sheetOpen).toBe(true);
    expect(harness.getCurrent()!.hasUnappliedChanges).toBe(false);

    harness.unmount();
  });

  it('syncs draft from applied after closing and reopening sheet', () => {
    const harness = renderHookHarness();

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.setDraftDivision('stats_vertical');
      harness.getCurrent()!.setDraftProject('sprint');
      harness.getCurrent()!.applyDraft();
    });

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.setDraftProject('vertical');
      harness.getCurrent()!.setDraftGender('female');
      harness.getCurrent()!.closeSheet();
    });

    act(() => {
      harness.getCurrent()!.openSheet();
    });

    const current = harness.getCurrent()!;
    expect(current.draft.division).toBe(current.applied.division);
    expect(current.draft.filterProject).toBe(current.applied.filterProject);
    expect(current.draft.gender).toBe(current.applied.gender);
    expect(current.hasUnappliedChanges).toBe(false);

    harness.unmount();
  });

  it('calls onAppliedChange when applyDraft succeeds', () => {
    const onAppliedChange = vi.fn();
    const harness = renderHookHarness(onAppliedChange);

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.setDraftDivision('stats_sbdTotal');
      harness.getCurrent()!.setDraftProject('bench');
      harness.getCurrent()!.setDraftGender('male');
      harness.getCurrent()!.applyDraft();
    });

    const current = harness.getCurrent()!;
    expect(onAppliedChange).toHaveBeenCalledTimes(1);
    expect(onAppliedChange).toHaveBeenCalledWith(current.applied);
    expect(current.sheetOpen).toBe(false);

    harness.unmount();
  });

  it('resets city and district when country changes (cascade reset)', () => {
    const harness = renderHookHarness();

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.setDraftCountryCode('TW');
      harness.getCurrent()!.setDraftCity('Taipei');
      harness.getCurrent()!.setDraftDistrict('Xinyi');
      harness.getCurrent()!.setDraftCountryCode('US');
    });

    const current = harness.getCurrent()!;
    expect(current.draft.countryCode).toBe('US');
    expect(current.draft.city).toBe('all');
    expect(current.draft.district).toBe('all');

    harness.unmount();
  });

  it('resets district when city changes (cascade reset)', () => {
    const harness = renderHookHarness();

    act(() => {
      harness.getCurrent()!.openSheet();
      harness.getCurrent()!.setDraftCountryCode('TW');
      harness.getCurrent()!.setDraftCity('Taipei');
      harness.getCurrent()!.setDraftDistrict('Xinyi');
      harness.getCurrent()!.setDraftCity('Kaohsiung');
    });

    const current = harness.getCurrent()!;
    expect(current.draft.city).toBe('Kaohsiung');
    expect(current.draft.district).toBe('all');

    harness.unmount();
  });
});
