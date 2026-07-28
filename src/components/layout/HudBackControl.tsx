import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isHudBackRoutePath } from '../../config/routes';
import { canNavigateHistoryBack, resolveHudBackFallback } from '../../lib/hudBackNavigation';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';

/**
 * Fixed top-left HUD back — only on non-tab sub-routes.
 * WHY: Lives in `shell-hud-slot` (not page scroll) so iOS users always have a return path
 * while the top-right avatar/settings cluster stays untouched.
 *
 * Do not set `pointer-events-auto` on this control: the HUD slot already toggles
 * pointer-events; a child auto would punch through shell-blocked states.
 */
export default function HudBackControl() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isBlocked = useShellInteractionBlocked();

  if (!isHudBackRoutePath(pathname)) return null;

  const handleBack = () => {
    if (canNavigateHistoryBack(window.history.state)) {
      navigate(-1);
      return;
    }
    navigate(resolveHudBackFallback(pathname, search), { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      disabled={isBlocked}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-50 disabled:pointer-events-none disabled:opacity-40"
      aria-label={t('back')}
    >
      {t('back')}
    </button>
  );
}
