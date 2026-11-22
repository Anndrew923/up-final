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
  const location = useLocation();

  const openDownload = useCallback(() => setDownloadOpen(true), []);
  const closeDownload = useCallback(() => setDownloadOpen(false), []);

  useDocumentMeta(location.pathname);

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    trackPageView();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-void text-zinc-200">
      <Navbar onDownload={openDownload} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage onDownload={openDownload} />} />
          <Route path="/science" element={<SciencePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <StickyDownloadBar onDownload={openDownload} />
      <DownloadModal open={downloadOpen} onClose={closeDownload} />
    </div>
  );
}
