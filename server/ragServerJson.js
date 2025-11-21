import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SNIPPETS_JSON = path.join(DATA_DIR, 'snippets.json');
const VECTOR_SERVER_URL = process.env.VECTOR_SERVER_URL ?? 'http://127.0.0.1:8001';
const DEFAULT_PORT = Number(process.env.RAG_SERVER_PORT ?? 8789);

const INTENT_SECTION_MAP = {
  ADMISSIONS: 'admissions',
  PLACEMENT: 'placements',
  SPORTS: 'sports',
  HOSTEL: 'hostel',
  CULTURAL: 'cultural',
  LEADERSHIP: 'leadership',
  DEPARTMENT: 'departments',
};

function intentToSection(intent) {
  if (!intent) return undefined;
  const key = intent.toUpperCase();
  return INTENT_SECTION_MAP[key];
}

async function loadMeta() {
  const raw = await fs.readFile(SNIPPETS_JSON, 'utf8');
  return JSON.parse(raw);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function formatContextForAI(results) {
  return results
    .map((result, index) =>
      `[[snippet-${index + 1}]]\nTitle: ${result.title ?? 'Untitled'}\nSection: ${result.section}\nSummary: ${result.shortSummary}\nSource: ${result.sourcePath}\n`,
    )
    .join('\n');
}

async function queryVector(q, k = 5, ids) {
  const params = new URLSearchParams();
  params.set('q', q);
  params.set('k', String(k));
  if (ids && ids.length) params.set('ids', ids.join(','));
  const url = `${VECTOR_SERVER_URL}/search?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Vector server responded ${resp.status}`);
  return resp.json();
}

async function handleRagRequest(params) {
  const q = (params.query || '').trim();
  if (!q) throw new Error('Query text is required');
  const k = params.k ? Number(params.k) : 5;
  const section = intentToSection(params.intent);

  const meta = await loadMeta();

  let ids = [];
  if (section) {
    ids = meta.filter((m) => m.section === section).map((m) => m.id);
    if (!ids.length) return { results: [], formattedContext: '' };
  }

  const vec = await queryVector(q, k, ids.length ? ids : undefined);
  const results = [];
  for (const r of vec.results) {
    const m = meta.find((m) => m.id === r.id) || {};
    let fullText = '';
    try {
      fullText = await fs.readFile(m.fullTextPath, 'utf8');
    } catch (e) {
      // ignore
    }
    results.push({ ...r, fullText });
  }

  const formattedContext = formatContextForAI(vec.results);
  return { results, formattedContext };
}

export function startRagServer(port = DEFAULT_PORT) {
  const server = http.createServer(async (req, res) => {
    if (!req.url) return sendJson(res, 400, { error: 'Malformed request' });
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { status: 'ok' });
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (url.pathname !== '/rag') return sendJson(res, 404, { error: 'Not found' });

    try {
      if (req.method === 'GET') {
        const query = url.searchParams.get('q') ?? '';
        const intent = url.searchParams.get('intent') ?? undefined;
        const kParam = url.searchParams.get('k');
        const response = await handleRagRequest({ query, intent, k: kParam ? Number(kParam) : undefined });
        return sendJson(res, 200, response);
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const response = await handleRagRequest(payload);
            sendJson(res, 200, response);
          } catch (err) {
            console.error('[ragServerJson] invalid payload', err);
            sendJson(res, 400, { error: 'Invalid JSON payload' });
          }
        });
        return;
      }

      return sendJson(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      console.error('[ragServerJson] Unexpected error', error);
      return sendJson(res, 500, { error: String(error) });
    }
  });

  server.listen(port, () => {
    console.log(`[ragServerJson] Listening on http://localhost:${port}`);
  });

  return server;
}

if (process.argv[1] && process.argv[1].endsWith('ragServerJson.js')) {
  startRagServer();
}
