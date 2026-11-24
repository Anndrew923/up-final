import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { HOME_TOC } from '../data/homeToc';
import { scrollHomeAnchor } from '../utils/scrollHomeAnchor';

const PAGE_NAV = [
  { to: '/', label: '首頁', end: true },
  { to: '/science', label: '科學評測白皮書', end: false },
  { to: '/privacy', label: '隱私條款', end: false },
] as const;

interface NavbarProps {
  onDownload: () => void;
}

export function Navbar({ onDownload }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const { pathname } = useLocation();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const tocWrapRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change so SPA navigations never leave a ghost panel.
  useEffect(() => {
    setOpen(false);
    setTocOpen(false);
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

  useEffect(() => {
    if (!tocOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!tocWrapRef.current?.contains(event.target as Node)) {
        setTocOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTocOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [tocOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition ${
      isActive ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'
    }`;

  const closeMenus = () => {
    setOpen(false);
    setTocOpen(false);
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
            <Link to="/" className="min-w-0" onClick={closeMenus}>
              <span className="block truncate font-serif text-base text-zinc-100 sm:text-lg">
                最強肉體
              </span>
              <span className="block truncate font-mono text-[10px] tracking-wider text-zinc-400 sm:text-[11px]">
                ULTIMATE PHYSIQUE
              </span>
            </Link>

            <div className="hidden items-center gap-5 lg:gap-6 md:flex">
              {PAGE_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={closeMenus}
                >
                  {item.label}
                </NavLink>
              ))}

              <div ref={tocWrapRef} className="relative">
                <button
                  type="button"
                  className={`text-sm transition ${
                    tocOpen ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                  aria-expanded={tocOpen}
                  aria-haspopup="menu"
                  onClick={() => setTocOpen((v) => !v)}
                >
                  首頁目錄
                </button>
                {tocOpen ? (
                  <div
                    role="menu"
                    aria-label="首頁章節目錄"
                    className="absolute right-0 top-full z-50 mt-3 w-52 rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-xl backdrop-blur-md"
                  >
                    {HOME_TOC.map((item) => (
                      <Link
                        key={item.hash}
                        role="menuitem"
                        to={`/#${item.hash}`}
                        onClick={() => {
                          closeMenus();
                          // WHY: same-hash re-click does not update location; force scroll.
                          requestAnimationFrame(() => scrollHomeAnchor(item.hash));
                        }}
                        className="block rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

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
                WHY compact TOC + pb: page nav stays primary; chapter chips stay secondary
                so the primary CTA clears typical phone viewports without being clipped.
              */}
              <div className="ui-container flex flex-col pb-8">
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

                <nav className="mt-5 flex flex-col gap-4" aria-label="手機導覽連結">
                  <div>
                    <p className="ui-kicker-zh mb-2 px-1">頁面導覽</p>
                    <div className="flex flex-col gap-2">
                      {PAGE_NAV.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={closeMenus}
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
                    </div>
                  </div>

                  <div>
                    <p className="ui-kicker-zh mb-2 px-1">首頁目錄</p>
                    <div className="grid grid-cols-2 gap-2">
                      {HOME_TOC.map((item, index) => (
                        <Link
                          key={item.hash}
                          to={`/#${item.hash}`}
                          onClick={() => {
                            closeMenus();
                            requestAnimationFrame(() => scrollHomeAnchor(item.hash));
                          }}
                          className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-snug text-zinc-300 transition hover:border-white/20 hover:text-zinc-100 ${
                            index === HOME_TOC.length - 1 && HOME_TOC.length % 2 === 1
                              ? 'col-span-2'
                              : ''
                          }`}
                        >
                          <span
                            className="shrink-0 font-mono text-[10px] text-zinc-500"
                            aria-hidden
                          >
                            #
                          </span>
                          <span className="min-w-0">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary mt-1 w-full py-3.5"
                    onClick={() => {
                      closeMenus();
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
