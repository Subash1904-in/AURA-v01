import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ragQuery, RagIndexMissingError } from './ragService.ts';
import { QueryIntent } from '../src/services/intentService.ts';

const DEFAULT_PORT = Number(process.env.RAG_SERVER_PORT ?? 8789);

interface RagRequestParams {
  query: string;
  intent?: QueryIntent;
  k?: number;
}

function parseIntent(value?: string | null): QueryIntent {
  if (!value) return QueryIntent.GENERAL;
  return (Object.values(QueryIntent) as string[]).includes(value) ? (value as QueryIntent) : QueryIntent.GENERAL;
}

function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function handleRagRequest(params: RagRequestParams) {
  if (!params.query?.trim()) {
    throw new Error('Query text is required');
  }
  const intent = parseIntent(params.intent ?? QueryIntent.GENERAL);
  const topK = Number.isFinite(params.k) && params.k ? Number(params.k) : 5;
  return ragQuery(params.query, intent, topK);
}

export function startRagServer(port = DEFAULT_PORT) {
  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      sendJson(res, 400, { error: 'Malformed request' });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    if (url.pathname !== '/rag') {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    try {
      if (req.method === 'GET') {
        const query = url.searchParams.get('q') ?? '';
        const intent = url.searchParams.get('intent') as QueryIntent | null;
        const kParam = url.searchParams.get('k');
        const response = await handleRagRequest({ query, intent: intent ?? undefined, k: kParam ? Number(kParam) : undefined });
        sendJson(res, 200, response);
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body ?? '{}');
            const response = await handleRagRequest(payload as RagRequestParams);
            sendJson(res, 200, response);
          } catch (error) {
            console.error('[ragServer] Failed to process POST /rag payload', error);
            sendJson(res, 400, { error: 'Invalid JSON payload' });
          }
        });
        return;
      }

      sendJson(res, 405, { error: 'Method not allowed' });
    } catch (error) {
      if (error instanceof RagIndexMissingError) {
        sendJson(res, 503, { error: 'RAG index not built yet' });
        return;
      }
      console.error('[ragServer] Unexpected error', error);
      sendJson(res, 500, { error: 'Internal server error' });
    }
  });

  server.listen(port, () => {
    console.log(`[ragServer] Listening on http://localhost:${port}`);
  });

  return server;
}

const entryPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === entryPath) {
  startRagServer();
}
