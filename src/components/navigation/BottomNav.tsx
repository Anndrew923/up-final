import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../../config/nav.config';
import { NavGlyph } from './NavIcons';

/**
 * Bottom tab bar — paths and order from `NAV_ITEMS` (fitness-style icons + blur bar).
 */
export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="flex w-full min-h-[calc(64px+env(safe-area-inset-bottom,0px))] items-stretch justify-around border-t border-accent-info/40 bg-bg-base/85 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_8px_theme(colors.accent.info_/_0.2)] backdrop-blur-md backdrop-saturate-[180%]"
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
