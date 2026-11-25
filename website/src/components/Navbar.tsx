import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, X } from 'lucide-react';
import { BrandLockup } from './BrandLockup';

/**
 * Primary page cards — privacy stays off this list (drawer footer + site Footer).
 * WHY order: Home → pricing → science so mobile drawer mirrors conversion priority.
 */
const PAGE_NAV = [
  { to: '/', label: '首頁', end: true },
  { to: '/pricing', label: 'Pro 方案與常見問題', end: false },
  { to: '/science', label: '科學評測與 14 階基準', end: false },
] as const;

interface NavbarProps {
  onDownload: () => void;
}

export function Navbar({ onDownload }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change so SPA navigations never leave a ghost panel.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      menuBtnRef.current?.focus();
    };
  }, [open]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition ${
      isActive ? 'text-fg' : 'text-fg-secondary hover:text-fg'
    }`;

  const closeDrawer = () => {
    setOpen(false);
  };

  /*
    WHY fixed (not sticky): ancestors use overflow-x-hidden which breaks sticky.
    WHY blur on inner shell only: backdrop-filter creates a fixed containing block;
    the mobile drawer must portal to document.body so inset-0 covers the viewport.
    Safe-area top padding keeps Dynamic Island / status bar clear.
  */
  const bar = (
    <header className="fixed inset-x-0 top-0 z-50 safe-pt">
      <div className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="ui-container">
          <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:h-16">
            <Link to="/" className="min-w-0" onClick={closeDrawer}>
              <BrandLockup nameClassName="truncate text-base sm:text-lg" />
            </Link>

            <div className="hidden items-center gap-5 lg:gap-6 md:flex">
              {PAGE_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={closeDrawer}
                >
                  {item.label}
                </NavLink>
              ))}

              <button type="button" onClick={onDownload} className="btn-primary !py-2 !text-xs">
                開始免費評測
              </button>
            </div>

            <button
              ref={menuBtnRef}
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-fg md:hidden"
              aria-label={open ? '關閉選單' : '開啟選單'}
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const drawer =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="md:hidden" role="presentation">
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
              aria-label="關閉選單"
              onClick={() => setOpen(false)}
            />
            <div
              id="mobile-nav-drawer"
              className="fixed inset-x-0 top-0 z-[70] max-h-dvh overflow-y-auto border-b border-zinc-800 bg-zinc-950 safe-pt safe-pb"
              role="dialog"
              aria-modal="true"
              aria-label="手機導覽"
            >
              {/*
                WHY pb-8: three page cards + CTA + privacy link must clear the home
                indicator without a secondary chapter grid competing for viewport.
              */}
              <div className="ui-container flex flex-col pb-8">
                <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <BrandLockup
                    nameClassName="truncate text-lg"
                    showSub={false}
                  />
                  <button
                    ref={closeBtnRef}
                    type="button"
                    className="rounded-lg border border-white/10 p-2 text-fg"
                    aria-label="關閉選單"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-5 flex flex-col gap-4" aria-label="手機導覽連結">
                  {/*
                    WHY no kicker + white rows + ChevronRight: three entries read as
                    tappable destinations; energy border marks the current route only.
                  */}
                  <div className="flex flex-col gap-2">
                    {PAGE_NAV.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={closeDrawer}
                        className={({ isActive }) =>
                          `group flex items-center justify-between gap-3 rounded-xl border px-4 py-4 text-base font-medium text-white transition-all ${
                            isActive
                              ? 'border-energy/40 bg-energy/[0.06]'
                              : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className="min-w-0 text-left">{item.label}</span>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5 ${
                                isActive
                                  ? 'text-energy'
                                  : 'text-fg-muted group-hover:text-energy group-active:text-energy'
                              }`}
                              aria-hidden
                            />
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn-primary mt-1 w-full py-3.5"
                    onClick={() => {
                      closeDrawer();
                      onDownload();
                    }}
                  >
                    開始免費評測
                  </button>

                  {/*
                    WHY: Privacy is legally required but low-conversion — keep it below
                    the primary CTA as a quiet text link, not a third nav card.
                  */}
                  <Link
                    to="/privacy"
                    onClick={closeDrawer}
                    className="ui-label mt-3 block px-1 text-center underline-offset-2 transition hover:text-fg-secondary hover:underline"
                  >
                    隱私條款與健康免責
                  </Link>
                </nav>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {bar}
      {drawer}
    </>
  );
}
