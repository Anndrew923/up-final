import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface StickyDownloadBarProps {
  onDownload: () => void;
  /** Sync mobile bottom padding so hidden sticky does not leave dead space. */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Mobile sticky CTA — hidden while Hero primary CTA is on-screen to avoid
 * double orange buttons + duplicate copy on first viewport.
 */
export function StickyDownloadBar({
  onDownload,
  onVisibilityChange,
}: StickyDownloadBarProps) {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(pathname !== '/');

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    if (pathname !== '/') {
      setVisible(true);
      return;
    }

    const target = document.getElementById('hero-primary-cta');
    if (!target || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide sticky while hero CTA is visible (or entering); show after it leaves.
        setVisible(!entry?.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        // Treat CTA as "still in view" a bit past the fold edge.
        rootMargin: '0px 0px -8% 0px',
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-panel/95 backdrop-blur-md transition-transform duration-300 ease-out md:hidden ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      aria-hidden={!visible}
      {...(!visible ? { inert: true } : {})}
    >
      <div className="ui-container flex items-center gap-3 pt-3 site-sticky-cta-pb">
        {/*
          WHY: Left copy must not repeat the button label; keep ≤8 CJK on the
          headline so 360px phones never hit truncate/ellipsis beside the CTA.
        */}
        <div className="min-w-0 flex-1 leading-snug">
          <p className="text-xs tracking-wider text-energy">
            核心功能永久免費
          </p>
          <p className="text-sm text-fg-secondary">一鍵測出六軸戰力</p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          tabIndex={visible ? 0 : -1}
          className="btn-primary shrink-0 !py-2.5"
        >
          <Download className="h-4 w-4" aria-hidden />
          開始免費評測
        </button>
      </div>
    </div>
  );
}
