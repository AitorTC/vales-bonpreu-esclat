import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Mobile Web Push Notifications and offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('sw.js', window.location.href).href;
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('Service Worker registrat amb èxit:', registration.scope);
        })
        .catch((error) => {
          console.warn('Avís Service Worker:', error);
        });
    } catch (e) {
      console.warn('Service worker setup error:', e);
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
