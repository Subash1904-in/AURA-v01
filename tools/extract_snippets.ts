#!/usr/bin/env node
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import AdmZip from 'adm-zip';
import { htmlToText } from 'html-to-text';
import { collegeDatabase } from '../src/data/collegeData';
import type { CollegeInfo } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BLOBS_DIR = path.join(DATA_DIR, 'blobs');
const MEDIA_DIR = path.join(BLOBS_DIR, 'media');
const TTS_DIR = path.join(BLOBS_DIR, 'tts');
const SNIPPETS_JSON = path.join(DATA_DIR, 'snippets.json');
const SQLITE_PATH = path.join(DATA_DIR, 'snippets.db');
const INCOMING_DIR = path.join(ROOT_DIR, 'incoming');

const ALLOWED_SECTIONS = new Set<AllowedSection>([
  'leadership',
  'departments',
  'placements',
  'sports',
  'hostel',
  'cultural',
  'admissions',
  'about',
  'incoming',
  'media',
]);

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.markdown',
  '.html',
  '.htm',
  '.json',
  '.docx',
  '.odt',
  '.pdf',
]);

const MEDIA_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.mp3',
  '.wav',
  '.ogg',
]);

type AllowedSection =
  | 'leadership'
  | 'departments'
  | 'placements'
  | 'sports'
  | 'hostel'
  | 'cultural'
  | 'admissions'
  | 'about'
  | 'incoming'
  | 'media';

interface Snippet {
  id: string;
  section: AllowedSection;
  title: string;
  shortSummary: string;
  fullTextPath: string;
  updatedAt: string;
  sourcePath: string;
  aliases?: string[];
  tags?: string[];
  contact?: Record<string, unknown>;
  coords?: Record<string, unknown>;
  blobType?: 'text' | 'media';
  metadata?: Record<string, unknown>;
}

interface SnippetOptions {
  aliases?: string[];
  tags?: string[];
  contact?: Record<string, unknown>;
  coords?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  blobType?: 'text' | 'media';
  updatedAt?: string;
  sourcePath: string;
}

const runSeed = Date.now().toString(36);
let sequence = 0;

function nextId(section: AllowedSection) {
  sequence += 1;
  return `${section}-${runSeed}-${sequence}`;
}

const logger = new console.Console(process.stdout, process.stderr);
const log = (message: string) => logger.log(`[extract] ${message}`);
const warn = (message: string) => logger.warn(`[extract:warn] ${message}`);

async function main() {
  await ensureDirectories();
  log('Starting snippet extraction…');
  const collegeSnippets = await buildCollegeSnippets(collegeDatabase);
  const incomingSnippets = await buildIncomingSnippets();
  const snippets = [...collegeSnippets, ...incomingSnippets];
  await persistJson(snippets);
  persistSqlite(snippets);
  log(`Extraction complete. Generated ${snippets.length} snippets.`);
}

async function ensureDirectories() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(BLOBS_DIR, { recursive: true });
  await fsp.mkdir(MEDIA_DIR, { recursive: true });
  await fsp.mkdir(TTS_DIR, { recursive: true });
}

function summarize(text: string, words = 60) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const parts = clean.split(' ');
  if (parts.length <= words) return clean;
  return parts.slice(0, words).join(' ') + '…';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function createSnippetFromText(
  section: AllowedSection,
  title: string,
  text: string,
  options: SnippetOptions,
): Promise<Snippet> {
  if (!ALLOWED_SECTIONS.has(section)) {
    throw new Error(`Unsupported section ${section}`);
  }
  const cleaned = text.trim();
  const id = nextId(section);
  const blobPath = path.join(BLOBS_DIR, `${id}.txt`);
  await fsp.writeFile(blobPath, cleaned + (cleaned.endsWith('\n') ? '' : '\n'), 'utf8');
  return {
    id,
    section,
    title,
    shortSummary: summarize(cleaned),
    fullTextPath: blobPath,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    sourcePath: options.sourcePath,
    aliases: options.aliases?.length ? options.aliases : undefined,
    tags: options.tags?.length ? options.tags : undefined,
    contact: options.contact,
    coords: options.coords,
    blobType: options.blobType ?? 'text',
    metadata: options.metadata,
  };
}

