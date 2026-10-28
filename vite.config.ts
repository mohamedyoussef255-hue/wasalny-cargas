import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function scadaWebhookPlugin(): Plugin {
  return {
    name: 'scada-webhook-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/scada/complete-transaction' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              
              if (!payload.api_key || !payload.station_id || !payload.hose_id || !payload.volume_m3) {
                res.statusCode = 400;
                res.end(JSON.stringify({
                  success: false,
                  error: 'MISSING_FIELDS',
                  message: 'Missing required fields: api_key, station_id, hose_id, volume_m3, transaction_id'
                }));
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: 'SCADA webhook received successfully by Cargas endpoint',
                received: {
                  station_id: payload.station_id,
                  hose_id: payload.hose_id,
                  volume_m3: payload.volume_m3,
                  transaction_id: payload.transaction_id,
                  timestamp: new Date().toISOString()
                }
              }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Failed to parse JSON body' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), scadaWebhookPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

