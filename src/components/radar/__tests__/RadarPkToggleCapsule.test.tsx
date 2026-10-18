/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RadarPkToggleCapsule from '../RadarPkToggleCapsule';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('RadarPkToggleCapsule', () => {
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('renders clash label with SVG icon and no emoji', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    const onToggle = vi.fn();

    act(() => {
      root.render(
        <RadarPkToggleCapsule
          active={false}
          enableLabel="戰力切磋"
          disableLabel="結束切磋"
          scanningLabel="提取戰力中..."
          onToggle={onToggle}
        />
      );
    });

    const btn = document.body.querySelector(
      '[data-testid="radar-pk-toggle"]'
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('戰力切磋');
    expect(btn.textContent).not.toContain('⚔');
    expect(btn.textContent).not.toContain('⚡');
    expect(btn.className).toContain('h-11');
    expect(btn.className).toContain('px-6');
    expect(btn.className).toContain('tracking-wider');
    expect(btn.className).toContain('border-cyan-500/60');
    expect(btn.className).toContain('shadow-[0_0_15px_rgba(6,182,212,0.2)]');
    expect(btn.querySelector('svg')).toBeTruthy();
    expect(btn.getAttribute('data-pk-active')).toBe('false');
    expect(btn.getAttribute('data-pk-scanning')).toBe('false');
  });


  it('shows scanning label, pulse attrs, and blocks clicks', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    const onToggle = vi.fn();

    act(() => {
      root.render(
        <RadarPkToggleCapsule
          active={false}
          scanning
          enableLabel="Clash"
          disableLabel="End Clash"
          scanningLabel="Clashing..."
          onToggle={onToggle}
        />
      );
    });

    const btn = document.body.querySelector(
      '[data-testid="radar-pk-toggle"]'
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('Clashing...');
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('data-pk-scanning')).toBe('true');
    expect(btn.getAttribute('aria-busy')).toBe('true');

    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows end-clash label when active', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <RadarPkToggleCapsule
          active
          enableLabel="Clash"
          disableLabel="End Clash"
          scanningLabel="Clashing..."
          onToggle={() => undefined}
        />
      );
    });

    const btn = document.body.querySelector(
      '[data-testid="radar-pk-toggle"]'
    ) as HTMLButtonElement;
    expect(btn.textContent).toContain('End Clash');
    expect(btn.getAttribute('data-pk-active')).toBe('true');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.className).toContain('border-amber-500/70');
    expect(btn.className).toContain('shadow-[0_0_18px_rgba(245,158,11,0.28)]');
  });
});

