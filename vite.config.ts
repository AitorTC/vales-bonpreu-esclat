import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {copyFileSync} from 'node:fs';
import path from 'path';
import {defineConfig} from 'vite';

/** GitHub Pages project site base path (must match repo name). */
function getBasePath(): string {
  if (process.env.VITE_BASE_PATH) {
    const base = process.env.VITE_BASE_PATH;
    return base.endsWith('/') ? base : `${base}/`;
  }
  const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
  if (repo) {
    return `/${repo}/`;
  }
  return '/vales-bonpreu-esclat/';
}

const ghPages404Plugin = () => ({
  name: 'gh-pages-spa-404',
  closeBundle() {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
  },
});

const pwaPlugin = () => ({
  name: 'pwa-assets-server',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === '/sw.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(`
// Service Worker for Descomptes d'Aitor i Xènia · Bonpreu Esclat
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Vales Bonpreu Esclat", body: event.data ? event.data.text() : '' };
  }

  const title = data.title || "Val per caducar en 2 dies! (Aitor i Xènia)";
  const options = {
    body: data.body || "Tens un val de Bonpreu Esclat que venç aviat. Obre l'app per veure el codi.",
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    tag: data.tag || 'bonpreu-alert',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
        `);
        return;
      }

      if (req.url === '/manifest.json') {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(JSON.stringify({
          id: '/',
          name: "Descomptes d'Aitor i Xènia · Bonpreu Esclat",
          short_name: "Vales A&X",
          description: "Monedero de vales de Bonpreu Esclat para Aitor y Xènia con alertas de caducidad en 2 días y escaneo por foto.",
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#FFFFFF',
          theme_color: '#E30613',
          icons: [
            {
              src: '/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: '/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ]
        }));
        return;
      }

      if (req.url === '/icon-192.svg' || req.url === '/icon-512.svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="100" fill="#E30613"/><text x="256" y="200" font-family="sans-serif" font-weight="900" font-size="64" fill="#FFFFFF" text-anchor="middle">BONPREU</text><text x="256" y="270" font-family="sans-serif" font-weight="900" font-size="52" fill="#FCD34D" text-anchor="middle">ESCLAT</text><rect x="90" y="330" width="332" height="70" rx="20" fill="#FFFFFF"/><text x="256" y="378" font-family="sans-serif" font-weight="bold" font-size="30" fill="#E30613" text-anchor="middle">AITOR &amp; XÈNIA</text></svg>`);
        return;
      }

      next();
    });
  }
});

export default defineConfig(({command}) => {
  const base = command === 'serve' ? '/' : getBasePath();
  return {
    base,
    plugins: [react(), tailwindcss(), pwaPlugin(), ghPages404Plugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
