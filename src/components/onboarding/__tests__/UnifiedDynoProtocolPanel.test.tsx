/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import UnifiedDynoProtocolPanel from '../UnifiedDynoProtocolPanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('UnifiedDynoProtocolPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  it('renders collapsed protocol title with resolved copy (not raw i18n keys)', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(<UnifiedDynoProtocolPanel />);
    });

    const text = container.textContent ?? '';
    expect(text).toContain('六軸測功');
    expect(text).toContain('運動科學引擎');
    expect(text).not.toContain('onboarding.baseline.protocolTitle');
    expect(text).not.toContain('onboarding.baseline.features');

    const detailPanel = document.getElementById('onboarding-dyno-protocol-panel');
    expect(detailPanel).not.toBeNull();
    expect(detailPanel?.hasAttribute('hidden')).toBe(true);
    expect(text).toContain('力量');
  });

  it('expands to reveal axis details and authority footer', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(<UnifiedDynoProtocolPanel />);
    });

    const toggle = document.getElementById('onboarding-dyno-protocol-toggle');
    expect(toggle).not.toBeNull();

    await act(async () => {
      toggle?.click();
    });

    const detailPanel = document.getElementById('onboarding-dyno-protocol-panel');
    expect(detailPanel?.hasAttribute('hidden')).toBe(false);
    expect(container.textContent).toContain('DOTS 對沖體重');
    expect(container.textContent).toContain('實時數據');
  });
});
