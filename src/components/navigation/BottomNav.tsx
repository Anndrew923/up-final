import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ONBOARDING_ASSESS_TARGET_ID } from '../../constants/onboardingTargets';
import { NAV_ITEMS } from '../../config/nav.config';
import {
  useShellInteractionBlocked,
  useUiInteractionStore,
} from '../../stores/uiInteractionStore';
import { NavGlyph } from './NavIcons';

const CENTER_HEX_ACTIVE =
  'bg-cyan-600/90 text-white shadow-[0_0_22px_rgba(34,211,238,0.65)]';
const CENTER_HEX_INACTIVE =
  'bg-slate-800/95 text-cyan-200/70 shadow-[0_0_12px_rgba(15,23,42,0.7)]';
const CENTER_HEX_SPOTLIGHT =
  'bg-cyan-500 text-white shadow-[0_0_28px_rgba(34,211,238,0.85),0_0_48px_rgba(34,211,238,0.35)] ring-2 ring-cyan-300/90';

/**
 * Bottom tab bar — paths from `NAV_ITEMS`.
 * Mirrors reference-app-fitness `BottomNavBar.jsx`: `position: fixed; bottom: 0`,
 * `height: calc(64px + env(safe-area-inset-bottom))`, `padding-bottom: env(safe-area-inset-bottom)`.
 * Requires `viewport-fit=cover` in `index.html` so insets apply on Android / iOS WebView.
 */
export default function BottomNav() {
  const { t } = useTranslation();
  const centerIndex = 2;
  const isBlocked = useShellInteractionBlocked();
  const bootPhase = useUiInteractionStore((s) => s.bootSequencePhase);
  const isResonanceBlocking = useUiInteractionStore((s) => s.isHomeResonanceBlocking);

  const isBootPhase3Spotlight = bootPhase === 3;
  const dimEntireNav =
    isResonanceBlocking || (isBlocked && bootPhase !== 0 && bootPhase !== 3);

  return (
    <nav
      className={[
        'fixed bottom-0 left-0 right-0 z-50 flex h-[calc(78px+env(safe-area-inset-bottom,0px))] w-screen max-w-[100vw] items-end px-2 pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] motion-safe:transition-opacity motion-safe:duration-300',
        isBlocked ? 'pointer-events-none' : '',
        dimEntireNav ? 'opacity-40 saturate-50' : '',
        isBootPhase3Spotlight ? 'opacity-100 saturate-100' : '',
      ].join(' ')}
      aria-label={t('bottomNavAria', { ns: 'common' })}
      aria-hidden={isBlocked}
    >
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[66px] border-t border-cyan-200/20 bg-slate-950/50 shadow-[0_-14px_36px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-[190%]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[66px] bg-gradient-to-t from-cyan-950/10 to-transparent" ></div>

      {NAV_ITEMS.map((item, index) => {
        const isCenter = index === centerIndex;

        if (isCenter) {
          return (
            <NavLink
              key={item.key}
              id={ONBOARDING_ASSESS_TARGET_ID}
              to={item.path}
              end
              className={({ isActive }) =>
                [
                  'relative z-20 flex h-16 basis-1/5 flex-col items-center justify-center -translate-y-4 motion-safe:transition-transform motion-safe:duration-300',
                  isBootPhase3Spotlight ? 'scale-105 text-cyan-300' : '',
                  isActive ? 'text-cyan-300' : 'text-slate-400',
                ].join(' ')
              }
            >
              {({ isActive }) => {
                const showSpotlight = isBootPhase3Spotlight;
                const showActive = isActive || showSpotlight;
                const hexClass = showSpotlight
                  ? CENTER_HEX_SPOTLIGHT
                  : showActive
                    ? CENTER_HEX_ACTIVE
                    : CENTER_HEX_INACTIVE;

                return (
                  <>
                    <div
                      className={[
                        'relative flex h-16 w-16 items-center justify-center transition-all duration-300',
                        '[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]',
                        'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent',
                        'after:pointer-events-none after:absolute after:bottom-0 after:h-1 after:w-full after:bg-cyan-300/50 after:blur-sm',
                        hexClass,
                      ].join(' ')}
                    >
                      <span className="absolute inset-0 grid place-items-center">
                        <NavGlyph iconId={item.iconId} className="h-8 w-8 translate-x-[1.5px]" />
                      </span>
                    </div>
                    <span
                      className={[
                        'mt-1 max-w-[4.5rem] truncate text-[10px] font-extrabold uppercase tracking-[0.18em]',
                        showSpotlight ? 'text-cyan-200' : '',
                      ].join(' ')}
                    >
                      {t(item.labelKey, { ns: 'common' })}
                    </span>
                  </>
                );
              }}
            </NavLink>
          );
        }

        const dimSideTab = isBootPhase3Spotlight;

        return (
          <NavLink
            key={item.key}
            to={item.path}
            end
            className={({ isActive }) =>
              [
                'relative z-10 flex h-16 basis-1/5 flex-col items-center justify-center gap-1 px-1 text-center transition-all duration-300',
                dimSideTab ? 'opacity-35 saturate-50' : '',
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
