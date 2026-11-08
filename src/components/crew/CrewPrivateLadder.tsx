import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  LADDER_FLOATING_RANK_BAR_PX,
  LADDER_SCROLL_BOTTOM_INSET_PX,
} from '../../constants/bottomChrome';
import { useLocalProfileBrief } from '../../hooks/useLocalProfileBrief';
import { useMergedScoresFromLocalStores } from '../../hooks/useMergedScoresFromLocalStores';
import { resolveSixAxisChartLabel } from '../../i18n/resolveSixAxisChartLabel';
import { cn } from '../../lib/cn';
import { SHELL_SCROLL_ID } from '../../lib/shellScrollLock';
import { formatCompactRelativeTime } from '../../logic/core/formatCompactRelativeTime';
import {
  CREW_FLOATING_AT_TOP_SCROLL_PX,
  CREW_FLOATING_FORCE_RANK_THRESHOLD,
  CREW_LIST_OVERFLOW_VIEWPORT_RATIO,
  shouldShowCrewFloatingYouBar,
} from '../../logic/core/crewFloatingYouBar';
import { findGuildMemberByFocusUid } from '../../logic/core/crewFocusUid';
import {
  CLUB_LADDER_DIMENSIONS,
  type ClubLadderDimension,
  guildMemberDimensionScore,
  sortGuildMembersByDimension,
} from '../../logic/core/guildRadarScores';
import { ladderIdentityInitial } from '../../logic/core/ladderUploadPolicy';
import { scoreMapHasPositiveAxis } from '../../logic/core/scoreMapGuards';
import { resolveSelfFloatingAvatarUrl } from '../../services/ladderIdentityService';
import { useAuthStore } from '../../stores/authStore';
import type { GuildMemberSnapshot } from '../../types/guild';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import ProAvatarRing from '../ProAvatarRing';
import { ladderDivisionTabClass } from '../ladder/ladderDivisionTabClass';
import CrewFloatingYouBar from './CrewFloatingYouBar';
import CrewMemberRadarSheet from './CrewMemberRadarSheet';

/** Brief cyan pulse after sticky-bar jump so the user can find their row in a long roster. */
const CREW_JUMP_HIGHLIGHT_MS = 1200;

export interface CrewPrivateLadderProps {
  members: GuildMemberSnapshot[];
  authUid: string | null;
  /** Club tag for detail sheet eyebrow (e.g. ARN). */
  guildTag?: string;
  /**
   * Deep-link target (`/crew?focusUid=`). Opens radar sheet once when member is on roster.
   * Invalid / missing → no-op (never throw).
   */
  focusUid?: string | null;
  /** Fired after a valid focusUid successfully opens the sheet (parent may clear query). */
  onFocusUidConsumed?: (uid: string) => void;
}

/**
 * Club member ladder — overall + axis funnel (client sort) + radar sheet (embedded scores).
 * Sticky “You” bar + compare-with-me radar use only in-memory roster + local ScoreMap (no network).
 */
