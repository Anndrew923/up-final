import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';
import { useUiInteractionStore } from '../../stores/uiInteractionStore';
import HudAvatar from './HudAvatar';

function SettingsGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path
        fill="currentColor"
        d="M19.4 13a7.9 7.9 0 0 0 .05-1 7.9 7.9 0 0 0-.05-1l2.05-1.6a.5.5 0 0 0 .12-.63l-1.94-3.35a.5.5 0 0 0-.6-.22l-2.42.97a7.62 7.62 0 0 0-1.73-1l-.37-2.58a.5.5 0 0 0-.49-.42h-3.87a.5.5 0 0 0-.49.42l-.37 2.58c-.62.24-1.2.58-1.73 1l-2.42-.97a.5.5 0 0 0-.6.22L2.38 8.77a.5.5 0 0 0 .12.63L4.55 11a7.9 7.9 0 0 0-.05 1c0 .34.02.67.05 1L2.5 14.6a.5.5 0 0 0-.12.63l1.94 3.35a.5.5 0 0 0 .6.22l2.42-.97c.53.42 1.11.76 1.73 1l.37 2.58a.5.5 0 0 0 .49.42h3.87a.5.5 0 0 0 .49-.42l.37-2.58c.62-.24 1.2-.58 1.73-1l2.42.97a.5.5 0 0 0 .6-.22l1.94-3.35a.5.5 0 0 0-.12-.63zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
      />
    </svg>
  );
}

/** Floating top-right profile controls: settings gear + avatar. */
export default function HudProfileControls() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const isBlocked = useUiInteractionStore((s) => s.isHomeResonanceBlocking);

  return (
    <div
      className={`ml-auto flex items-center gap-2 motion-safe:transition-opacity motion-safe:duration-300 ${isBlocked ? 'pointer-events-none opacity-40 saturate-50' : ''}`}
      aria-hidden={isBlocked}
    >
      <button
        type="button"
        onClick={() => navigate(ROUTES.settings)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        aria-label={t('shellSettingsAria')}
        title={t('settings.title')}
      >
        <SettingsGlyph />
      </button>
      <HudAvatar />
    </div>
  );
}
