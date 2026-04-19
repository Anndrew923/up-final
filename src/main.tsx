import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './i18n';
import './styles.css';
import {
  ensureFirebaseAuthReady,
  isFirestoreConfigured,
  tryInitFirebaseFromEnv,
} from './services/firebaseClient';

tryInitFirebaseFromEnv();

void (async () => {
  if (!isFirestoreConfigured()) return;
  try {
    await ensureFirebaseAuthReady();
  } catch (err) {
    console.warn(
      '[firebase] Anonymous sign-in failed — Firestore ops may fail until resolved.',
      err
    );
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
