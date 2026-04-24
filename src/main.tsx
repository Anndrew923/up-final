import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ScrollToTop from './components/navigation/ScrollToTop';
import { applyProductionViewport } from './lib/applyProductionViewport';
import { tryInitFirebaseFromEnv } from './services/firebaseClient';
import './i18n';
import './styles.css';

applyProductionViewport();

tryInitFirebaseFromEnv();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
