import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ScrollToTop from './components/navigation/ScrollToTop';
import { applyProductionViewport } from './lib/applyProductionViewport';
import { logLadderEnvCheckInDev } from './lib/logLadderEnvCheck';
import { tryInitFirebaseFromEnv } from './services/firebaseClient';
import { soundService } from './services/soundService';
import { bootstrapDocumentLocaleFromStorage } from './i18n/bootstrapDocumentLocale';
import './i18n';
import './styles.css';

// WHY: Runs after module graph loads; i18n.init is async — reduces wrong manifest before first paint.
bootstrapDocumentLocaleFromStorage();

applyProductionViewport();

tryInitFirebaseFromEnv();

// WHY: Vite reads `.env` only at dev-server boot — log resolved ladder write path before any sync UI.
logLadderEnvCheckInDev();

void soundService.bootstrap();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