const CrewPrivateLadder: FC<CrewPrivateLadderProps> = ({
  members,
  authUid,
  guildTag = '',
  focusUid = null,
  onFocusUidConsumed,
}) => {
  const { t } = useTranslation('common');
  const { avatarUrl: localAvatarUrl } = useLocalProfileBrief();
  const authPhotoURL = useAuthStore((s) => s.photoURL);
  const [dimension, setDimension] = useState<ClubLadderDimension>('overall');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [myRowInViewport, setMyRowInViewport] = useState(false);
  const [listOverflowsViewport, setListOverflowsViewport] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [jumpHighlight, setJumpHighlight] = useState(false);
  const myRowRef = useRef<HTMLLIElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const jumpHighlightTimerRef = useRef<number | null>(null);
  const jumpRafRef = useRef<number | null>(null);
  const consumedFocusUidRef = useRef<string | null>(null);
  const onFocusUidConsumedRef = useRef(onFocusUidConsumed);
  onFocusUidConsumedRef.current = onFocusUidConsumed;
  const localScores = useMergedScoresFromLocalStores();

  // WHY: Consume each focusUid once — closing the sheet must not re-open from the same query.
  useEffect(() => {
    if (!focusUid) {
      consumedFocusUidRef.current = null;
      return;
    }
    if (consumedFocusUidRef.current === focusUid) return;
    const member = findGuildMemberByFocusUid(members, focusUid);
    if (!member) return;
    consumedFocusUidRef.current = focusUid;
    setSelectedUid(member.uid);
    onFocusUidConsumedRef.current?.(member.uid);
  }, [focusUid, members]);

  const labelForDimension = (dim: ClubLadderDimension): string => {
    if (dim === 'overall') return t('crew.ladder.dimOverall');
    return resolveSixAxisChartLabel(t, dim as SixAxisMetric);
  };

  const ranked = useMemo(
    () => sortGuildMembersByDimension(members, dimension),
    [members, dimension]
  );

  const myIndex = useMemo(() => {
    if (!authUid) return -1;
    return ranked.findIndex((m) => m.uid === authUid);
  }, [ranked, authUid]);

  const myMember = myIndex >= 0 ? ranked[myIndex] : null;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myDimScore = myMember ? guildMemberDimensionScore(myMember, dimension) : null;
  const myScoreLabel =
    myDimScore == null ? '—' : myDimScore.toFixed(2);
  const floatingAvatarUrl = resolveSelfFloatingAvatarUrl({
    memberAvatarUrl: myMember?.avatarUrl,
    localAvatarUrl,
    authPhotoURL,
  });

  const selectedIndex = selectedUid
    ? ranked.findIndex((m) => m.uid === selectedUid)
    : -1;
  const selectedMember = selectedIndex >= 0 ? ranked[selectedIndex] : null;

  const detailOpen = selectedMember != null;

  // Local baseline always available for opt-in PK; sheet hides toggle when isSelf.
  const comparisonScores: ScoreMap | null = useMemo(
    () => (scoreMapHasPositiveAxis(localScores) ? localScores : null),
    [localScores]
  );
  const isSelfSelected = Boolean(
    authUid && selectedMember && selectedMember.uid === authUid
  );

  useEffect(() => {
    // WHY: AppShell scrolls `#layer-shell-scroll`, not `window` — window.scrollY stays 0 on club.
    const shell = document.getElementById(SHELL_SCROLL_ID);
    const syncAtTop = () => {
      const top = shell?.scrollTop ?? window.scrollY;
      setIsAtTop(top < CREW_FLOATING_AT_TOP_SCROLL_PX);
    };
    syncAtTop();
    const target: HTMLElement | Window = shell ?? window;
    target.addEventListener('scroll', syncAtTop, { passive: true });
    return () => target.removeEventListener('scroll', syncAtTop);
  }, []);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) {
      setListOverflowsViewport(false);
      return;
    }
    const measure = () => {
      setListOverflowsViewport(
        listEl.scrollHeight > window.innerHeight * CREW_LIST_OVERFLOW_VIEWPORT_RATIO
      );
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ranked.length, dimension]);

  useEffect(() => {
    if (!authUid || myIndex < 0) {
      setMyRowInViewport(false);
      return;
    }
    const el = myRowRef.current;
    if (!el) {
      setMyRowInViewport(false);
      return;
    }
    const shell = document.getElementById(SHELL_SCROLL_ID);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setMyRowInViewport(entry.isIntersecting);
      },
      {
        // WHY: AppShell scrolls `#layer-shell-scroll`; viewport root would mis-report rows.
        root: shell,
        threshold: 0.2,
        rootMargin: `0px 0px -${LADDER_SCROLL_BOTTOM_INSET_PX}px 0px`,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [authUid, myIndex, ranked, dimension]);

  const forceAtTop =
    isAtTop && myRank != null && myRank > CREW_FLOATING_FORCE_RANK_THRESHOLD;
  const showFloatingYou = shouldShowCrewFloatingYouBar({
    myRank,
    myRowInViewport,
    listOverflowsViewport,
    forceAtTop,
    detailOpen,
  });

  useEffect(() => {
    return () => {
      if (jumpHighlightTimerRef.current != null) {
        window.clearTimeout(jumpHighlightTimerRef.current);
      }
      if (jumpRafRef.current != null) {
        window.cancelAnimationFrame(jumpRafRef.current);
      }
    };
  }, []);

  const jumpToMyRow = useCallback(() => {
    const el = myRowRef.current;
    if (!el) return;
    if (jumpRafRef.current != null) {
      window.cancelAnimationFrame(jumpRafRef.current);
    }
    jumpRafRef.current = requestAnimationFrame(() => {
      jumpRafRef.current = null;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setJumpHighlight(true);
    if (jumpHighlightTimerRef.current != null) {
      window.clearTimeout(jumpHighlightTimerRef.current);
    }
    jumpHighlightTimerRef.current = window.setTimeout(() => {
      setJumpHighlight(false);
      jumpHighlightTimerRef.current = null;
    }, CREW_JUMP_HIGHLIGHT_MS);
  }, []);

  return (
    <section className="ui-card space-y-4 border-slate-800/70 bg-gradient-to-b from-slate-900/70 to-slate-950/80 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <div className="h-4 w-1 shrink-0 rounded-full bg-cyan-400" />
        <h3 className="min-w-0 truncate text-lg font-bold text-white">
          {t('crew.ladder.title')}
        </h3>
      </div>

      {/* C2 — dimension funnel; visual parity with LadderFilterSheet division tabs. */}
      <nav
        className="-mx-1 flex snap-x snap-mandatory gap-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t('crew.ladder.dimensionAria')}
      >
        {CLUB_LADDER_DIMENSIONS.map((dim) => {
          const active = dim === dimension;
          return (
            <button
              key={dim}
              type="button"
              role="tab"
              aria-selected={active}
              className={`snap-start ${ladderDivisionTabClass(active)}`}
              onClick={() => setDimension(dim)}
            >
              {labelForDimension(dim)}
            </button>
          );
        })}
      </nav>

      {ranked.length === 0 ? (
        <p className="rounded-lg border border-zinc-700/90 bg-zinc-900/40 px-4 py-6 text-center text-sm leading-relaxed text-zinc-400">
          {t('crew.ladder.empty')}
        </p>
      ) : (
        <ul
          ref={listRef}
          className="space-y-2"
          style={
            showFloatingYou
              ? { paddingBottom: LADDER_FLOATING_RANK_BAR_PX + 12 }
              : undefined
          }
        >
          {ranked.map((row, index) => {
            const rank = index + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;
            const isMe = row.uid === authUid;
            const displayName = row.displayName || row.uid;
            const dimScore = guildMemberDimensionScore(row, dimension);
            const scoreText =
              dimScore == null ? '—' : dimScore.toFixed(2);
            const rowTierClass = isRank1
              ? 'bg-gradient-to-r from-amber-500/10 to-bg-panel/40 border-l-4 border-l-amber-500 border-y border-r border-y-amber-500/20 border-r-amber-500/20'
              : isRank2
                ? 'bg-gradient-to-r from-slate-300/10 to-bg-panel/40 border-l-4 border-l-slate-300 border-y border-r border-y-slate-300/20 border-r-slate-300/20'
                : isRank3
                  ? 'bg-gradient-to-r from-orange-500/10 to-bg-panel/40 border-l-4 border-l-orange-500 border-y border-r border-y-orange-500/20 border-r-orange-500/20'
                  : 'bg-zinc-900/40 border-l-2 border-l-zinc-700 border-y border-r border-zinc-800/80';
            const meHighlightClass = isMe
              ? cn(
                  'ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] z-10 motion-safe:transition-shadow motion-safe:duration-300',
                  jumpHighlight &&
                    'ring-2 ring-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.45)]'
                )
              : '';
            const rankClass = isRank1
              ? 'text-amber-400 font-bold drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] text-xs sm:text-sm'
              : isRank2
                ? 'text-slate-300 font-bold text-xs sm:text-sm'
                : isRank3
                  ? 'text-orange-400 font-bold text-xs sm:text-sm'
                  : 'text-zinc-500 font-medium text-[11px] sm:text-xs';
            const scoreClass = isRank1
              ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]'
              : 'text-accent-primary';

            return (
              <li
                key={row.uid}
                ref={isMe ? myRowRef : undefined}
                className="list-none"
              >
                <button
                  type="button"
                  className={`group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-md px-3 py-3 text-left text-sm sm:gap-4 sm:px-4 ${rowTierClass} ${meHighlightClass}`}
                  onClick={() => setSelectedUid(row.uid)}
                  aria-label={t('crew.ladder.openDetailAria', { name: displayName })}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <span
                      className={`w-7 shrink-0 text-center font-mono sm:w-10 sm:text-left ${rankClass}`}
                    >
                      {isRank1 ? `✦ #${rank}` : `#${rank}`}
                    </span>
                    <ProAvatarRing
                      isPro={false}
                      size="sm"
                      src={isMe ? floatingAvatarUrl : row.avatarUrl}
                      alt=""
                      fallback={ladderIdentityInitial(displayName)}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">
                        {displayName}
                        {isMe ? (
                          <span className="ml-1.5 text-[10px] font-normal text-cyan-400/80">
                            ({t('crew.ladder.you')})
                          </span>
                        ) : null}
                      </p>
                      <p className="hidden truncate font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:block">
                        {row.uid}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-[56px] shrink-0 text-right sm:min-w-[84px]">
                    <p
                      className={`font-mono text-xs font-semibold tabular-nums sm:text-base ${scoreClass}`}
                    >
                      {scoreText}
                    </p>
                    <p
                      className="hidden text-[10px] text-zinc-500 sm:block"
                      title={new Date(row.updatedAt).toLocaleString()}
                    >
                      {formatCompactRelativeTime(row.updatedAt)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showFloatingYou && myMember && myRank != null ? (
        <CrewFloatingYouBar
          myRank={myRank}
          myScoreLabel={myScoreLabel}
          displayName={myMember.displayName || myMember.uid}
          avatarUrl={floatingAvatarUrl}
          onJumpToMyRow={jumpToMyRow}
        />
      ) : null}

      <CrewMemberRadarSheet
        open={selectedMember != null}
        member={selectedMember}
        rank={selectedIndex >= 0 ? selectedIndex + 1 : null}
        guildTag={guildTag}
        isSelf={isSelfSelected}
        comparisonScores={comparisonScores}
        onClose={() => setSelectedUid(null)}
      />
    </section>
  );
};

export default CrewPrivateLadder;
