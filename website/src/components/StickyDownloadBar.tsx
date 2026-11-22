import { Download } from 'lucide-react';

interface StickyDownloadBarProps {
  onDownload: () => void;
}

/** Mobile sticky CTA for in-app browsers (FB/IG) — does not cover reading with generous bottom pad on pages. */
export function StickyDownloadBar({ onDownload }: StickyDownloadBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-panel/95 backdrop-blur-md md:hidden safe-pb">
      <div className="ui-container flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] tracking-wider text-energy">
            START DYNO
          </p>
          <p className="truncate text-sm text-zinc-200">開始測功 · 本機六軸全開</p>
        </div>
        <button type="button" onClick={onDownload} className="btn-primary shrink-0 !py-2.5">
          <Download className="h-4 w-4" />
          下載
        </button>
      </div>
    </div>
  );
}
