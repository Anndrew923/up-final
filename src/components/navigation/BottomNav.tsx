import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../../config/nav.config';
import { NavGlyph } from './NavIcons';

/**
 * Bottom tab bar — paths from `NAV_ITEMS`.
 * Mirrors reference-app-fitness `BottomNavBar.jsx`: `position: fixed; bottom: 0`,
 * `height: calc(64px + env(safe-area-inset-bottom))`, `padding-bottom: env(safe-area-inset-bottom)`.
 * Requires `viewport-fit=cover` in `index.html` so insets apply on Android / iOS WebView.
 */
export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex w-screen max-w-[100vw] box-border h-[calc(64px+env(safe-area-inset-bottom,0px))] items-stretch justify-around border-t border-accent-info/40 bg-bg-base/85 pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] shadow-[0_-2px_8px_theme(colors.accent.info_/_0.2)] backdrop-blur-md backdrop-saturate-[180%]"
      aria-label={t('bottomNavAria', { ns: 'common' })}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={item.path}
          end
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-center transition-colors',
              isActive ? 'font-bold text-accent-info' : 'font-medium text-white/70',
            ].join(' ')
          }
        >
          <NavGlyph iconId={item.iconId} className="h-6 w-6 shrink-0" />
          <span className="max-w-[4.5rem] truncate text-[10px] leading-tight tracking-wide">
            {t(item.labelKey, { ns: 'common' })}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
