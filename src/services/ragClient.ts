import { QueryIntent } from './intentService';

export interface RagSnippet {
  id: string;
  score: number;
  section: string;
  title?: string;
  shortSummary?: string;
  fullTextPath: string;
  updatedAt: string;
  sourcePath: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  fullText?: string;
}

export interface RagClientResponse {
  results: RagSnippet[];
  formattedContext?: string;
}

export class RagClientError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'RagClientError';
  }
}

function resolveRagEndpoint(): string {
  const configured = import.meta.env.VITE_RAG_API_URL ?? '/api/rag';
  if (/^https?:/i.test(configured)) {
    return configured;
  }
  if (typeof window !== 'undefined' && window.location) {
    return new URL(configured, window.location.origin).toString();
  }
  return new URL(configured, 'http://localhost').toString();
}

const DEFAULT_RAG_API = resolveRagEndpoint();

export async function fetchRagContext(query: string, intent: QueryIntent, k = 5): Promise<RagClientResponse> {
  const url = new URL(DEFAULT_RAG_API);
  url.searchParams.set('q', query);
  url.searchParams.set('intent', intent);
  url.searchParams.set('k', String(k));

  // Use AbortController to allow cancellation by callers
  const controller = new AbortController();
  const signal = controller.signal;

  console.log(`🌐 RAG Request: ${url.toString()}`);

  const responsePromise = fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  // Attach a small timeout to avoid long-hanging requests
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await responsePromise;
  } finally {
    clearTimeout(timeout);
  }

  console.log(`📡 RAG Response Status: ${response.status}`);

  if (!response.ok) {
    let message = `RAG request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    console.error(`❌ RAG Error: ${message}`);
    throw new RagClientError(message, response.status);
  }

  const data = (await response.json()) as RagClientResponse;
  console.log(`📦 RAG Results: ${data.results?.length || 0} snippets`);
  if (data.results && data.results.length > 0) {
    console.log(`   Top result: "${data.results[0].title}" (score: ${data.results[0].score})`);
  }

  return data;
}
