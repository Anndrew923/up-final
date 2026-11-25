import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';
import { BackToTopButton } from './components/BackToTopButton';
import { StickyDownloadBar } from './components/StickyDownloadBar';
import { HomePage } from './pages/HomePage';
import { SciencePage } from './pages/SciencePage';
import { PricingPage } from './pages/PricingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { initMetaPixel, trackPageView } from './utils/metaPixel';

export default function App() {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const location = useLocation();

  const openDownload = useCallback(() => setDownloadOpen(true), []);
  const closeDownload = useCallback(() => setDownloadOpen(false), []);
  const onStickyVisibility = useCallback((visible: boolean) => {
    setStickyVisible(visible);
  }, []);

  useDocumentMeta(location.pathname);

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  /*
    WHY: pathname-only scroll-to-top would cancel /#anchor jumps from subpages.
    Retry briefly so HomePage nodes exist after route paint; scroll-margin uses --site-nav-offset.
  */
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const id = decodeURIComponent(location.hash.slice(1));
    let cancelled = false;
    let attempts = 0;
    let timer = 0;

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        timer = window.setTimeout(tryScroll, 40);
      }
    };

    timer = window.setTimeout(tryScroll, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname, location.hash]);

  /*
    WHY chrome siblings of the scroll shell: fixed Navbar / Sticky CTA / Modal
    must not sit under overflow-x-hidden ancestors (sticky already fails; some
    engines also retarget fixed). Pages keep their own overflow guards.
  */
  return (
    <>
      <Navbar onDownload={openDownload} />
      <div
        className={`flex min-h-dvh max-w-[100vw] flex-col bg-void text-fg-secondary ${
          stickyVisible ? 'site-sticky-cta-clearance' : ''
        }`}
      >
        <main className="site-nav-offset-pt max-w-[100vw] flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<HomePage onDownload={openDownload} />} />
            <Route
              path="/science"
              element={<SciencePage onDownload={openDownload} />}
            />
            <Route
              path="/pricing"
              element={<PricingPage onDownload={openDownload} />}
            />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <StickyDownloadBar
        onDownload={openDownload}
        onVisibilityChange={onStickyVisibility}
      />
      <BackToTopButton />
      <DownloadModal open={downloadOpen} onClose={closeDownload} />
    </>
  );
}
