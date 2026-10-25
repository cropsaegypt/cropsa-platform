import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function emailApiPlugin() {
  return {
    name: 'email-api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-email', async (req: any, res: any) => {
        if (req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              req.body = bodyStr ? JSON.parse(bodyStr) : {};
              let handler: any;
              try {
                const mod = await server.ssrLoadModule('./api/send-email.ts');
                handler = mod.default || mod;
              } catch (ssrErr) {
                const mod = await import('./api/send-email.ts');
                handler = mod.default || mod;
              }
              await handler(req, res);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err?.message || 'Server error' }));
            }
          });
        } else {
          res.statusCode = 200;
          res.end();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), emailApiPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
