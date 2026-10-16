import { type FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInviteCodeForDisplay } from '../../logic/core/guildInviteCode';
import type { GuildDoc } from '../../types/guild';

export interface CrewIdentityBannerProps {
  guild: GuildDoc;
}

/**
 * Compact club identity strip — name/count left, invite capsule right.
 * WHY: First viewport must expose the member ladder; card height is budgeted tightly.
 */
const CrewIdentityBanner: FC<CrewIdentityBannerProps> = ({ guild }) => {
  const { t } = useTranslation('common');
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const resetTimerRef = useRef<number | null>(null);
  const displayCode = formatInviteCodeForDisplay(guild.inviteCode);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleReset = (ms: number) => {
    if (resetTimerRef.current != null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      resetTimerRef.current = null;
    }, ms);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guild.inviteCode);
      setCopyState('ok');
      scheduleReset(2000);
    } catch {
      setCopyState('fail');
      scheduleReset(2500);
    }
  };

  // Compact capsule keeps short labels; fail detail stays in aria / title.
  const capsuleLabel =
    copyState === 'ok' ? t('crew.banner.copied') : t('crew.banner.copy');
  const failDetail = copyState === 'fail' ? t('crew.banner.copyFail') : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-bg-card to-bg-panel px-3.5 py-3 shadow-panel">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-md border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-cyan-300">
            [{guild.tag}]
          </span>
          <h2 className="mt-1 truncate text-lg font-bold leading-tight text-zinc-50">
            {guild.name}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {t('crew.banner.members', {
              count: guild.memberCount,
              max: guild.maxMembers,
            })}
          </p>
        </div>
        <button
          type="button"
          className={`inline-flex max-w-[48%] shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left transition ${
            copyState === 'fail'
              ? 'border-rose-500/40 bg-rose-500/10'
              : 'border-cyan-500/35 bg-cyan-500/10 hover:border-cyan-400/55 hover:bg-cyan-500/15'
          }`}
          aria-label={
            failDetail
              ? `${t('crew.banner.inviteLabel')}: ${displayCode}. ${failDetail}`
              : `${t('crew.banner.inviteLabel')}: ${displayCode}. ${capsuleLabel}`
          }
          title={failDetail ?? undefined}
          onClick={() => void handleCopy()}
        >
          <span className="min-w-0 truncate font-mono text-[11px] font-semibold tracking-wider text-cyan-200">
            {displayCode}
          </span>
          <span
            className={`shrink-0 text-[10px] font-semibold ${
              copyState === 'fail' ? 'text-rose-200' : 'text-zinc-300'
            }`}
          >
            {capsuleLabel}
          </span>
        </button>
      </div>
    </section>
  );
};

export default CrewIdentityBanner;
