import { useCallback, useId, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  readLocalMuteClubDispatches,
  writeLocalMuteClubDispatches,
} from '../../logic/core/clubProgressDispatchUi';
import { setClubDispatchMute } from '../../services/guildCallableService';

export interface CrewDispatchMuteSwitchProps {
  disabled?: boolean;
}

function DispatchBellIcon({ className }: { className?: string }) {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/**
 * Receive teammate progress dispatches — ON means muteClubDispatches === false.
 * Default ON (mute false). Compact single-row toolbar above the club roster.
 */
const CrewDispatchMuteSwitch: FC<CrewDispatchMuteSwitchProps> = ({ disabled = false }) => {
  const { t } = useTranslation('common');
  const labelId = useId();
  const hintId = useId();
  /** receiving === true ↔ mute false */
  const [receiving, setReceiving] = useState(() => !readLocalMuteClubDispatches());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onToggle = useCallback(async () => {
    if (busy || disabled) return;
    const nextReceiving = !receiving;
    const mute = !nextReceiving;
    setBusy(true);
    setError(null);
    setReceiving(nextReceiving);
    try {
      const result = await setClubDispatchMute({ mute });
      if (!result.ok) {
        setReceiving(!nextReceiving);
        setError(result.reason ?? 'failed');
        return;
      }
      const muted = result.muteClubDispatches;
      setReceiving(!muted);
      writeLocalMuteClubDispatches(muted);
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, receiving]);

  return (
    <div
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2"
      data-testid="crew-dispatch-mute-switch"
    >
      <div className="flex min-h-[24px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <DispatchBellIcon
            className={`h-4 w-4 shrink-0 ${receiving ? 'text-cyan-400' : 'text-zinc-500'}`}
          />
          <p
            id={labelId}
            className="truncate text-xs font-medium tracking-tight text-zinc-200"
            title={t('crew.dispatch.muteHint')}
          >
            {t('crew.dispatch.muteLabel')}
          </p>
          {/* WHY: Keep muteHint for SR without a second visual row (title still helps hover). */}
          <span id={hintId} className="sr-only">
            {t('crew.dispatch.muteHint')}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={receiving}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          disabled={disabled || busy}
          data-testid="crew-dispatch-mute-toggle"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-40 ${
            receiving ? 'bg-cyan-500' : 'bg-zinc-700'
          }`}
          onClick={() => void onToggle()}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              receiving ? 'left-[1.375rem]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[11px] text-rose-300">
          {t(`crew.errors.${error}`, { defaultValue: t('crew.errors.failed') })}
        </p>
      ) : null}
    </div>
  );
};

export default CrewDispatchMuteSwitch;
