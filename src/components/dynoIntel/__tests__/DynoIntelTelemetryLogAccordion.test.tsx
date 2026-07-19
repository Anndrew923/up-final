/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DynoIntelLogEntry } from '../../../logic/core/dynoIntelLogTypes';
import DynoIntelTelemetryLogAccordion from '../DynoIntelTelemetryLogAccordion';
import i18n from '../../../i18n';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const ENTRY: DynoIntelLogEntry = {
  id: 'log-1',
  uid: 'user-a',
  timestamp: 1,
  focusAxis: 'strength',
  userQuestion: 'How is my strength?',
  commentary: 'Archived commentary.',
  closingBeatKind: 'return-ritual',
};

function buttonByText(text: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === text
  );
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Button not found: ${text}`);
  return button;
}

describe('DynoIntelTelemetryLogAccordion', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container?.remove();
    container = null;
    document.body.innerHTML = '';
  });

  it('requires explicit confirmation before clearing local history', () => {
    const onClear = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root!.render(
        <DynoIntelTelemetryLogAccordion
          entries={[ENTRY]}
          logCap={100}
          storageError={false}
          onClear={onClear}
        />
      );
    });

    act(() => buttonByText('Clear Local History').click());
    expect(onClear).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain(
      'Are you sure you want to clear all history on this device? This action cannot be undone.'
    );

    act(() => buttonByText('Clear History').click());
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toContain('Clear local history?');
  });
});
