import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Automatically register and update service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Versi baru PesanBuah.id tersedia.');
  },
  onOfflineReady() {
    console.log('PesanBuah.id siap digunakan secara offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

