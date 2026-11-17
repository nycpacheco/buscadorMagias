import { spawn } from 'child_process';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--port' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    if (args[i].startsWith('--port=')) {
      const parsed = Number(args[i].split('=')[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    return Number(process.env.DEFAULT_APP_PORT) || 3000;
  }
  return Number(process.env.PORT) || 3000;
}

function resolveHost() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--host' && args[i + 1]) {
      return args[i + 1];
    }
    if (args[i].startsWith('--host=')) {
      return args[i].split('=')[1];
    }
  }
  return '0.0.0.0';
}

const PORT = resolvePort();
const HOST = resolveHost();
const PYTHON_BACKEND_HOST = process.env.PYTHON_BACKEND_HOST || '127.0.0.1';
const PYTHON_BACKEND_PORT = Number(process.env.PYTHON_BACKEND_PORT || 5000);
const PYTHON_CMD = process.env.PYTHON_BIN || 'python3';

async function isPythonBackendHealthy() {
  try {
    const res = await fetch(
      `http://${PYTHON_BACKEND_HOST}:${PYTHON_BACKEND_PORT}/api/health`
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function ensurePythonBackend() {
  if (await isPythonBackendHealthy()) {
    console.log(
      `Backend Python já ativo em http://${PYTHON_BACKEND_HOST}:${PYTHON_BACKEND_PORT}`
    );
    return null;
  }

  const pyProc = spawn(PYTHON_CMD, ['app.py'], {
    cwd: __dirname,
    env: {
      ...process.env,
      BACKEND_HOST: PYTHON_BACKEND_HOST,
      BACKEND_PORT: String(PYTHON_BACKEND_PORT),
      PYTHONUNBUFFERED: '1',
    },
    stdio: 'inherit',
  });

  pyProc.on('error', (err) => {
    console.error('Falha ao iniciar o backend Python Flask:', err);
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isPythonBackendHealthy()) {
      console.log(
        `Backend Python Flask pronto em http://${PYTHON_BACKEND_HOST}:${PYTHON_BACKEND_PORT}`
      );
      return pyProc;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.warn(
    'Backend Python Flask demorou para responder ao /api/health; requisições /api continuarão sendo encaminhadas.'
  );
  return pyProc;
}

function proxyApiToPython(req, res) {
  const targetUrl = req.originalUrl;
  const proxyReq = http.request(
    {
      hostname: PYTHON_BACKEND_HOST,
      port: PYTHON_BACKEND_PORT,
      path: targetUrl,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${PYTHON_BACKEND_HOST}:${PYTHON_BACKEND_PORT}`,
      },
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 502);
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined && key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (error) => {
    console.error('Erro ao encaminhar requisição para o backend Python:', error);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Não foi possível conectar ao backend Python Flask.',
        details: error.message,
      });
    }
  });

  req.pipe(proxyReq);
}

async function startServer() {
  const pyProc = await ensurePythonBackend();

  const cleanup = () => {
    if (pyProc && !pyProc.killed) {
      pyProc.kill('SIGTERM');
    }
  };
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  const app = express();
  app.use('/api', proxyApiToPython);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Frontend + Proxy ativo em http://${displayHost}:${PORT}`);
  });
}

startServer();
