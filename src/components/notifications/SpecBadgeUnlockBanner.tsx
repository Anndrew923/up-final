import { useCallback, useEffect, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useBadgeToastStore, type BadgeToastEntry } from '../../stores/badgeToastStore';

const EXIT_MS = 250;

const BannerCard: FC<{ entry: BadgeToastEntry; onDone: () => void }> = ({ entry, onDone }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (phase !== 'exit') return;
    const exitTimer = setTimeout(onDone, EXIT_MS);
    return () => clearTimeout(exitTimer);
  }, [phase, onDone]);

  const handleTap = () => {
    navigate(ROUTES.history, { state: { focusBadgeId: entry.badgeId } });
    setPhase('exit');
  };

  const badgeName = t(`history.badges.items.${entry.badgeId}.name`);
  const animClass = phase === 'enter'
    ? 'animate-toast-slide-in'
    : 'animate-toast-slide-out';

  return (
    <button
      type="button"
      onClick={handleTap}
      className={`pointer-events-auto mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-cyan-500/30 bg-zinc-900/95 px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-lg ${animClass} motion-reduce:animate-none`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-950/60">
        <span className="text-base" aria-hidden>🏅</span>
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold text-cyan-200">{badgeName}</span>
        <span className="block text-[11px] text-zinc-400">
          {t('badgeToast.unlocked')} · {t('badgeToast.tapToView')}
        </span>
      </span>
    </button>
  );
};

const SpecBadgeUnlockBanner: FC = () => {
  const queue = useBadgeToastStore((s) => s.queue);
  const dismiss = useBadgeToastStore((s) => s.dismiss);
  const current = queue[0] ?? null;

  const handleDone = useCallback(() => {
    dismiss();
  }, [dismiss]);

  if (!current) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] ${Z_INDEX_CLASS.badgeUnlockToast} flex justify-center px-4`}
      aria-live="polite"
    >
      <BannerCard key={current.badgeId + current.queuedAt} entry={current} onDone={handleDone} />
    </div>
  );
};

export default SpecBadgeUnlockBanner;
