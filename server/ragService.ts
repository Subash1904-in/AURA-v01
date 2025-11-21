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
  if (sqlite) {
    return sqlite;
  }

  if (!fs.existsSync(SNIPPET_DB_PATH)) {
    throw new RagIndexMissingError();
  }

  sqlite = new Database(SNIPPET_DB_PATH, { readonly: true });
  return sqlite;
}

function formatContextForAI(results: SnippetResult[]): string {
  return results
    .map(
      (result, index) =>
        `[[snippet-${index + 1}]]\nTitle: ${result.title ?? 'Untitled'}\nSection: ${result.section}\nSummary: ${result.shortSummary}\nSource: ${result.sourcePath}\n`,
    )
    .join('\n');
}

async function retrieveContext(query: string, k = 5): Promise<SnippetResult[]> {
  const response = await fetch(`${VECTOR_SERVER_URL}/search?q=${encodeURIComponent(query)}&k=${k}`);
  if (!response.ok) {
    throw new Error(`Vector server error: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}

async function retrieveWithFilters(
  query: string,
  filters: { section?: string; tags?: string[] },
  k = 5,
): Promise<SnippetResult[]> {
  const ids = filterSnippetIds(filters);
  if (!ids.length) {
    return [];
  }
  const url = `${VECTOR_SERVER_URL}/search?q=${encodeURIComponent(query)}&k=${k}&ids=${ids.join(',')}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Vector server error: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}

function filterSnippetIds(filters: { section?: string; tags?: string[] }): string[] {
  const db = ensureDatabase();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.section) {
    conditions.push('section = @section');
    params.section = filters.section;
  }
  if (filters.tags?.length) {
    conditions.push(filters.tags.map((tag, idx) => `tags LIKE @tag${idx}`).join(' OR '));
    filters.tags.forEach((tag, idx) => {
      params[`tag${idx}`] = `%${tag}%`;
    });
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT id FROM snippets ${whereClause}`;
  const stmt = db.prepare(query);
  const rows = stmt.all(params) as { id: string }[];
  return rows.map((row) => row.id);
}

async function loadFullText(snippetId: string, fullTextPath: string): Promise<string> {
  try {
    return await fs.promises.readFile(fullTextPath, 'utf8');
  } catch (error) {
    console.warn(`[ragService] Failed to read snippet ${snippetId} from ${fullTextPath}`, error);
    return '';
  }
}

export async function ragQuery(query: string, intent = QueryIntent.GENERAL, k = 5): Promise<RagResponse> {
  const section = intentToSection(intent);
  const filters = section ? { section } : {};
  const baseResults = section ? await retrieveWithFilters(query, filters, k) : await retrieveContext(query, k);

  const enriched = await Promise.all(
    baseResults.slice(0, 3).map(async (result) => {
      const fullText = await loadFullText(result.id, result.fullTextPath);
      return { ...result, fullText } satisfies EnrichedSnippet;
    }),
  );

  const formattedContext = formatContextForAI(baseResults);
  return { results: enriched, formattedContext };
}

export function resetRagDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
}
