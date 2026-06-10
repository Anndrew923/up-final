import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ScrollToTop from './components/navigation/ScrollToTop';
import { applyProductionViewport } from './lib/applyProductionViewport';
import { logLadderEnvCheckInDev } from './lib/logLadderEnvCheck';
import { tryInitFirebaseFromEnv } from './services/firebaseClient';
import { bootstrapLocaleOnStartup } from './services/localeBootstrap';
import { soundService } from './services/soundService';
import './i18n';
import './styles.css';

// WHY: Document locale sync + native Device alignment; i18n.init remains async.
void bootstrapLocaleOnStartup();

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
