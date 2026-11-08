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

/**
 * Receive teammate progress dispatches — ON means muteClubDispatches === false.
 * Default ON (mute false). Local mirror hydrates UI until a prefs-read Callable exists.
 */
const CrewDispatchMuteSwitch: FC<CrewDispatchMuteSwitchProps> = ({ disabled = false }) => {
  const { t } = useTranslation('common');
  const switchId = useId();
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
    <section
      className="rounded-2xl border border-zinc-800 bg-bg-card/80 p-4"
      data-testid="crew-dispatch-mute-switch"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p id={switchId} className="text-sm font-medium text-zinc-100">
            {t('crew.dispatch.muteLabel')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t('crew.dispatch.muteHint')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={receiving}
          aria-labelledby={switchId}
          disabled={disabled || busy}
          data-testid="crew-dispatch-mute-toggle"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
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
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {t(`crew.errors.${error}`, { defaultValue: t('crew.errors.failed') })}
        </p>
      ) : null}
    </section>
  );
};

export default CrewDispatchMuteSwitch;