async function buildCollegeSnippets(data: CollegeInfo): Promise<Snippet[]> {
  const snippets: Snippet[] = [];
  const updatedAt = new Date().toISOString();

  const push = async (
    section: AllowedSection,
    title: string,
    text: string,
    options: Omit<SnippetOptions, 'sourcePath'> & { sourcePath: string },
  ) => {
    const snippet = await createSnippetFromText(section, title, text, {
      ...options,
      updatedAt,
    });
    snippets.push(snippet);
  };

  await push(
    'about',
    'About KSSEM',
    `${data.about.description}\n\nMission: ${data.about.mission}\nVision: ${data.about.vision}`,
    {
      sourcePath: 'src/data/collegeData.ts#about',
      aliases: data.about.keywords,
      tags: ['overview', 'history'],
    },
  );

  await push(
    'admissions',
    'Admissions Overview',
    `${data.admissions.process}\n\nEligibility:\n${data.admissions.eligibility}`,
    {
      sourcePath: 'src/data/collegeData.ts#admissions',
      aliases: data.admissions.keywords,
      tags: ['admissions', 'process'],
    },
  );

  await push(
    'placements',
    'Placement Cell Snapshot',
    `${data.placements.description}\n\nTop Recruiters: ${data.placements.recruiters.join(', ')}`,
    {
      sourcePath: 'src/data/collegeData.ts#placements',
      aliases: data.placements.keywords,
      metadata: { batchStatistics: data.placements.batchStatistics },
      tags: ['placements', 'career'],
    },
  );

  if (data.sports) {
    await push(
      'sports',
      'Sports & Physical Education',
      `${data.sports.description}\n\nFacilities:\n${data.sports.facilities.join('\n')}\n\nAchievements:\n${data.sports.achievements.join('\n')}`,
      {
        sourcePath: 'src/data/collegeData.ts#sports',
        tags: ['sports', 'activities'],
        contact: data.sports.director?.contact,
        metadata: { director: data.sports.director?.name },
        aliases: data.sports.keywords,
      },
    );
  }

  if (data.cultural) {
    await push(
      'cultural',
      'Cultural Activities',
      `${data.cultural.description}\n\nEvents: ${data.cultural.events.join(', ')}\nClubs: ${data.cultural.clubs.join(', ')}`,
      {
        sourcePath: 'src/data/collegeData.ts#cultural',
        tags: ['culture', 'events'],
        aliases: data.cultural.keywords,
      },
    );
  }

  if (data.hostel) {
    await push(
      'hostel',
      'Hostel Facilities',
      `${data.hostel.description}\n\nFacilities:\n${(data.hostel.facilities ?? []).join('\n')}`,
      {
        sourcePath: 'src/data/collegeData.ts#hostel',
        tags: ['hostel', 'accommodation'],
        metadata: { capacity: data.hostel.capacity },
      },
    );
  }

  if (data.leadership?.principal) {
    const principal = data.leadership.principal;
    await push(
      'leadership',
      'Principal Message',
      `${principal.name} (${principal.title ?? ''})\n\n${principal.message ?? ''}\n\nFocus Areas: ${(principal.focusAreas ?? []).join(', ')}`,
      {
        sourcePath: 'src/data/collegeData.ts#leadership.principal',
        contact: principal.contact,
        tags: ['leadership', 'principal'],
      },
    );
  }

  if (data.leadership?.managingCommittee) {
    const officers = data.leadership.managingCommittee.officers ?? [];
    const members = data.leadership.managingCommittee.members ?? [];

    const keyTitles = ['Hon. President', 'Hon. Secretary', 'Hon. Treasurer'];
    const keyOfficers = officers.filter(o => keyTitles.some(t => o.title.includes(t)));
    const seatedMembers = officers.filter(o => !keyTitles.some(t => o.title.includes(t)));

    const text = [
      'Managing Committee',
      '',
      'Key Officers:',
      ...keyOfficers.map(o => `• ${o.title}: ${o.name}`),
      '',
      'Other Members (Seated):',
      ...seatedMembers.map(o => `• ${o.name} (${o.title})`),
      '',
      'Committee Chairmen & Directors (Standing):',
      ...members.map(m => `• ${m}`)
    ].join('\n');

    await push(
      'leadership',
      'Managing Committee',
      text,
      {
        sourcePath: 'src/data/collegeData.ts#leadership.managingCommittee',
        tags: ['leadership', 'committee', 'management', 'trustees'],
      },
    );
  }

  for (const [key, dept] of Object.entries(data.departments)) {
    const textChunks = [dept.description];
    if (dept.head) {
      textChunks.push(
        `Head: ${dept.head.name} (${dept.head.designation}) ${dept.head.message ?? ''}`,
      );
    }
    if (dept.faculty?.length) {
      textChunks.push(`Faculty: ${dept.faculty.map((f) => `${f.name} (${f.designation})`).join(', ')}`);
    }
    if (dept.highlights?.length) {
      textChunks.push(`Highlights: ${dept.highlights.join('; ')}`);
    }
    if (dept.achievements?.length) {
      textChunks.push(`Achievements: ${dept.achievements.join('; ')}`);
    }
    if (dept.placements?.description) {
      textChunks.push(`Placements: ${dept.placements.description}`);
    }
    await push(
      'departments',
      dept.name,
      textChunks.join('\n\n'),
      {
        sourcePath: `src/data/collegeData.ts#departments.${key}`,
        aliases: dept.identifiers,
        tags: dept.keywords,
        metadata: {
          labs: dept.labs,
          programs: dept.programs,
          statistics: dept.statistics,
          mos: dept.mous,
        },
      },
    );
  }

  return snippets;
}

