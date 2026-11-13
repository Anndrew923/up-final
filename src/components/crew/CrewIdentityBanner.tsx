import { type FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInviteCodeForDisplay } from '../../logic/core/guildInviteCode';
import type { GuildDoc } from '../../types/guild';

export interface CrewIdentityBannerProps {
  guild: GuildDoc;
}

function ClipboardGlyph({ className }: { className?: string }) {
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
      <path d="M9 5h6a2 2 0 0 1 2 2v1H7V7a2 2 0 0 1 2-2z" />
      <path d="M7 8h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" />
    </svg>
  );
}

/**
 * Compact club identity for the Crew page header — title + single meta row (no card chrome).
 * WHY: First viewport budget belongs to the roster; identity must not own a second stacked block.
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

  const copyStatusLabel =
    copyState === 'ok'
      ? t('crew.banner.copied')
      : copyState === 'fail'
        ? t('crew.banner.copyFail')
        : t('crew.banner.copy');

  return (
    <div className="min-w-0" data-testid="crew-identity-banner">
      <h1 className="truncate text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
        <span className="font-mono text-cyan-300">[{guild.tag}]</span>{' '}
        <span>{guild.name}</span>
      </h1>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
        <span className="font-mono tabular-nums tracking-wide">
          {t('crew.banner.members', {
            count: guild.memberCount,
            max: guild.maxMembers,
          })}
        </span>
        <span className="text-zinc-600" aria-hidden>
          ·
        </span>
        <button
          type="button"
          data-testid="crew-invite-copy"
          className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-1 py-0.5 font-mono text-[11px] font-semibold tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
            copyState === 'fail'
              ? 'text-rose-300 hover:text-rose-200'
              : copyState === 'ok'
                ? 'text-emerald-300'
                : 'text-cyan-200/90 hover:text-cyan-100'
          }`}
          aria-label={`${t('crew.banner.inviteLabel')}: ${displayCode}. ${copyStatusLabel}`}
          title={copyStatusLabel}
          onClick={() => void handleCopy()}
        >
          <span className="truncate">{displayCode}</span>
          <ClipboardGlyph className="h-3.5 w-3.5 shrink-0" />
          {copyState === 'ok' || copyState === 'fail' ? (
            <span
              className="shrink-0 text-[10px] font-semibold normal-case tracking-normal"
              role="status"
              aria-live="polite"
            >
              {copyState === 'ok' ? t('crew.banner.copied') : t('crew.banner.copyFail')}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
};

export default CrewIdentityBanner;
