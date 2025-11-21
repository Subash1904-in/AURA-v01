# RAG Architecture

## 1. High-Level Flow
```
┌────────┐      ┌────────────┐      ┌──────────────┐      ┌─────────────┐
│ Source │ ───▶ │ tools/     │ ───▶ │ data/        │ ───▶ │ Serving tier │
│ docs   │      │ ingestion  │      │ snippets+idx │      │ (FastAPI +  │
└────────┘      └────────────┘      └──────────────┘      │ Node RAG)   │
                                                           └─────────────┘
                                                                │
                                                                ▼
                                                          React + Gemini
```

1. **Ingestion (`tools/extract_snippets.ts`)** – reads `src/data/collegeData.ts` and any assets under `incoming/`, normalises text, chunk-splits paragraphs, and writes:
   - Blob files under `data/blobs/`.
   - `data/snippets.json` (full metadata).
   - `data/snippets.db` (SQLite mirror used for filtering).
2. **Validation (`tools/validate_snippets.ts`)** – enforces schema/ID/duplicate rules before CI/CD can continue.
3. **Indexing (`tools/build_index.py`)** – loads `data/snippets.json`, encodes the text via `sentence-transformers`, and persists FAISS + metadata files consumed by FastAPI.
4. **Serving**
   - `services/vector_server.py`: FastAPI app that keeps FAISS + metadata in RAM and exposes `/search` + `/health`.
   - `server/ragService.ts`: Node helper that queries FastAPI, filters snippet IDs with SQLite, loads blob text, and formats context.
   - `server/ragServer.ts`: Thin HTTP wrapper exposing `/rag` so browsers can fetch context without bundling Node dependencies.
   - `src/services/searchService.ts`: Browser-safe client that calls `/rag`, falls back to heuristics, and feeds prompts to Gemini.

## 2. Components
### tools/
- `extract_snippets.ts` – supports DOCX/ODT/PDF/HTML/TXT/media, tags sections, tracks aliases, copies media blobs, and writes SQLite.
- `validate_snippets.ts` – asserts uniqueness, required fields, and conflict heuristics (e.g., leadership principals).
- `build_index.py` – parameterised FAISS builder (currently flat IP) and metadata serializer.

### services/
- `vector_server.py` – loads FAISS, metadata JSON, and exposes `/search`. Accepts `ids` filter for subset search.

### server/
- `ragService.ts` – lazily opens SQLite when filters are requested, guards against missing indexes, fetches `fullText` files, and caches results inside the Node process.
- `ragServer.ts` – pure Node `http` server (no Express dependency). Provides `GET/POST /rag` and `/health`, intended to run via `npm run rag:server`.

### src/
- `services/ragClient.ts` – browser fetch client with graceful degradation for 503/connection errors.
- `services/searchService.ts` – orchestrates RAG search, heuristic fallback, formatting, and `getInformationByIntent` used by Gemini prompts.
- `services/geminiService.ts` – builds prompts with returned snippets/context, still enforces voice constraints.

## 3. Deployment Considerations
- **Environment variables**
  - `VECTOR_SERVER_URL` – Python server uses this for upstream data; Node server for HTTP queries if not on localhost.
  - `RAG_SERVER_PORT` / `VITE_RAG_API_URL` – configure HTTP endpoint for browsers.
  - `GEMINI_API_KEY` (`VITE_API_KEY`) – required for Gemini responses.
- **Processes**
  1. `bash scripts/publish_data.sh`
  2. `bash scripts/start_vector_server.sh --daemon`
  3. `npm run rag:server`
  4. `npm run dev` / `npm run build`

## 4. Failure Modes & Fallbacks
| Failure | Detection | Behaviour |
| --- | --- | --- |
| Missing `data/snippets.db` | Node server throws `RAG_INDEX_MISSING`, responds 503 | `searchService` falls back to heuristic search, logs warning once per request. |
| Vector server offline | Fetch error/timeout | Node server propagates error, `searchService` fallback triggers. |
| Outdated embeddings | Differences between SQLite + FAISS counts | `build_index.py` logs mismatch; rerun publish script to refresh artifacts. |

## 5. Operational Notes
- All generated assets live in `data/` and are gitignored to keep the repo clean.
- `npm install` now pulls native dependencies (better-sqlite3); ensure build tools exist in CI or prebuild a Docker image.
- When adding new documents drop them into `incoming/` (keep original filenames) and rerun `publish_data.sh`.
- Logs: `data/publish_*.log`, `data/vector_server.log`, `server` console output.

This document should be updated whenever the ingestion or serving topology changes so new contributors can retrace the data path end to end.
