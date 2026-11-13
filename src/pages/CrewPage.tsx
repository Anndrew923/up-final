import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import CoachManageDrawer from '../components/crew/CoachManageDrawer';
import CrewEmptyState from '../components/crew/CrewEmptyState';
import CrewIdentityBanner from '../components/crew/CrewIdentityBanner';
import CrewPrivateLadder from '../components/crew/CrewPrivateLadder';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { useCrewGuild } from '../hooks/useCrewGuild';
import { useGuildPushRegistration } from '../hooks/usePushNotificationLifecycle';
import {
  clearClubDispatchTapCache,
  consumeClubDispatchTapCache,
} from '../logic/core/clubDispatchTapCache';
import {
  CREW_FOCUS_UID_QUERY_KEY,
  findGuildMemberByFocusUid,
  parseCrewFocusUid,
} from '../logic/core/crewFocusUid';

function RefreshGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.6-6.2" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function ManageGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M1 14h6" />
      <path d="M9 8h6" />
      <path d="M17 16h6" />
    </svg>
  );
}

const iconBtnClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-700/70 bg-zinc-800/50 text-zinc-300 transition hover:border-cyan-500/40 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-40';

/**
 * Crew HQ — independent `/crew` route (HUD back → Garage).
 * Not compact shell: title clears fixed HUD avatar/back row.
 * Deep link: `/crew?focusUid=` auto-opens member radar sheet when on roster.
 */
export default function CrewPage() {
  const { t } = useTranslation('common');
  const crew = useCrewGuild();
  const [searchParams, setSearchParams] = useSearchParams();
  const [manageOpen, setManageOpen] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [dispatchComment, setDispatchComment] = useState<string | null>(null);

  const focusUid = parseCrewFocusUid(searchParams.get(CREW_FOCUS_UID_QUERY_KEY));

  const clearFocusUidQuery = useCallback(() => {
    if (!searchParams.has(CREW_FOCUS_UID_QUERY_KEY)) return;
    const next = new URLSearchParams(searchParams);
    next.delete(CREW_FOCUS_UID_QUERY_KEY);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearDispatchComment = useCallback(() => {
    setDispatchComment(null);
    clearClubDispatchTapCache();
  }, []);

  const showJoined = crew.status === 'ready' && crew.guild != null;
  const showEmpty = crew.status === 'empty' || (crew.status === 'ready' && !crew.guild);

  // WHY: Only prompt/register push when signed-in club members enter Crew HQ (not cold-start guests).
  useGuildPushRegistration({
    enabled: showJoined && Boolean(crew.authUid),
  });

  // WHY: Valid focusUid is cleared by ladder after open; invalid / empty-club must not sticky-pollute URL.
  useEffect(() => {
    if (!focusUid) return;
    if (showEmpty) {
      clearFocusUidQuery();
      // WHY: Drop orphaned push stash when the viewer is not in a club.
      clearDispatchComment();
      return;
    }
    if (!showJoined) return;
    if (findGuildMemberByFocusUid(crew.rankedMembers, focusUid)) return;
    clearFocusUidQuery();
    // WHY: Unknown focusUid must not leave a pending comment for a later coincidental match.
    clearDispatchComment();
  }, [
    focusUid,
    showEmpty,
    showJoined,
    crew.rankedMembers,
    clearFocusUidQuery,
    clearDispatchComment,
  ]);

  // WHY: Consume FCM stash after roster is ready — cold start may navigate before members hydrate.
  useEffect(() => {
    if (!focusUid || !showJoined) return;
    if (!findGuildMemberByFocusUid(crew.rankedMembers, focusUid)) return;
    const hit = consumeClubDispatchTapCache({ focusUid });
    if (hit?.comment) {
      setDispatchComment(hit.comment);
    }
  }, [focusUid, showJoined, crew.rankedMembers]);

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="ui-tools-backdrop absolute inset-0 opacity-[0.05]" />
      </div>

      <ShellFlowStack gapClassName="space-y-3">
        {showJoined && crew.guild ? (
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <CrewIdentityBanner guild={crew.guild} />
            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <button
                type="button"
                className={iconBtnClass}
                disabled={crew.refreshing || crew.busy}
                aria-label={
                  crew.refreshing ? t('crew.page.refreshing') : t('crew.page.refresh')
                }
                title={
                  crew.refreshing ? t('crew.page.refreshing') : t('crew.page.refresh')
                }
                data-testid="crew-refresh"
                onClick={() => void crew.refresh(true)}
              >
                <RefreshGlyph
                  className={`h-4 w-4 ${crew.refreshing ? 'motion-safe:animate-spin' : ''}`}
                />
              </button>
              {crew.isCoach ? (
                <button
                  type="button"
                  className={iconBtnClass}
                  disabled={crew.busy}
                  aria-label={t('crew.manage.openAria')}
                  title={t('crew.manage.openLabel')}
                  data-testid="crew-manage"
                  onClick={() => setManageOpen(true)}
                >
                  <ManageGlyph className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </header>
        ) : (
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
                {t('crew.page.kicker')}
              </p>
              <h1 className="truncate text-3xl font-bold tracking-tight text-zinc-50">
                {t('crew.page.title')}
              </h1>
            </div>
          </header>
        )}

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
            <CrewPrivateLadder
              members={crew.rankedMembers}
              authUid={crew.authUid}
              guildTag={crew.guild.tag}
              focusUid={focusUid}
              onFocusUidConsumed={clearFocusUidQuery}
              dispatchComment={dispatchComment}
              onClearDispatchComment={clearDispatchComment}
              muteDisabled={crew.busy}
            />

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
