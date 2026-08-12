/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import DynoIntelCalloutBubble from '../DynoIntelCalloutBubble';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('DynoIntelCalloutBubble', () => {
  it('renders callout copy and invokes dismiss', () => {
    const onDismiss = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<DynoIntelCalloutBubble onDismiss={onDismiss} />);
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('dynoIntel.triggerDiscovery.callout');
    expect(button?.getAttribute('aria-label')).toContain('dynoIntel.triggerDiscovery.calloutDismiss');

    act(() => {
      button?.click();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
