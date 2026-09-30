import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LadderIdentitySnapshot } from '../../hooks/useLadderIdentityReady';

export interface LadderIdentityChipProps {
  identity: LadderIdentitySnapshot;
  onClick?: () => void;
  className?: string;
}

/**
 * Compact arena persona next to the sync CTA — reinforces that the same identity is uploaded.
 * WHY: Broken avatar URLs must fall back to initial so the HUD never shows a broken-image glyph.
 * failedForUrl (not a boolean) auto-recovers when avatarUrl changes — no syncing useEffect.
 */
const LadderIdentityChip: FC<LadderIdentityChipProps> = ({ identity, onClick, className }) => {
  const { t } = useTranslation('common');
  const label = identity.displayName || t('ladder.syncAll.identityChipEmpty');
  const avatarUrl = String(identity.avatarUrl ?? '').trim();
  const [failedForUrl, setFailedForUrl] = useState<string | null>(null);
  const showAvatar = Boolean(avatarUrl) && failedForUrl !== avatarUrl;

  const inner = (
    <>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent-info/40 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-[11px] font-semibold uppercase text-accent-info/90"
        aria-hidden
      >
        {showAvatar ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFailedForUrl(avatarUrl)}
          />
        ) : (
          <span className="font-mono tracking-wide">{identity.initial}</span>
        )}
      </span>
      <span className="min-w-0 truncate text-xs font-medium text-zinc-300">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`inline-flex max-w-[10rem] items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/50 py-1 pl-1 pr-2.5 transition hover:border-zinc-500 ${className ?? ''}`}
        onClick={onClick}
        aria-label={t('ladder.syncAll.identityChipEditAria', { name: label })}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex max-w-[10rem] items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/50 py-1 pl-1 pr-2.5 ${className ?? ''}`}
      title={label}
    >
      {inner}
    </div>
  );
};

export default LadderIdentityChip;
