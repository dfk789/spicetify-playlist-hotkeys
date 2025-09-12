#!/usr/bin/env node
/**
 * Global Hotkey Helper for Spicetify Playlist Hotkeys (Node, no Express)
 * - HTTP server using built-in 'http'
 * - SSE for events (/events)
 * - Auth via /hello token; /events accepts ?token= for EventSource
 * - Global key capture via 'uiohook-napi' if installed
 */

const http = require('http');
const crypto = require('crypto');
const url = require('url');

const os = require('os');
const cp = require('child_process');
const path = require('path');
let hookProc = null;

const PORT = 17976;
const token = crypto.randomBytes(16).toString('hex');
let combos = new Set();
const clients = new Set();

console.log('?? Global Hotkey Helper (Node, no Express)');
console.log('?? Auth token:', token);

function writeJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

// HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method || 'GET';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (path === '/hello' && method === 'GET') {
    return writeJson(res, 200, { ok: true, token });
  }

  // Auth for all but /hello
  if (path !== '/hello') {
    const authHeader = req.headers.authorization;
    const authOk = authHeader === `Bearer ${token}`;
    const tokenOk = path === '/events' && parsedUrl.query && parsedUrl.query.token === token; // EventSource fallback
    if (!authOk && !tokenOk) {
      return writeJson(res, 401, { error: 'unauthorized' });
    }
  }

  // Update combos
  if (path === '/config' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const list = Array.isArray(data.combos) ? data.combos : [];
        combos = new Set(list.map((s) => String(s).trim().toUpperCase()));
        console.log(`Updated combos: ${Array.from(combos).join(', ')}`);
        restartHook(Array.from(combos));
        writeJson(res, 200, { ok: true, count: combos.size });
      } catch (e) {
        writeJson(res, 400, { error: 'invalid json' });
      }
    });
    return;
  }

  // SSE events
  if (path === '/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify({ ready: true })}\n\n`);
    clients.add(res);
    console.log(`Client connected. Total clients: ${clients.size}`);
    req.on('close', () => {
      clients.delete(res);
      console.log(`Client disconnected. Total clients: ${clients.size}`);
    });
    return;
  }

  // Manual trigger for testing
  if (path === '/trigger' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const combo = String(data.combo || '').toUpperCase();
        if (combos.has(combo)) {
          broadcast(combo);
          writeJson(res, 200, { ok: true });
        } else {
          writeJson(res, 400, { error: 'combo not registered' });
        }
      } catch (_e) {
        writeJson(res, 400, { error: 'invalid json' });
      }
    });
    return;
  }

  writeJson(res, 404, { error: 'not found' });
});

function broadcast(combo) {
  const msg = `data: ${JSON.stringify({ combo })}\n\n`;
  for (const client of Array.from(clients)) {
    try {
      client.write(msg);
    } catch {
      clients.delete(client);
    }
  }
  console.log(`Broadcasted: ${combo}`);
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`?? HTTP server listening on http://127.0.0.1:${PORT}`);
  console.log('? Ready to receive combo configurations from Spicetify extension');
});
console.log('?? Tip: Test the server by opening http://127.0.0.1:17976/hello');
console.log('?? Press Ctrl+C to stop the server');

function restartHook(list) {
  if (hookProc) {
    try { hookProc.kill(); } catch (_) {}
    hookProc = null;
  }
  if (!Array.isArray(list) || !list.length) return;
  if (process.platform !== 'win32') {
    console.log('No hotkey hook available on this OS without native deps.');
    return;
  }
  const ps = process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe') : 'powershell.exe';
  const script = path.join(__dirname, 'hook.ps1');
  const arg = list.join(',');
  console.log('Starting PowerShell hotkey hook with combos:', arg);
  hookProc = cp.spawn(ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Combos', arg], { stdio: ['ignore', 'pipe', 'inherit'] });
  let buf = '';
  hookProc.stdout.on('data', (d) => {
    buf += d.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.ready) {
          console.log('Hook ready');
        } else if (obj.combo) {
          const combo = String(obj.combo);
          console.log('Hook combo:', combo);
          broadcast(combo);
        }
      } catch (_) {
        // ignore
      }
    }
  });
  hookProc.on('exit', (code) => { console.log('Hook exited', code); });
}

process.on('SIGINT', () => { try { hookProc && hookProc.kill(); } catch (_) {} process.exit(0); });
process.on('SIGTERM', () => { try { hookProc && hookProc.kill(); } catch (_) {} process.exit(0); });
