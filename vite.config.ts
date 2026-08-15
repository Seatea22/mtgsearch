import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  server: {
    cors: true,
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 5173
    }
  },
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'TCGplayer Buyer Assistant',
        namespace: 'http://tampermonkey.net/',
        version: '2026-08-14',
        description: 'Search and auto-add cards to cart based on price/condition rules',
        author: 'Seatea22',
        match: ['https://www.tcgplayer.com/sellers/*/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=tcgplayer.com',
        grant: [],
      },
      build: {
        fileName: 'tcgplayer-buyer-assistant.user.js',
        autoGrant: true,
      },
    }),
    {
      name: 'add-private-network-header',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Access-Control-Allow-Private-Network', 'true');
          next();
        });
      }
    }
  ],
});
