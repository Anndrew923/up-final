import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { storeLinks } from '../config/storeLinks';

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition ${
      isActive ? 'text-brand' : 'text-zinc-400 hover:text-zinc-100'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-base/90 backdrop-blur-md safe-pt">
      <div className="ui-container">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:h-16">
          <Link to="/" className="min-w-0" onClick={() => setOpen(false)}>
            <span className="block truncate font-serif text-base text-zinc-50 sm:text-lg">
              最強肉體
            </span>
            <span className="block truncate font-mono text-[10px] tracking-wider text-zinc-500 sm:text-[11px]">
              ULTIMATE PHYSIQUE · v{storeLinks.appVersion}
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
            <button type="button" onClick={onDownload} className="btn-primary !py-2 !text-xs">
              立即下載
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-zinc-200 md:hidden"
            aria-label={open ? '關閉選單' : '開啟選單'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-base md:hidden" role="dialog" aria-modal="true">
          <div className="ui-container flex h-full flex-col safe-pt safe-pb">
            <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <span className="font-serif text-lg text-zinc-50">最強肉體</span>
              <button
                type="button"
                className="rounded-lg border border-white/10 p-2"
                aria-label="關閉選單"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-2" aria-label="手機導覽">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl border px-4 py-4 text-base ${
                      isActive
                        ? 'border-brand/40 bg-brand/10 text-brand'
                        : 'border-white/10 bg-card text-zinc-200'
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
                立即下載 / 開始測功
              </button>
            </nav>
            <p className="mt-auto font-mono text-xs text-zinc-600">
              TELEMETRY // HUD NAV
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
