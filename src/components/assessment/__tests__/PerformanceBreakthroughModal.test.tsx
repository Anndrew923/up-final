/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerformanceBreakthroughPayload } from '../../../logic/core/performanceBreakthrough';
import PerformanceBreakthroughModal from '../PerformanceBreakthroughModal';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'assessment.breakthrough.normBadgeExpandAria') {
        return `Expand ${String(options?.populationClass ?? '')}`;
      }
      if (key === 'assessment.breakthrough.normBadgeCollapseAria') {
        return `Collapse ${String(options?.populationClass ?? '')}`;
      }
      if (key === 'assessment.breakthrough.summaryRegionAria') {
        return `${String(options?.populationClass ?? '')} tier explanation`;
      }
      if (key === 'assessment.breakthrough.closeAria') return 'Close';
      if (key === 'assessment.breakthrough.kicker') return 'Axis Breakthrough';
      if (key === 'assessment.breakthrough.confirmDismiss') return 'CONFIRM';
      if (key === 'assessment.breakthrough.syncBtn') return 'Sync';
      if (key === 'assessment.breakthrough.syncDashboardThenArenaWithClub') return 'Sync Arena+Club';
      if (key === 'assessment.breakthrough.syncDashboardThenArenaGuildOnly') return 'Sync Club Only';
      if (key === 'assessment.breakthrough.dashboardAndArenaGuildSuccess') {
        return '✓ 主控台、全球天梯與俱樂部已全數同步';
      }
      if (key === 'assessment.breakthrough.dashboardAndGuildSuccess') {
        return '本機主控台已更新，俱樂部私榜已同步（未公開全球）。';
      }
      if (key === 'assessment.breakthrough.dashboardAndArenaSuccess') {
        return '本機主控台與天梯已同步完成。';
      }
      if (key === 'assessment.breakthrough.dashboardPersistedOnly') {
        return '本機主控台已更新。天梯上傳未完成或已略過，請見下方說明。';
      }
      if (key === 'assessment.hallSpectrum.viewEntry') return '名人堂光譜 ➔';
      if (key === 'assessment.hallSpectrum.viewEntryAria') return '開啟名人堂常模光譜';
      if (key === 'crew.dispatch.modalKicker') return 'Club Dispatch';
      if (key === 'crew.dispatch.modalTitle') return 'Announce breakthrough';
      if (key === 'crew.dispatch.closeAria') return 'Close dispatch';
      if (key === 'crew.dispatch.broadcastAndSync') return 'Broadcast & sync';
      if (key === 'crew.dispatch.silentSync') return 'Sync quietly';
      if (key === 'crew.dispatch.syncing') return 'Syncing…';
      if (key === 'crew.dispatch.commentPlaceholder') return 'Say something…';
      if (key === 'crew.dispatch.commentLabel') return 'Comment';
      if (key === 'crew.dispatch.tagsAria') return 'Tags';
      if (key === 'crew.dispatch.tag.overlimit') return '#今天不當人了';
      if (key === 'crew.dispatch.tag.challenge') return '#後照鏡看不到人';
      if (key === 'crew.dispatch.tag.nearDeath') return '#這重量算暖身';
      return key;
    },
  }),
}));

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../hooks/useLadderUploadGateSheet', () => ({
  useLadderUploadGateSheet: () => ({
    gateSheetOpen: false,
    gateSheetKind: null,
    tryOpenGateSheet: () => false,
    closeGateSheet: vi.fn(),
    confirmGateSheet: vi.fn(),
    resetGateSheet: vi.fn(),
  }),
}));

const ensureIdentityReadyMock = vi.fn(() => true);
const closeIdentitySheetMock = vi.fn();

vi.mock('../../../hooks/useLadderIdentityUploadGate', () => ({
  useLadderIdentityUploadGate: () => ({
    identity: { ready: true, displayName: 'ArenaBoss', initial: 'A' },
    identitySheetOpen: false,
    openIdentitySheet: vi.fn(),
    closeIdentitySheet: closeIdentitySheetMock,
    ensureIdentityReady: ensureIdentityReadyMock,
  }),
}));

vi.mock('../../ladder/LadderUploadGateSheetPortal', () => ({
  default: () => null,
}));

vi.mock('../../ladder/LadderIdentitySheet', () => ({
  default: () => null,
}));

