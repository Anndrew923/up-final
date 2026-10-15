/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import type { AssessmentRawInputsV1 } from '../../../types/assessmentRawInputs';
import HistoryRecordRawTelemetry from '../HistoryRecordRawTelemetry';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const FULL_RAW: AssessmentRawInputsV1 = {
  schemaVersion: 1,
  physicalProfileSnapshot: {
    gender: 'male',
    age: 28,
    heightCm: 178,
    weightKg: 82,
  },
  strength: {
    lifts: {
      squat: { weightKg: 140, reps: 3 },
      benchPress: { weightKg: 100, reps: 5 },
      deadlift: { weightKg: 180, reps: 2 },
      shoulderPress: { weightKg: 60, reps: 6 },
    },
  },
  power: {
    explosivePower: { verticalJumpCm: 55, standingLongJumpCm: 240 },
  },
  cardio: {
    cardio: { distance: 2700 },
    run_5km: { minutes: 24, seconds: 0, totalSeconds: 1440, paceInSeconds: 288 },
  },
  muscle: { muscle: { smmKg: 37 } },
  grip: { peakKg: 55 },
  armSize: { armCircumferenceCm: 40 },
  ffmi: { bodyFatPct: 14 },
};

function renderTelemetry(rawInputs?: AssessmentRawInputsV1): {
  container: HTMLDivElement;
  root: Root;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <HistoryRecordRawTelemetry rawInputs={rawInputs} />
      </I18nextProvider>
    );
  });
  return { container, root };
}

describe('HistoryRecordRawTelemetry', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(async () => {
    document.body.innerHTML = '';
    await i18n.changeLanguage('zh-Hant');
  });

  it('renders scores-only downgrade when rawInputs is absent (legacy log)', () => {
    const { container, root } = renderTelemetry(undefined);
    const hint = container.querySelector('[data-testid="history-raw-scores-only"]');
    expect(hint?.textContent).toContain('純分數紀錄');
    expect(container.querySelector('[data-testid="history-raw-telemetry-grid"]')).toBeNull();
    act(() => root.unmount());
  });

  it('renders archive-empty copy when raw blob exists but has no measurable fields', () => {
    const { container, root } = renderTelemetry({ schemaVersion: 1 });
    expect(container.querySelector('[data-testid="history-raw-scores-only"]')?.textContent).toContain(
      '已標記封存'
    );
    expect(
      container.querySelector('[data-testid="history-raw-scores-only"]')?.textContent
    ).not.toContain('未封存');
    act(() => root.unmount());
  });

  it('renders a partial raw grid (grip only)', () => {
    const { container, root } = renderTelemetry({
      schemaVersion: 1,
      grip: { peakKg: 48 },
    });
    const grid = container.querySelector('[data-testid="history-raw-telemetry-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.textContent).toContain('握力');
    expect(grid?.textContent).toContain('48');
    expect(grid?.textContent).not.toContain('力量');
    expect(grid?.textContent).not.toContain('Cooper');
    act(() => root.unmount());
  });

  it('renders full raw telemetry with short lift labels and compact 1RM copy', () => {
    const { container, root } = renderTelemetry(FULL_RAW);
    const grid = container.querySelector('[data-testid="history-raw-telemetry-grid"]');
    expect(grid).toBeTruthy();
    const text = grid?.textContent ?? '';
    expect(text).toContain('力量');
    expect(text).toContain('爆發力');
    expect(text).toContain('心肺');
    expect(text).toContain('體態');
    expect(text).toContain('握力');
    expect(text).toContain('臥推');
    expect(text).toContain('深蹲');
    expect(text).toContain('硬舉');
    expect(text).toContain('肩推');
    expect(text).not.toContain('自由重量');
    expect(text).not.toContain('傳統');
    expect(text).not.toContain('站姿');
    expect(text).toContain('2700');
    expect(text).toContain('24:00');
    expect(text).toContain('55');
    expect(text).toMatch(/100 kg × 5 \(1RM .+kg\)/);
    expect(text).not.toContain('…');
    expect(text).not.toContain('...');
    expect(container.querySelector('.truncate')).toBeNull();
    expect(container.querySelectorAll('.tabular-nums').length).toBeGreaterThan(0);
    act(() => root.unmount());
  });

  it('switches English copy without missing keys and keeps short lift names', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    const { container, root } = renderTelemetry(FULL_RAW);
    const text = container.querySelector('[data-testid="history-raw-telemetry-grid"]')?.textContent ?? '';
    expect(text).toContain('Bench Press');
    expect(text).toContain('Squat');
    expect(text).toContain('Deadlift');
    expect(text).toContain('Overhead Press');
    expect(text).not.toContain('Standing Barbell');
    expect(text).not.toContain('…');
    expect(text).not.toContain('...');
    act(() => root.unmount());
  });
});
