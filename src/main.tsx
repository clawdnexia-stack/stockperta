import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (window.confirm('Une nouvelle version de StockPerta est disponible. Recharger maintenant ?')) {
      void updateSW(true);
    }
  },
  onOfflineReady() {
    console.info('StockPerta est prêt pour un usage hors ligne.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