const basePayload: PerformanceBreakthroughPayload = {
  metric: 'strength',
  score: 87.8,
  scoreDisplay: '87.80',
  title: '350hp雙門跑車',
  summary: '這是一段應預設收折的長解說文案。',
  bandId: 'TIER_80',
  decadeKey: '80',
  populationClass: '高階玩家',
  auraKey: 'flow',
  auraLabel: 'Flow',
  milestone: {
    currentMin: 80,
    nextMin: 90,
    progress01: 0.78,
    remainingPoints: 3,
  },
};

describe('PerformanceBreakthroughModal summary disclosure', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    document.body.querySelectorAll('[role="dialog"]').forEach((node) => node.remove());
  });

  it('keeps summary collapsed by default and expands on badge click', () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={basePayload} onClose={vi.fn()} />
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    const summary = Array.from(document.querySelectorAll('p')).find((el) =>
      el.textContent?.includes('應預設收折')
    );
    expect(summary).toBeDefined();
    expect(summary?.getAttribute('aria-hidden')).toBe('true');

    const badge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('aria-expanded')).toBe('false');
    expect(badge?.querySelector('svg')).not.toBeNull();

    act(() => {
      badge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const expandedBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Collapse')
    );
    expect(expandedBadge?.getAttribute('aria-expanded')).toBe('true');
    expect(summary?.getAttribute('aria-hidden')).toBe('false');
  });

  it('resets expanded state when payload identity changes while open', () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={basePayload} onClose={vi.fn()} />
      );
    });

    const badge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    act(() => {
      badge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      Array.from(document.querySelectorAll('button')).find((el) =>
        el.getAttribute('aria-label')?.includes('Collapse')
      )?.getAttribute('aria-expanded')
    ).toBe('true');

    const nextPayload: PerformanceBreakthroughPayload = {
      ...basePayload,
      score: 92,
      scoreDisplay: '92.00',
      populationClass: '凡人頂尖',
      decadeKey: '90',
      bandId: 'TIER_90',
    };

    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={nextPayload} onClose={vi.fn()} />
      );
    });

    const resetBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    expect(resetBadge?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders a static badge without chevron when summary is empty', () => {
    const emptySummaryPayload: PerformanceBreakthroughPayload = {
      ...basePayload,
      summary: '   ',
    };

    act(() => {
      root.render(
        <PerformanceBreakthroughModal open payload={emptySummaryPayload} onClose={vi.fn()} />
      );
    });

    const expandBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    expect(expandBadge).toBeUndefined();
    expect(document.querySelector('span[aria-label="高階玩家"]')).not.toBeNull();
    expect(
      Array.from(document.querySelectorAll('p')).some((el) =>
        el.textContent?.includes('應預設收折')
      )
    ).toBe(false);
  });

  it('shows Hall spectrum CTA only while summary is expanded and wires onOpenHallSpectrum', () => {
    const onOpenHallSpectrum = vi.fn();

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onOpenHallSpectrum={onOpenHallSpectrum}
        />
      );
    });

    expect(
      Array.from(document.querySelectorAll('button')).find(
        (el) => el.getAttribute('aria-label') === '開啟名人堂常模光譜'
      )
    ).toBeUndefined();

    const badge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Expand')
    );
    act(() => {
      badge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const hallCta = Array.from(document.querySelectorAll('button')).find(
      (el) => el.getAttribute('aria-label') === '開啟名人堂常模光譜'
    );
    expect(hallCta).toBeDefined();
    expect(hallCta?.textContent).toContain('名人堂光譜');

    act(() => {
      hallCta?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onOpenHallSpectrum).toHaveBeenCalledTimes(1);

    const collapseBadge = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Collapse')
    );
    act(() => {
      collapseBadge?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      Array.from(document.querySelectorAll('button')).find(
        (el) => el.getAttribute('aria-label') === '開啟名人堂常模光譜'
      )
    ).toBeUndefined();
  });

  it('does not dismiss breakthrough on Escape while spectrum overlay is open', () => {
    const onClose = vi.fn();

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={onClose}
          spectrumOverlayOpen
        />
      );
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={onClose}
          spectrumOverlayOpen={false}
        />
      );
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('PerformanceBreakthroughModal club dispatch modal', () => {
  let root: Root;
  let host: HTMLDivElement;

  const emptySummary = {
    attempted: 0,
    updated: 0,
    unchanged: 0,
    avatarPatched: 0,
    identityPatched: 0,
    errors: 0,
    invalidInput: 0,
    internal: 0,
    rateLimited: 0,
    proRequired: 0,
  };

  const dualSync = {
    syncPageGlobal: vi.fn(
      async (_options?: { afterGuild?: boolean }): Promise<{ ok: boolean }> => ({
        ok: true,
      })
    ),
    syncPageGuild: vi.fn(
      async (_options?: {
        broadcast?: boolean;
        comment?: string;
        broadcastMetricType?: string;
        skipFinished?: boolean;
      }): Promise<{ ok: boolean }> => ({ ok: true })
    ),
    busy: false,
    summary: null as typeof emptySummary | null,
    failures: [] as { metric: string; reason: string }[],
    gate: 'ok' as const,
    targetCount: 1,
    overallScore: 88,
    goJoinArena: vi.fn(),
    clearFeedback: vi.fn(),
    hasGuild: true,
    membershipSurface: 'dual' as const,
    lastCloudOutcome: null as
      | 'arena'
      | 'guild'
      | 'arena+guild'
      | 'dashboard-only'
      | null,
  };

  async function flushPipeline(): Promise<void> {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    await Promise.resolve();
  }

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    dualSync.syncPageGuild.mockClear();
    dualSync.syncPageGlobal.mockClear();
    dualSync.clearFeedback.mockClear();
    ensureIdentityReadyMock.mockReset();
    ensureIdentityReadyMock.mockReturnValue(true);
    closeIdentitySheetMock.mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    document.body.querySelectorAll('[role="dialog"]').forEach((node) => node.remove());
    document.body.querySelectorAll('[data-testid="club-dispatch-modal"]').forEach((node) =>
      node.remove()
    );
  });

  it('does not open club dispatch modal for global-only membership', () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={{ ...dualSync, membershipSurface: 'global-only', hasGuild: false }}
        />
      );
    });
    expect(document.querySelector('[data-testid="club-dispatch-modal"]')).toBeNull();
    expect(document.querySelector('[data-testid="club-progress-dispatch-panel"]')).toBeNull();
  });

  it('opens ClubDispatchModal from club sync and broadcasts with comment', async () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    expect(document.querySelector('[data-testid="club-dispatch-modal"]')).toBeNull();

    const guildBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Club Only'
    );
    expect(guildBtn).toBeDefined();

    act(() => {
      guildBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.querySelector('[data-testid="club-dispatch-modal"]')).not.toBeNull();

    const tag = document.querySelector(
      '[data-testid="club-dispatch-tag-overlimit"]'
    ) as HTMLButtonElement;
    act(() => {
      tag.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const input = document.querySelector(
      '[data-testid="club-dispatch-comment"]'
    ) as HTMLInputElement;
    expect(input.value).toBe('#今天不當人了');
    expect(
      document.querySelector('[data-testid="club-dispatch-comment-count"]')?.textContent
    ).toContain('7/25');

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild).toHaveBeenCalled();
    const arg = dualSync.syncPageGuild.mock.calls[0]?.[0];
    expect(arg).toMatchObject({
      broadcast: true,
      comment: '#今天不當人了',
      broadcastMetricType: 'strength',
    });
  });

  it('passes broadcast false on silent sync from ClubDispatchModal', async () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const guildBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Club Only'
    );

    act(() => {
      guildBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const silentBtn = document.querySelector(
      '[data-testid="club-dispatch-silent-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      silentBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild).toHaveBeenCalled();
    const arg = dualSync.syncPageGuild.mock.calls[0]?.[0];
    expect(arg).toMatchObject({ broadcast: false });
    expect(arg?.comment).toBeUndefined();
  });

  it('opens ClubDispatchModal from global+club and syncs both legs after broadcast', async () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );

    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.querySelector('[data-testid="club-dispatch-modal"]')).not.toBeNull();

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild).toHaveBeenCalled();
    expect(dualSync.syncPageGlobal).toHaveBeenCalled();
    // WHY: Club-first then arena — prevents global fan-out from zeroing broadcast delta.
    expect(dualSync.syncPageGuild.mock.invocationCallOrder[0]).toBeLessThan(
      dualSync.syncPageGlobal.mock.invocationCallOrder[0]!
    );
    expect(dualSync.syncPageGuild.mock.calls[0]?.[0]).toMatchObject({
      broadcast: true,
      comment: '',
      broadcastMetricType: 'strength',
      skipFinished: true,
    });
    expect(dualSync.syncPageGlobal.mock.calls[0]?.[0]).toMatchObject({ afterGuild: true });
  });

  it('opens club dispatch for dual even when ladder identity is not ready', () => {
    ensureIdentityReadyMock.mockReturnValue(false);

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );
    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // WHY: Entry must not hard-block Dual — identity gates belong to the arena leg only.
    expect(document.querySelector('[data-testid="club-dispatch-modal"]')).not.toBeNull();
    expect(dualSync.syncPageGlobal).not.toHaveBeenCalled();
    expect(dualSync.syncPageGuild).not.toHaveBeenCalled();
  });

  it('dual identity miss still runs club broadcast first; prompts identity before arena', async () => {
    ensureIdentityReadyMock.mockReturnValue(false);
    dualSync.syncPageGuild.mockResolvedValueOnce({ ok: true });

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );
    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild).toHaveBeenCalledWith(
      expect.objectContaining({
        broadcast: true,
        broadcastMetricType: 'strength',
        skipFinished: true,
      })
    );
    expect(ensureIdentityReadyMock).toHaveBeenCalled();
    expect(dualSync.syncPageGlobal).toHaveBeenCalledWith({ afterGuild: true });
  });

  it('dual treats undefined guildResult as not-ok for afterGuild (no TypeError)', async () => {
    dualSync.syncPageGuild.mockResolvedValueOnce(undefined as unknown as { ok: boolean });

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );
    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild).toHaveBeenCalled();
    expect(dualSync.syncPageGlobal).toHaveBeenCalledWith(undefined);
  });

  it('still runs global after guild when dual; passes afterGuild from guild result', async () => {
    dualSync.syncPageGuild.mockResolvedValueOnce({ ok: true });
    dualSync.syncPageGlobal.mockResolvedValueOnce({ ok: false });

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );
    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild.mock.invocationCallOrder[0]).toBeLessThan(
      dualSync.syncPageGlobal.mock.invocationCallOrder[0]!
    );
    expect(dualSync.syncPageGuild.mock.calls[0]?.[0]).toMatchObject({
      broadcast: true,
      broadcastMetricType: 'strength',
      skipFinished: true,
    });
    expect(dualSync.syncPageGlobal.mock.calls[0]?.[0]).toEqual({ afterGuild: true });
  });

  it('runs arena without afterGuild when club leg fails first', async () => {
    dualSync.syncPageGuild.mockResolvedValueOnce({ ok: false });

    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );
    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    expect(dualSync.syncPageGuild).toHaveBeenCalled();
    expect(dualSync.syncPageGlobal).toHaveBeenCalledWith(undefined);
  });

  it('shows arena+guild banner without guild-only not-public copy', async () => {
    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={dualSync}
        />
      );
    });

    const arenaBtn = Array.from(document.querySelectorAll('button')).find(
      (el) => el.textContent === 'Sync Arena+Club'
    );
    act(() => {
      arenaBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const broadcastBtn = document.querySelector(
      '[data-testid="club-dispatch-broadcast-sync"]'
    ) as HTMLButtonElement;

    await act(async () => {
      broadcastBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPipeline();
    });

    // Simulate hook composite outcome after both legs; session persist flag stays true.
    act(() => {
      root.render(
        <PerformanceBreakthroughModal
          open
          payload={basePayload}
          onClose={vi.fn()}
          onPersistToDashboard={() => true}
          arenaSync={{
            ...dualSync,
            lastCloudOutcome: 'arena+guild',
            summary: { ...emptySummary, attempted: 2, updated: 2 },
          }}
        />
      );
    });

    const statusText = Array.from(document.querySelectorAll('[role="status"]'))
      .map((el) => el.textContent ?? '')
      .join('\n');
    expect(statusText).toContain('全數同步');
    expect(statusText).not.toContain('未公開全球');
  });
});


