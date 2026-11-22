import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', label: '首頁', end: true },
  { to: '/science', label: '科學評測白皮書', end: false },
  { to: '/privacy', label: '隱私條款', end: false },
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
      // Return focus to the hamburger after close for keyboard users.
      menuBtnRef.current?.focus();
    };
  }, [open]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition ${
      isActive ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'
    }`;

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
            <Link to="/" className="min-w-0" onClick={() => setOpen(false)}>
              <span className="block truncate font-serif text-base text-zinc-100 sm:text-lg">
                最強肉體
              </span>
              <span className="block truncate font-mono text-[10px] tracking-wider text-zinc-400 sm:text-[11px]">
                ULTIMATE PHYSIQUE
              </span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
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
              className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-zinc-200 md:hidden"
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
            {/* Scrim — tap outside panel closes; isolates Hero / CTA from nav copy. */}
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
              <div className="ui-container flex flex-col pb-6">
                <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <span className="font-serif text-lg text-zinc-100">最強肉體</span>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    className="rounded-lg border border-white/10 p-2 text-zinc-200"
                    aria-label="關閉選單"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="mt-6 flex flex-col gap-2" aria-label="手機導覽連結">
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `rounded-xl border px-4 py-4 text-base ${
                          isActive
                            ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-200'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    className="btn-primary mt-4 w-full py-4"
                    onClick={() => {
                      setOpen(false);
                      onDownload();
                    }}
                  >
                    開始免費評測
                  </button>
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
