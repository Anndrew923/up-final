import { useEffect, useId, useState } from 'react';
import { ExternalLink, Smartphone, X } from 'lucide-react';
import {
  detectMobilePlatform,
  getStoreUrl,
  storeLinks,
  type StorePlatform,
} from '../config/storeLinks';
import { qrDataUrl } from '../utils/qrDataUrl';
import { trackDownloadClick } from '../utils/metaPixel';

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
}

export function DownloadModal({ open, onClose }: DownloadModalProps) {
  const titleId = useId();
  const platform = detectMobilePlatform();
  const mobileStoreUrl =
    platform === 'desktop' ? null : getStoreUrl(platform);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const openStore = (p: StorePlatform) => {
    const url = getStoreUrl(p);
    trackDownloadClick(p);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const autoHint =
    platform === 'ios'
      ? storeLinks.iosAvailable
        ? '偵測到 iOS — 建議前往 App Store'
        : '偵測到 iOS — App Store 連結準備中，可先查看 Android 或稍後再來'
      : platform === 'android'
        ? storeLinks.androidAvailable
          ? '偵測到 Android — 建議前往 Google Play'
          : '偵測到 Android — Play 連結準備中'
        : '桌面瀏覽 — 掃描 QR 或選擇平台';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="關閉"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-white/10 bg-panel p-5 shadow-brand sm:rounded-2xl sm:p-6 safe-pb">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="ui-kicker">DOWNLOAD // DYNO GATE</p>
            <h2
              id={titleId}
              className="mt-1 font-serif text-xl text-zinc-50 sm:text-2xl"
            >
              開始免費評測
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{autoHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-zinc-100"
            aria-label="關閉下載視窗"
            autoFocus
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mobileStoreUrl && (
          <button
            type="button"
            onClick={() => openStore(platform as StorePlatform)}
            className="btn-primary mb-4 w-full"
          >
            <Smartphone className="h-4 w-4" />
            {platform === 'ios' ? '開啟 App Store' : '開啟 Google Play'}
          </button>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <StoreCard
            label="iOS"
            status={storeLinks.iosAvailable ? '可下載' : '即將上架'}
            available={storeLinks.iosAvailable}
            url={storeLinks.iosUrl}
            onOpen={() => openStore('ios')}
            showQr={platform === 'desktop' && storeLinks.iosAvailable}
          />
          <StoreCard
            label="Android"
            status={storeLinks.androidAvailable ? '可下載' : '即將上架'}
            available={storeLinks.androidAvailable}
            url={storeLinks.androidUrl}
            onOpen={() => openStore('android')}
            showQr={platform === 'desktop' && storeLinks.androidAvailable}
          />
        </div>

        <p className="mt-4 font-mono text-[10px] text-zinc-400">
          最強肉體 Ultimate Physique · 支援 iOS &amp; Android
        </p>
      </div>
    </div>
  );
}

function StoreCard({
  label,
  status,
  available,
  url,
  onOpen,
  showQr,
}: {
  label: string;
  status: string;
  available: boolean;
  url: string;
  onOpen: () => void;
  showQr: boolean;
}) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!showQr || !available) {
      setQr(null);
      return;
    }
    let cancelled = false;
    void qrDataUrl(url).then((data) => {
      if (!cancelled) setQr(data);
    });
    return () => {
      cancelled = true;
    };
  }, [showQr, available, url]);

  return (
    <div className="ui-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-energy">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
            available ? 'bg-brand/20 text-brand' : 'bg-white/5 text-zinc-400'
          }`}
        >
          {status}
        </span>
      </div>
      {showQr && (
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-lg border border-white/10 bg-void">
          {qr ? (
            <img
              src={qr}
              alt={`${label} 下載 QR Code`}
              className="h-28 w-28 rounded-lg"
              width={112}
              height={112}
            />
          ) : (
            <span className="font-mono text-[10px] text-zinc-400">QR…</span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onOpen}
        disabled={!available}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          available
            ? 'bg-white/5 text-zinc-100 hover:bg-brand/15 hover:text-brand'
            : 'cursor-not-allowed bg-white/[0.03] text-zinc-400'
        }`}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {available ? '前往商店' : '連結準備中'}
      </button>
    </div>
  );
}
