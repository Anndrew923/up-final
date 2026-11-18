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

  it('openWithAxisSummary locks composite axis score + coverage', () => {
    useAestheticReportUiStore.getState().openWithAxisSummary('strength', {
      heroScore: 70.4,
      coveredCount: 5,
    });
    const state = useAestheticReportUiStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.selection).toEqual({
      reportType: 'axis-summary',
      axis: 'strength',
      heroScore: 70.4,
      coveredCount: 5,
    });
  });

  it('openWithAxisSummary can lock muscle measured dual raw', () => {
    useAestheticReportUiStore.getState().openWithAxisSummary('muscleMass', {
      heroScore: 88.2,
      coveredCount: 2,
      muscleMeasured: { smmKg: 32.5, smPercent: 42.1 },
    });
    const state = useAestheticReportUiStore.getState();
    expect(state.selection).toEqual({
      reportType: 'axis-summary',
      axis: 'muscleMass',
      heroScore: 88.2,
      coveredCount: 2,
      muscleMeasured: { smmKg: 32.5, smPercent: 42.1 },
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

