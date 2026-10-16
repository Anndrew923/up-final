import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInviteCodeForDisplay } from '../../logic/core/guildInviteCode';
import type { GuildDoc } from '../../types/guild';

export interface CrewIdentityBannerProps {
  guild: GuildDoc;
}

const CrewIdentityBanner: FC<CrewIdentityBannerProps> = ({ guild }) => {
  const { t } = useTranslation('common');
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const displayCode = formatInviteCodeForDisplay(guild.inviteCode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guild.inviteCode);
      setCopyState('ok');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('fail');
      window.setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-bg-card to-bg-panel p-5 shadow-panel">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-cyan-300">
            [{guild.tag}]
          </span>
          <h2 className="mt-2 truncate text-xl font-bold text-zinc-50">{guild.name}</h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            {t('crew.banner.members', {
              count: guild.memberCount,
              max: guild.maxMembers,
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {t('crew.banner.inviteLabel')}
        </span>
        <code className="rounded-lg border border-zinc-700 bg-black/40 px-2.5 py-1 font-mono text-sm tracking-widest text-cyan-200">
          {displayCode}
        </code>
        <button
          type="button"
          className="inline-flex rounded-lg border border-zinc-600 bg-zinc-800/60 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition hover:border-cyan-500/40 hover:text-cyan-200"
          onClick={() => void handleCopy()}
        >
          {copyState === 'ok'
            ? t('crew.banner.copied')
            : copyState === 'fail'
              ? t('crew.banner.copyFail')
              : t('crew.banner.copy')}
        </button>
      </div>
    </section>
  );
};

export default CrewIdentityBanner;
