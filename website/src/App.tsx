import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';
import { StickyDownloadBar } from './components/StickyDownloadBar';
import { HomePage } from './pages/HomePage';
import { SciencePage } from './pages/SciencePage';
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
    window.scrollTo(0, 0);
  }, [location.pathname]);

  /*
    WHY chrome siblings of the scroll shell: fixed Navbar / Sticky CTA / Modal
    must not sit under overflow-x-hidden ancestors (sticky already fails; some
    engines also retarget fixed). Pages keep their own overflow guards.
  */
  return (
    <>
      <Navbar onDownload={openDownload} />
      <div
        className={`flex min-h-dvh max-w-[100vw] flex-col bg-void text-zinc-200 ${
          stickyVisible ? 'site-sticky-cta-clearance' : ''
        }`}
      >
        <main className="site-nav-offset-pt max-w-[100vw] flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<HomePage onDownload={openDownload} />} />
            <Route path="/science" element={<SciencePage />} />
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
      <DownloadModal open={downloadOpen} onClose={closeDownload} />
    </>
  );
}
