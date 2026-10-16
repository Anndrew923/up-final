import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CoachManageDrawer from '../components/crew/CoachManageDrawer';
import CrewEmptyState from '../components/crew/CrewEmptyState';
import CrewIdentityBanner from '../components/crew/CrewIdentityBanner';
import CrewPrivateLadder from '../components/crew/CrewPrivateLadder';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { useCrewGuild } from '../hooks/useCrewGuild';

/**
 * Crew HQ — independent `/crew` route (HUD back → Garage).
 * Not compact shell: title clears fixed HUD avatar/back row.
 */
export default function CrewPage() {
  const { t } = useTranslation('common');
  const crew = useCrewGuild();
  const [manageOpen, setManageOpen] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  const showJoined = crew.status === 'ready' && crew.guild != null;
  const showEmpty = crew.status === 'empty' || (crew.status === 'ready' && !crew.guild);

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ui-tools-backdrop absolute inset-0 opacity-[0.05]" />
      </div>

      <ShellFlowStack gapClassName="space-y-4">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('crew.page.kicker')}
            </p>
            <h1 className="truncate text-3xl font-bold tracking-tight text-zinc-50">
              {t('crew.page.title')}
            </h1>
            {crew.fromCache && showJoined ? (
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {t('crew.page.fromCache')}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showJoined ? (
              <button
                type="button"
                className="rounded-xl border border-zinc-700/70 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-40"
                disabled={crew.refreshing || crew.busy}
                onClick={() => void crew.refresh(true)}
              >
                {crew.refreshing ? t('crew.page.refreshing') : t('crew.page.refresh')}
              </button>
            ) : null}
            {showJoined && crew.isCoach ? (
              <button
                type="button"
                className="rounded-xl border border-zinc-700/70 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-200"
                aria-label={t('crew.manage.openAria')}
                onClick={() => setManageOpen(true)}
              >
                {t('crew.manage.openLabel')}
              </button>
            ) : null}
          </div>
        </header>

        {crew.status === 'loading' || crew.status === 'idle' ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/50"
              />
            ))}
          </div>
        ) : null}

        {crew.status === 'error' ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {t('crew.page.loadError')}
            </p>
            <button
              type="button"
              className="ui-btn"
              onClick={() => void crew.refresh(true)}
            >
              {t('crew.page.refresh')}
            </button>
          </div>
        ) : null}

        {showEmpty ? (
          <CrewEmptyState
            isPro={crew.isPro}
            busy={crew.busy}
            actionError={crew.actionError}
            onClearError={crew.clearActionError}
            onJoin={crew.join}
            onCreate={crew.create}
          />
        ) : null}

        {showJoined && crew.guild ? (
          <>
            <CrewIdentityBanner guild={crew.guild} />
            <CrewPrivateLadder members={crew.rankedMembers} authUid={crew.authUid} />

            {!crew.isCoach ? (
              <section className="rounded-2xl border border-zinc-800 bg-bg-card/80 p-4">
                {!leaveConfirm ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-zinc-600 px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:border-rose-500/40 hover:text-rose-200 disabled:opacity-40"
                    disabled={crew.busy}
                    onClick={() => setLeaveConfirm(true)}
                  >
                    {t('crew.leave.cta')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-100">{t('crew.leave.confirmTitle')}</p>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {t('crew.leave.confirmBody')}
                    </p>
                    {crew.actionError ? (
                      <p role="alert" className="text-sm text-rose-300">
                        {t(`crew.errors.${crew.actionError}`)}
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-300"
                        onClick={() => setLeaveConfirm(false)}
                      >
                        {t('crew.leave.cancel')}
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-xl border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 disabled:opacity-40"
                        disabled={crew.busy}
                        onClick={() => void crew.leave()}
                      >
                        {crew.busy ? t('crew.leave.leaving') : t('crew.leave.confirm')}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            <CoachManageDrawer
              open={manageOpen}
              onClose={() => setManageOpen(false)}
              guild={crew.guild}
              members={crew.rankedMembers}
              coachUid={crew.guild.coachUid}
              busy={crew.busy}
              actionError={crew.actionError}
              onClearError={crew.clearActionError}
              onKick={crew.kick}
              onRename={crew.rename}
              onDisband={async () => {
                const result = await crew.disband();
                if (result.ok) setManageOpen(false);
                return result;
              }}
            />
          </>
        ) : null}
      </ShellFlowStack>
    </main>
  );
}