async function buildIncomingSnippets(): Promise<Snippet[]> {
  const snippets: Snippet[] = [];
  if (!fs.existsSync(INCOMING_DIR)) {
    warn('incoming/ directory does not exist – skipping external content.');
    return snippets;
  }

  const files = await walkFiles(INCOMING_DIR);
  if (!files.length) {
    log('No incoming files detected.');
    return snippets;
  }

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const relativeSource = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');

    if (MEDIA_EXTENSIONS.has(ext)) {
      const snippet = await createMediaSnippet(filePath, relativeSource);
      snippets.push(snippet);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(ext)) {
      warn(`Skipping unsupported file type: ${relativeSource}`);
      continue;
    }

    const raw = await readTextFromFile(filePath, ext);
    if (!raw?.trim()) {
      warn(`Empty or unreadable file: ${relativeSource}`);
      continue;
    }

    const chunks = chunkText(raw, 200, 400);
    const baseTitle = path.basename(filePath, ext);
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const title = chunks.length > 1 ? `${baseTitle} (Part ${i + 1})` : baseTitle;
      const snippet = await createSnippetFromText('incoming', title, chunk, {
        sourcePath: relativeSource,
        tags: ['incoming', 'document'],
        metadata: {
          chunkIndex: i,
          chunkCount: chunks.length,
          fileName: path.basename(filePath),
        },
      });
      snippets.push(snippet);
    }
  }

  return snippets;
}

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function readTextFromFile(filePath: string, ext: string) {
  try {
    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return value;
    }
    if (ext === '.odt') {
      const zip = new AdmZip(filePath);
      const content = zip.readAsText('content.xml');
      return stripXml(content);
    }
    if (ext === '.pdf') {
      const buffer = await fsp.readFile(filePath);
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }
    if (ext === '.html' || ext === '.htm') {
      const html = await fsp.readFile(filePath, 'utf8');
      return htmlToText(html, { wordwrap: false });
    }
    const buffer = await fsp.readFile(filePath, 'utf8');
    return buffer;
  } catch (error) {
    warn(`Failed to read ${filePath}: ${(error as Error).message}`);
    return '';
  }
}

function stripXml(content: string) {
  return content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function chunkText(text: string, minWords: number, maxWords: number) {
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let wordCount = 0;
  const pushChunk = () => {
    if (current.length) {
      chunks.push(current.join('\n\n'));
      current = [];
      wordCount = 0;
    }
  };

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (wordCount + words.length > maxWords && wordCount >= minWords) {
      pushChunk();
    }
    current.push(paragraph);
    wordCount += words.length;
    if (wordCount >= maxWords) {
      pushChunk();
    }
  }
  if (current.length) {
    pushChunk();
  }
  if (!chunks.length) {
    chunks.push(text.trim());
  }
  return chunks;
}

async function createMediaSnippet(filePath: string, relativeSource: string) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fsp.readFile(filePath);
  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
  const safeName = slugify(path.basename(filePath, ext)) || 'asset';
  const destName = `${safeName}-${hash}${ext}`;
  const destPath = path.join(MEDIA_DIR, destName);
  await fsp.writeFile(destPath, buffer);
  const description = `Media asset copied from ${relativeSource} and stored at ${destPath}.`;
  return createSnippetFromText('media', path.basename(filePath), description, {
    sourcePath: relativeSource,
    blobType: 'media',
    metadata: {
      mediaPath: destPath,
      mimeType: mimeFromExtension(ext),
    },
    tags: ['media'],
  });
}

function mimeFromExtension(ext: string) {
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

async function persistJson(snippets: Snippet[]) {
  await fsp.writeFile(SNIPPETS_JSON, JSON.stringify(snippets, null, 2));
  log(`Wrote ${SNIPPETS_JSON}`);
}

function persistSqlite(snippets: Snippet[]) {
  const db = new Database(SQLITE_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(
    `CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      shortSummary TEXT,
      fullTextPath TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      sourcePath TEXT NOT NULL,
      aliases TEXT,
      tags TEXT,
      contact TEXT,
      coords TEXT,
      blobType TEXT,
      metadata TEXT
    );`
  );
  db.exec('DELETE FROM snippets;');
  const insert = db.prepare(
    `INSERT INTO snippets (id, section, title, shortSummary, fullTextPath, updatedAt, sourcePath, aliases, tags, contact, coords, blobType, metadata)
     VALUES (@id, @section, @title, @shortSummary, @fullTextPath, @updatedAt, @sourcePath, @aliases, @tags, @contact, @coords, @blobType, @metadata)`
  );
  const serialize = (value?: unknown) => (value === undefined ? null : JSON.stringify(value));
  const insertMany = db.transaction((rows: Snippet[]) => {
    for (const row of rows) {
      insert.run({
        id: row.id,
        section: row.section,
        title: row.title,
        shortSummary: row.shortSummary,
        fullTextPath: row.fullTextPath,
        updatedAt: row.updatedAt,
        sourcePath: row.sourcePath,
        aliases: serialize(row.aliases),
        tags: serialize(row.tags),
        contact: serialize(row.contact),
        coords: serialize(row.coords),
        blobType: row.blobType ?? 'text',
        metadata: serialize(row.metadata),
      });
    }
  });
  insertMany(snippets);
  db.close();
  log(`Wrote SQLite index at ${SQLITE_PATH}`);
}

main().catch((error) => {
  console.error('[extract:error]', error);
  process.exit(1);
});
