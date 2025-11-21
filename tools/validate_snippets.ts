#!/usr/bin/env node
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SNIPPETS_JSON = path.join(DATA_DIR, 'snippets.json');
const REPORT_JSON = path.join(DATA_DIR, 'validation_report.json');

const ALLOWED_SECTIONS = new Set([
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

interface SnippetRecord {
  id: string;
  section: string;
  title: string;
  shortSummary: string;
  fullTextPath: string;
  updatedAt: string;
  sourcePath: string;
  aliases?: unknown;
  tags?: unknown;
  contact?: Record<string, unknown>;
}

interface ValidationReport {
  generatedAt: string;
  counts: {
    snippets: number;
    errors: number;
    warnings: number;
  };
  errors: string[];
  warnings: string[];
}

const log = (message: string) => console.log(`[validate] ${message}`);
const errorLog = (message: string) => console.error(`[validate:error] ${message}`);

async function main() {
  if (!fs.existsSync(SNIPPETS_JSON)) {
    errorLog(`Missing ${SNIPPETS_JSON}. Run extract_snippets first.`);
    process.exit(1);
  }

  const raw = await fsp.readFile(SNIPPETS_JSON, 'utf8');
  const snippets: SnippetRecord[] = JSON.parse(raw);
  const report = validate(snippets);
  await fsp.writeFile(REPORT_JSON, JSON.stringify(report, null, 2));
  log(`Validation report written to ${REPORT_JSON}`);

  if (report.errors.length) {
    errorLog(`Validation failed with ${report.errors.length} error(s).`);
    process.exit(1);
  }

  if (report.warnings.length) {
    log(`Validation passed with ${report.warnings.length} warning(s).`);
  } else {
    log('Validation passed with no warnings.');
  }
}

function validate(snippets: SnippetRecord[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ids = new Set<string>();
  const summaryMap = new Map<string, string[]>();
  const principalSnippets: SnippetRecord[] = [];

  for (const snippet of snippets) {
    const context = `${snippet.id || snippet.title}`;
    ensureRequired(snippet, 'id', errors, context);
    ensureRequired(snippet, 'section', errors, context);
    ensureRequired(snippet, 'title', errors, context);
    ensureRequired(snippet, 'shortSummary', errors, context);
    ensureRequired(snippet, 'fullTextPath', errors, context);
    ensureRequired(snippet, 'updatedAt', errors, context);
    ensureRequired(snippet, 'sourcePath', errors, context);

    if (snippet.id) {
      if (ids.has(snippet.id)) {
        errors.push(`Duplicate id detected: ${snippet.id}`);
      } else {
        ids.add(snippet.id);
      }
    }

    if (snippet.section && !ALLOWED_SECTIONS.has(snippet.section)) {
      errors.push(`Invalid section '${snippet.section}' for snippet ${context}`);
    }

    if (snippet.fullTextPath && !fs.existsSync(snippet.fullTextPath)) {
      errors.push(`Missing blob file for snippet ${context}: ${snippet.fullTextPath}`);
    }

    if (snippet.shortSummary) {
      const key = snippet.shortSummary.trim().toLowerCase();
      const matches = summaryMap.get(key) ?? [];
      matches.push(snippet.id);
      summaryMap.set(key, matches);
    }

    if (snippet.updatedAt && isNaN(Date.parse(snippet.updatedAt))) {
      errors.push(`Invalid updatedAt timestamp for snippet ${context}`);
    }

    validateArrays(snippet.aliases, 'aliases', context, errors);
    validateArrays(snippet.tags, 'tags', context, errors);

    if (snippet.contact) {
      validateContact(snippet.contact, context, warnings, errors);
    }

    if (
      snippet.section === 'leadership' &&
      (Array.isArray(snippet.tags) && snippet.tags.includes('principal') || /principal/i.test(snippet.title))
    ) {
      principalSnippets.push(snippet);
    }
  }

  for (const [summary, idsWithSummary] of summaryMap.entries()) {
    if (summary && idsWithSummary.length > 1) {
      warnings.push(`Duplicate short summary detected (${summary.slice(0, 80)}): ${idsWithSummary.join(', ')}`);
    }
  }

  if (principalSnippets.length > 1) {
    warnings.push('Multiple principal snippets detected. Ensure only one authoritative principal entry exists.');
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      snippets: snippets.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
  };
}

function ensureRequired(
  snippet: SnippetRecord,
  field: keyof SnippetRecord,
  errors: string[],
  context: string,
) {
  if (!snippet[field] || (typeof snippet[field] === 'string' && !(snippet[field] as string).trim())) {
    errors.push(`Missing required field '${field}' for snippet ${context}`);
  }
}

function validateArrays(value: unknown, label: string, context: string, errors: string[]) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`Field '${label}' must be an array in snippet ${context}`);
    return;
  }
  const invalid = value.some((entry) => typeof entry !== 'string' || !entry.trim());
  if (invalid) {
    errors.push(`Field '${label}' contains non-string values in snippet ${context}`);
  }
}

function validateContact(
  contact: Record<string, unknown>,
  context: string,
  warnings: string[],
  errors: string[],
) {
  const phoneRegex = /^\+91\s?\d{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const [key, value] of Object.entries(contact)) {
    if (typeof value !== 'string') continue;
    if (/phone|mobile/i.test(key)) {
      if (!phoneRegex.test(value.trim())) {
        warnings.push(`Phone number '${value}' in snippet ${context} does not match +91XXXXXXXXXX format.`);
      }
    }
    if (/email/i.test(key)) {
      if (!emailRegex.test(value.trim())) {
        errors.push(`Email '${value}' in snippet ${context} is invalid.`);
      }
    }
  }
}

main().catch((error) => {
  errorLog((error as Error).message);
  process.exit(1);
});
