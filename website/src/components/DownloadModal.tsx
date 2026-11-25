import { useEffect, useId, useState, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import {
  detectMobilePlatform,
  resolveStoreAction,
  storeLinks,
  type StorePlatform,
} from '../config/storeLinks';
import { usePortalModalLock } from '../hooks/usePortalModalLock';
import { qrDataUrl } from '../utils/qrDataUrl';
import { trackDownloadClick } from '../utils/metaPixel';
import { AppleMark, GooglePlayMark } from './StoreBrandMarks';

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
}

type StoreVariant = 'android' | 'ios';

const STORE_COPY: Record<
  StoreVariant,
  {
    title: string;
    titleClass: string;
    cta: string;
    ctaClass: string;
    pending: string;
    shell: string;
  }
> = {
  android: {
    title: 'Android',
    titleClass: 'font-bold text-white',
    cta: '前往 Google Play 下載',
    ctaClass: 'btn-primary w-full justify-center font-bold',
    pending: 'Google Play 連結準備中',
    shell:
      'border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] to-white/[0.02]',
  },
  ios: {
    title: 'iOS',
    titleClass: 'font-semibold text-white',
    cta: '前往 App Store 下載',
    ctaClass:
      'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-fg transition hover:border-energy/40 hover:text-energy',
    pending: 'App Store 審核上架中，敬請期待',
    shell: 'border-white/10 bg-white/[0.02]',
  },
};

/**
 * Dual-store download sheet — Android primary CTA, iOS pending secondary.
 * WHY: Status lives only in the CTA / pending hint (driven by storeLinks flags),
 * so flipping `iosAvailable` auto-swaps the iOS card without badge chrome.
 */
export function DownloadModal({ open, onClose }: DownloadModalProps) {
  const titleId = useId();
  usePortalModalLock(onClose, open);

  if (!open) return null;

  const platform = detectMobilePlatform();

  const openStore = (p: StorePlatform) => {
    trackDownloadClick(p);
    const action = resolveStoreAction(p);
    if (action.kind === 'open') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    }
  };

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
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-white/15 bg-[#0B0F17]/95 px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl backdrop-blur-xl sm:rounded-2xl sm:px-6 sm:pt-6 sm:pb-6">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="ui-kicker-zh">免費下載 · 雙平台支援</p>
            <h2
              id={titleId}
              className="mt-1 text-xl font-bold text-white sm:text-2xl"
            >
              開始免費評測
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 p-2 text-fg-muted transition hover:border-white/25 hover:text-fg"
            aria-label="關閉下載視窗"
            autoFocus
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/*
          WHY Android first: Play is live — stack order + amber lift make the
          primary conversion path scan before the pending iOS card.
        */}
        <div className="grid gap-3">
          <StoreCard
            variant="android"
            available={storeLinks.androidAvailable}
            url={storeLinks.androidUrl}
            onOpen={() => openStore('android')}
            showQr={platform === 'desktop' && storeLinks.androidAvailable}
            mark={<GooglePlayMark className="h-6 w-6 shrink-0" />}
          />
          <StoreCard
            variant="ios"
            available={storeLinks.iosAvailable}
            url={storeLinks.iosUrl}
            onOpen={() => openStore('ios')}
            showQr={platform === 'desktop' && storeLinks.iosAvailable}
            mark={<AppleMark className="h-6 w-6 shrink-0 text-white" />}
          />
        </div>
      </div>
    </div>
  );
}

function StoreCard({
  variant,
  available,
  url,
  onOpen,
  showQr,
  mark,
}: {
  variant: StoreVariant;
  available: boolean;
  url: string;
  onOpen: () => void;
  showQr: boolean;
  mark: ReactNode;
}) {
  const copy = STORE_COPY[variant];

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 ${copy.shell}`}>
      <div className="flex items-center gap-2">
        {mark}
        <span className={copy.titleClass}>{copy.title}</span>
      </div>

      {showQr ? <StoreQr url={url} label={copy.title} /> : null}

      {available ? (
        <button type="button" onClick={onOpen} className={copy.ctaClass}>
          {copy.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <p className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-center text-sm text-fg-secondary">
          {copy.pending}
        </p>
      )}
    </div>
  );
}

function StoreQr({ url, label }: { url: string; label: string }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
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
  }, [url]);

  return (
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
        <span className="text-xs text-fg-muted">QR…</span>
      )}
    </div>
  );
}
