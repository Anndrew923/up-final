/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CrewDispatchMuteSwitch from '../CrewDispatchMuteSwitch';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockSetClubDispatchMute = vi.fn();

vi.mock('../../../services/guildCallableService', () => ({
  setClubDispatchMute: (...args: unknown[]) => mockSetClubDispatchMute(...args),
}));

const muteLocal = { value: false };

vi.mock('../../../logic/core/clubProgressDispatchUi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../logic/core/clubProgressDispatchUi')>();
  return {
    ...actual,
    readLocalMuteClubDispatches: () => muteLocal.value,
    writeLocalMuteClubDispatches: (next: boolean) => {
      muteLocal.value = next;
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CrewDispatchMuteSwitch', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    muteLocal.value = false;
    mockSetClubDispatchMute.mockReset();
    mockSetClubDispatchMute.mockResolvedValue({ ok: true, muteClubDispatches: true });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('defaults receiving ON and calls setClubDispatchMute with mute true when toggled off', async () => {
    act(() => {
      root.render(<CrewDispatchMuteSwitch />);
    });

    const shell = document.querySelector(
      '[data-testid="crew-dispatch-mute-switch"]'
    ) as HTMLElement;
    expect(shell).toBeTruthy();
    // Compact toolbar: one visible label row; hint stays in sr-only / title only.
    expect(shell.querySelectorAll('p')).toHaveLength(1);
    expect(shell.querySelector('.sr-only')?.textContent).toBe('crew.dispatch.muteHint');

    const toggle = document.querySelector(
      '[data-testid="crew-dispatch-mute-toggle"]'
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.getAttribute('aria-labelledby')).toBeTruthy();
    expect(toggle.getAttribute('aria-describedby')).toBeTruthy();
    expect(toggle.getAttribute('aria-label')).toBeNull();

    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(mockSetClubDispatchMute).toHaveBeenCalledWith({ mute: true });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('rolls back optimistic state when setClubDispatchMute fails', async () => {
    mockSetClubDispatchMute.mockResolvedValueOnce({ ok: false, reason: 'failed' });

    act(() => {
      root.render(<CrewDispatchMuteSwitch />);
    });

    const toggle = document.querySelector(
      '[data-testid="crew-dispatch-mute-toggle"]'
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('ignores clicks while disabled', async () => {
    act(() => {
      root.render(<CrewDispatchMuteSwitch disabled />);
    });

    const toggle = document.querySelector(
      '[data-testid="crew-dispatch-mute-toggle"]'
    ) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);

    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(mockSetClubDispatchMute).not.toHaveBeenCalled();
  });
});
