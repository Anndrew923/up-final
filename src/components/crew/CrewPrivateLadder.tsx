import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import ProAvatarRing from '../ProAvatarRing';
import { formatCompactRelativeTime } from '../../logic/core/formatCompactRelativeTime';
import { ladderIdentityInitial } from '../../logic/core/ladderUploadPolicy';
import type { GuildMemberSnapshot } from '../../types/guild';

export interface CrewPrivateLadderProps {
  members: GuildMemberSnapshot[];
  authUid: string | null;
}

/**
 * Private crew ladder — visual parity with LadderPage rank rows (tier borders + mono score).
 */
const CrewPrivateLadder: FC<CrewPrivateLadderProps> = ({ members, authUid }) => {
  const { t } = useTranslation('common');

  return (
    <section className="ui-card space-y-4 border-slate-800/70 bg-gradient-to-b from-slate-900/70 to-slate-950/80 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <div className="h-4 w-1 shrink-0 rounded-full bg-cyan-400" />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-white">{t('crew.ladder.title')}</h3>
          <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-cyan-400/80">
            {t('crew.ladder.subtitle')}
          </span>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg border border-zinc-700/90 bg-zinc-900/40 px-4 py-6 text-center text-sm leading-relaxed text-zinc-400">
          {t('crew.ladder.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((row, index) => {
            const rank = index + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;
            const isMe = row.uid === authUid;
            const displayName = row.displayName || row.uid;
            const rowTierClass = isRank1
              ? 'bg-gradient-to-r from-amber-500/10 to-bg-panel/40 border-l-4 border-l-amber-500 border-y border-r border-y-amber-500/20 border-r-amber-500/20'
              : isRank2
                ? 'bg-gradient-to-r from-slate-300/10 to-bg-panel/40 border-l-4 border-l-slate-300 border-y border-r border-y-slate-300/20 border-r-slate-300/20'
                : isRank3
                  ? 'bg-gradient-to-r from-orange-500/10 to-bg-panel/40 border-l-4 border-l-orange-500 border-y border-r border-y-orange-500/20 border-r-orange-500/20'
                  : 'bg-zinc-900/40 border-l-2 border-l-zinc-700 border-y border-r border-zinc-800/80';
            const meHighlightClass = isMe
              ? 'ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] z-10'
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
              <li key={row.uid} className="list-none">
                <div
                  className={`group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-md px-3 py-3 text-sm sm:gap-4 sm:px-4 ${rowTierClass} ${meHighlightClass}`}
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
                      src={row.avatarUrl}
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
                      {Number.isFinite(row.ladderScore) ? row.ladderScore.toFixed(2) : '—'}
                    </p>
                    <p
                      className="hidden text-[10px] text-zinc-500 sm:block"
                      title={new Date(row.updatedAt).toLocaleString()}
                    >
                      {formatCompactRelativeTime(row.updatedAt)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CrewPrivateLadder;
