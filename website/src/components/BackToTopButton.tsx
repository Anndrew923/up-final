import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const SHOW_AFTER_PX = 360;

/**
 * Site-wide back-to-top — sits above mobile Sticky CTA, not under page overflow shells.
 * WHY: Long /science and home need a one-tap reset without colliding with 「開始免費評測」.
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // WHY: Only commit when the boolean flips — avoids re-render on every scroll pixel.
    let shown = window.scrollY > SHOW_AFTER_PX;
    setVisible(shown);

    const onScroll = () => {
      const next = window.scrollY > SHOW_AFTER_PX;
      if (next === shown) return;
      shown = next;
      setVisible(next);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="回到頂部"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-zinc-900/90 text-zinc-200 shadow-lg backdrop-blur-md transition duration-300 ease-out hover:border-energy/50 hover:text-energy md:bottom-8 md:right-8 ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ChevronUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
