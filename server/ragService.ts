// d:/AURA v01/server/ragService.ts
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { QueryIntent, intentToSection } from '../src/services/intentService.ts';

const VECTOR_SERVER_URL = process.env.VECTOR_SERVER_URL ?? 'http://localhost:8001';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SNIPPET_DB_PATH = path.join(DATA_DIR, 'snippets.db');

export interface SnippetResult {
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
}

export type EnrichedSnippet = SnippetResult & { fullText: string };

export interface RagResponse {
  results: EnrichedSnippet[];
  formattedContext: string;
}

export class RagIndexMissingError extends Error {
  constructor() {
    super('RAG_INDEX_MISSING');
    this.name = 'RagIndexMissingError';
  }
}

let sqlite: Database.Database | null = null;

function ensureDatabase(): Database.Database {
  if (sqlite) return sqlite;
  if (!fs.existsSync(SNIPPET_DB_PATH)) throw new RagIndexMissingError();
  sqlite = new Database(SNIPPET_DB_PATH, { readonly: true });
  return sqlite;
}

/* -------------------------------------------------
   Helper: format AI context
   ------------------------------------------------- */
function formatContextForAI(results: SnippetResult[]): string {
  return results
    .map(
      (result, index) =>
        `[[snippet-${index + 1}]]\nTitle: ${result.title ?? 'Untitled'}\nSection: ${result.section}\nSummary: ${result.shortSummary}\nSource: ${result.sourcePath}\n`
    )
    .join('\n');
}

/* -------------------------------------------------
   Retrieve snippets – with optional section filter
   ------------------------------------------------- */
async function retrieveContext(query: string, intent?: QueryIntent, k = 5): Promise<SnippetResult[]> {
  const section = intent ? intentToSection(intent) : undefined;
  const url = new URL(`${VECTOR_SERVER_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('k', String(k));
  if (section) url.searchParams.set('section', section);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Vector server error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

/* -------------------------------------------------
   Retrieve with DB‑based ID filter (used when we have a section)
   ------------------------------------------------- */
async function retrieveWithFilters(
  query: string,
  filters: { section?: string; tags?: string[] },
  k = 5
): Promise<SnippetResult[]> {
  const ids = filterSnippetIds(filters);
  if (!ids.length) return [];
  const url = `${VECTOR_SERVER_URL}/search?q=${encodeURIComponent(query)}&k=${k}&ids=${ids.join(',')}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Vector server error: ${response.status}`);
  const data = await response.json();
  return data.results;
}

/* -------------------------------------------------
   DB helper – return IDs matching filters
   ------------------------------------------------- */
function filterSnippetIds(filters: { section?: string; tags?: string[] }): string[] {
  const db = ensureDatabase();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.section) {
    conditions.push('section = @section');
    params.section = filters.section;
  }
  if (filters.tags?.length) {
    conditions.push(filters.tags.map((tag, i) => `tags LIKE @tag${i}`).join(' OR '));
    filters.tags.forEach((tag, i) => (params[`tag${i}`] = `%${tag}%`));
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT id FROM snippets ${where}`);
  const rows = stmt.all(params) as { id: string }[];
  return rows.map(r => r.id);
}

/* -------------------------------------------------
   Load full text from the snippet file
   ------------------------------------------------- */
async function loadFullText(snippetId: string, fullTextPath: string): Promise<string> {
  try {
    return await fs.promises.readFile(fullTextPath, 'utf8');
  } catch (e) {
    console.warn(`[ragService] Failed to read snippet ${snippetId} from ${fullTextPath}`, e);
    return '';
  }
}

/* -------------------------------------------------
   Public API – ragQuery
   ------------------------------------------------- */
export async function ragQuery(query: string, intent = QueryIntent.GENERAL, k = 5): Promise<RagResponse> {
  const section = intentToSection(intent);
  const filters = section ? { section } : {};

  // -----------------------------------------------------------------
  // Retrieve raw results (with DB filter if we have a section)
  // -----------------------------------------------------------------
  const baseResults = section
    ? await retrieveWithFilters(query, filters, k)
    : await retrieveContext(query, intent, k);

  // Debug logging
  console.log('[ragService] Section:', section);
  console.log('[ragService] Retrieved', baseResults.length, 'raw results');

  // Safety filter – ensure we only keep snippets that actually belong to the requested section
  const filtered = section ? baseResults.filter(r => r.section === section) : baseResults;

  // -----------------------------------------------------------------
  // Enrich with full text
  // -----------------------------------------------------------------
  const enriched = await Promise.all(
    filtered.slice(0, 3).map(async r => {
      const fullText = await loadFullText(r.id, r.fullTextPath);
      return { ...r, fullText } satisfies EnrichedSnippet;
    })
  );

  const formattedContext = formatContextForAI(filtered);
  return { results: enriched, formattedContext };
}

/* -------------------------------------------------
   Utility – reset DB (dev only)
   ------------------------------------------------- */
export function resetRagDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
}