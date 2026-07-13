/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ToolsPage from '../ToolsPage';

const mockUseUiGate = vi.fn();
const mockUseVehicleCodexScores = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../hooks/useUiGate', () => ({
  useUiGate: () => mockUseUiGate(),
}));

vi.mock('../../hooks/useVehicleCodexScores', () => ({
  useVehicleCodexScores: () => mockUseVehicleCodexScores(),
}));

vi.mock('../../services/cloudSyncService', () => ({
  backupLocalToCloud: vi.fn(),
  restoreCloudToLocal: vi.fn(),
}));

vi.mock('../../components/tools/VehicleSpecificationCodex', () => ({
  VehicleSpecificationCodex: () => <div data-testid="vehicle-codex" />,
}));

vi.mock('../../components/ladder/LeaderboardGateSheet', () => ({
  default: () => null,
}));

const SYNC_RESTORE_WARNING =
  'Restore from Cloud overwrites local scores and history with the cloud snapshot — confirm before proceeding.';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.ns === 'common' || key.startsWith('tools.') || key.startsWith('assessment.')) {
        const map: Record<string, string> = {
          'tools.syncTitle': 'Cloud Sync',
          'tools.syncInfo.panelTitle': 'Sync Details',
          'tools.syncInfo.toggleExpand': 'Show sync details',
          'tools.syncInfo.toggleCollapse': 'Hide sync details',
          'tools.syncInfo.restoreWarning': SYNC_RESTORE_WARNING,
          'tools.syncBackup': 'Backup to Cloud Now',
          'tools.syncRestore': 'Restore from Cloud',
          'tools.syncUpgrade': 'Unlock Pro',
          'tools.kicker': 'Utility Deck',
          'tools.title': 'Tools & Cloud Sync',
          'tools.calculators.title': 'Training Calculators',
          'tools.calculators.oneRm.title': '1RM Calculator',
          'tools.calculators.plates.title': 'Plate Calculator',
          'tools.somatotypeLab.entry.title': 'Unlock Your Somatochart',
          'tools.somatotypeLab.entry.subtitle': 'Discover your frame genetics.',
          'tools.codex.panelTitle': 'Vehicle Codex',
          'assessment.referenceInfo.toggleExpand': 'Expand',
          'assessment.referenceInfo.toggleCollapse': 'Collapse',
        };
        if (map[key]) return map[key];
      }
      return key;
    },
  }),
}));

function renderPage(): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <ToolsPage />
      </MemoryRouter>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('ToolsPage cloud sync card', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('keeps sync info DisclosurePanel collapsed by default', () => {
    mockUseUiGate.mockReturnValue({ kind: 'none' });
    mockUseVehicleCodexScores.mockReturnValue({});

    const { container, unmount } = renderPage();
    const toggle = container.querySelector('#tools-cloud-sync-info-toggle');
    const panel = container.querySelector('#tools-cloud-sync-info-panel');

    expect(toggle).not.toBeNull();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(panel).not.toBeNull();
    expect(panel?.hasAttribute('hidden')).toBe(true);

    unmount();
  });

  it('does not render legacy syncBody copy', () => {
    mockUseUiGate.mockReturnValue({ kind: 'none' });
    mockUseVehicleCodexScores.mockReturnValue({});

    const { container, unmount } = renderPage();

    expect(container.textContent).not.toContain('tools.syncBody');
    expect(container.textContent).not.toContain('Pro syncs profile and history to cloud.');

    unmount();
  });

  it('expands sync info panel and reveals restore warning on toggle', () => {
    mockUseUiGate.mockReturnValue({ kind: 'pro' });
    mockUseVehicleCodexScores.mockReturnValue({});

    const { container, unmount } = renderPage();
    const toggle = container.querySelector('#tools-cloud-sync-info-toggle') as HTMLButtonElement;

    act(() => {
      toggle.click();
    });

    const panel = container.querySelector('#tools-cloud-sync-info-panel');

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(container.textContent).toContain(SYNC_RESTORE_WARNING);

    unmount();
  });

  it('keeps backup and restore actions visible when collapsed', () => {
    mockUseUiGate.mockReturnValue({ kind: 'none' });
    mockUseVehicleCodexScores.mockReturnValue({});

    const { container, unmount } = renderPage();

    expect(container.textContent).toContain('Backup to Cloud Now');
    expect(container.textContent).toContain('Restore from Cloud');

    unmount();
  });

  it('does not render preemptive pro banner or collapsed hint when gated', () => {
    mockUseUiGate.mockReturnValue({ kind: 'pro', joinArenaFrom: 'backup' });
    mockUseVehicleCodexScores.mockReturnValue({});

    const { container, unmount } = renderPage();

    expect(container.textContent).not.toContain('Cloud sync requires Pro');
    expect(container.textContent).not.toContain(
      'Backup scope, restore behavior, and requirements'
    );
    expect(container.textContent).toContain('Unlock Pro');

    unmount();
  });
});
