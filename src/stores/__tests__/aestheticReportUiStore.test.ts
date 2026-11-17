import { beforeEach, describe, expect, it } from 'vitest';
import { useAestheticReportUiStore } from '../aestheticReportUiStore';

describe('aestheticReportUiStore dual-track open', () => {
  beforeEach(() => {
    useAestheticReportUiStore.setState({
      isOpen: false,
      selection: { reportType: 'full' },
    });
  });

  it('openWithSmartDefault opens full overview', () => {
    useAestheticReportUiStore.getState().openWithSmartDefault({ reportType: 'full' });
    const state = useAestheticReportUiStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.selection).toEqual({ reportType: 'full' });
  });

  it('openWithSmartDefault can open highest single leaf', () => {
    useAestheticReportUiStore
      .getState()
      .openWithSmartDefault({ reportType: 'single-leaf', leaf: 'grip' });
    const state = useAestheticReportUiStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.selection).toEqual({ reportType: 'single-leaf', leaf: 'grip' });
  });

  it('openWithLeaf opens that specialty selection', () => {
    useAestheticReportUiStore.getState().openWithLeaf('explosive.sprint');
    const state = useAestheticReportUiStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.selection).toEqual({
      reportType: 'single-leaf',
      leaf: 'explosive.sprint',
    });
  });

  it('close clears open flag without wiping last selection identity', () => {
    useAestheticReportUiStore.getState().openWithLeaf('grip');
    useAestheticReportUiStore.getState().close();
    const state = useAestheticReportUiStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.selection).toEqual({ reportType: 'single-leaf', leaf: 'grip' });
  });
});
