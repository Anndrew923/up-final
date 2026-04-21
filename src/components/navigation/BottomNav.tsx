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
  const centerIndex = 2;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[calc(78px+env(safe-area-inset-bottom,0px))] w-screen max-w-[100vw] items-end px-2 pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]"
      aria-label={t('bottomNavAria', { ns: 'common' })}
    >
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[66px] border-t border-cyan-200/20 bg-slate-950/50 shadow-[0_-14px_36px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-[190%]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[66px] bg-gradient-to-t from-cyan-950/10 to-transparent" />

      {NAV_ITEMS.map((item, index) => {
        const isCenter = index === centerIndex;

        if (isCenter) {
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end
              className={({ isActive }) =>
                [
                  'relative z-10 flex h-16 basis-1/5 flex-col items-center justify-center -translate-y-4',
                  isActive ? 'text-cyan-300' : 'text-slate-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={[
                      'relative flex h-16 w-16 items-center justify-center transition-all duration-300',
                      '[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]',
                      'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent',
                      'after:pointer-events-none after:absolute after:bottom-0 after:h-1 after:w-full after:bg-cyan-300/50 after:blur-sm',
                      isActive
                        ? 'bg-cyan-600/90 text-white shadow-[0_0_22px_rgba(34,211,238,0.65)]'
                        : 'bg-slate-800/95 text-cyan-200/70 shadow-[0_0_12px_rgba(15,23,42,0.7)]',
                    ].join(' ')}
                  >
                    <span className="absolute inset-0 grid place-items-center">
                      <NavGlyph iconId={item.iconId} className="h-8 w-8 translate-x-[1.5px]" />
                    </span>
                  </div>
                  <span className="mt-1 max-w-[4.5rem] truncate text-[10px] font-extrabold uppercase tracking-[0.18em]">
                    {t(item.labelKey, { ns: 'common' })}
                  </span>
                </>
              )}
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.key}
            to={item.path}
            end
            className={({ isActive }) =>
              [
                'relative z-10 flex h-16 basis-1/5 flex-col items-center justify-center gap-1 px-1 text-center transition-all duration-300',
                isActive
                  ? 'scale-105 font-bold text-cyan-300'
                  : 'font-medium text-slate-400 hover:text-slate-200',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <NavGlyph iconId={item.iconId} className="h-6 w-6 shrink-0" />
                <span className="max-w-[4.5rem] truncate text-[10px] leading-tight tracking-wide">
                  {t(item.labelKey, { ns: 'common' })}
                </span>
                {isActive ? (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.95)]" />
                ) : null}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
