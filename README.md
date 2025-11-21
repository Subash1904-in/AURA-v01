# KSSEM AI Assistant (RAG Edition)

Aura is a kiosk-style assistant for K.S. School of Engineering and Management that now answers questions via a Retrieval-Augmented Generation (RAG) stack. Department PDFs, incoming documents, and curated JSON data are converted into semantic snippets, embedded with Sentence Transformers, indexed in FAISS, and served to the React front end through lightweight Python and Node services.

## Key Features
- **RAG pipeline** – `tools/` scripts extract, validate, and chunk source documents into `data/snippets.*` artifacts and blob storage.
- **Vector + metadata search** – `services/vector_server.py` exposes FAISS search while a companion Node server enriches results with blob text and SQLite filters.
- **Voice-first experience** – the React/Vite app keeps its original live audio workflow, dynamic posters, and navigation helpers.
- **Heuristic fallback** – if the RAG index is missing or offline, `searchService` automatically reverts to the legacy keyword search so the kiosk never returns empty-handed.
- **Automation-friendly** – bash scripts under `scripts/` publish fresh data, boot the vector server, and log progress for auditing.

## Repository Layout
```
├─ src/                 # React app (voice UI, sensors, search client)
├─ tools/               # extract_snippets.ts, validate_snippets.ts, build_index.py
├─ services/
│  └─ vector_server.py  # FastAPI + FAISS search endpoint
├─ server/
│  ├─ ragService.ts     # Node-only SQLite + blob loader
│  └─ ragServer.ts      # Minimal HTTP wrapper (GET/POST /rag, /health)
├─ scripts/
│  ├─ publish_data.sh   # Runs extraction → validation → index build
│  └─ start_vector_server.sh  # Creates venv, installs deps, starts uvicorn
├─ data/                # Generated snippets DB/JSON/index + blobs (gitignored)
├─ incoming/            # Drop PDFs, DOCX, TXT, etc. to ingest on next publish
├─ docs/RAG_ARCHITECTURE.md  # Deep dive into the data flow and services
└─ README.md            # You are here
```

## Prerequisites
1. **Node.js 18+** (preferably the version shipping with modern Vite). Native modules such as `better-sqlite3` require a C++ toolchain (VS 2022 "Desktop development with C++" workload on Windows).
2. **Python 3.10+** with `pip` and `venv` for the embedding/index build scripts and FastAPI server.
3. **Git Bash / WSL / macOS shell** for running the bash automation scripts.

## Setup Steps
1. **Install Node dependencies**
   ```bash
   npm install
   ```
   > On Windows ensure Visual Studio build tools are installed so `better-sqlite3` can compile. If installation fails, install the "Desktop development with C++" workload and re-run the command.

2. **Install Python dependencies**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv/Scripts/activate on Windows
   pip install -r requirements.txt
   ```

3. **Publish data (extract → validate → embed)**
   ```bash
   bash scripts/publish_data.sh
   ```
   This script logs to `data/publish_<timestamp>.log` and produces:
   - `data/snippets.json` + `data/snippets.db` + blob files
   - `data/snippets.index`, `data/snippets_embs.npy`, `data/snippets_meta.json`

4. **Start the Python vector server**
   ```bash
   PORT=8001 bash scripts/start_vector_server.sh --daemon
   ```
   The script provisions `.venv/`, installs requirements if needed, boots uvicorn, and polls `http://localhost:PORT/health`.

5. **Start the Node RAG server**
   ```bash
   npm run rag:server
   ```
   This wraps the SQLite/blobs logic and exposes `GET /rag?q=...&intent=...` plus `/health` on port `RAG_SERVER_PORT` (default 8789). Configure the front end via `VITE_RAG_API_URL` if you deploy it behind a reverse proxy (otherwise it calls `http://localhost:8789/rag`).

6. **Run the React app**
   ```bash
   npm run dev
   ```
   Vite proxies requests to the Node/Python services; ensure both are running (or rely on the heuristic fallback if the RAG stack is offline).

## Search & Retrieval Flow
1. User speech is transcribed in the kiosk UI and passed to `generateResponse`.
2. `searchWithContext` classifies intent, then:
   - Calls the Node RAG API for semantic snippets + formatted context.
   - Falls back to heuristic keyword search if the RAG API returns 503 (missing index) or is unreachable.
3. Gemini receives the prompt + trimmed context and answers concisely for the voice channel.

## Automation Scripts
| Script | Purpose |
| --- | --- |
| `scripts/publish_data.sh` | Ensures `data/` structure exists, runs `extract_snippets`, `validate_snippets`, and `build_index.py`, capturing stdout/stderr in `data/publish_*.log`. |
| `scripts/start_vector_server.sh [--daemon]` | Creates/activates `.venv`, installs `requirements.txt`, launches uvicorn, and optionally backgrounds the process while performing `/health` checks. |
| `npm run rag:server` | Uses `tsx` to run `server/ragServer.ts` for HTTP access to snippet metadata. |

## Legacy JSON Database
The previous JSON-only data layer is still available under `src/data/collegeData.ts` for quick reference and for the heuristic search fallback. New contributions should prefer adding source material to `incoming/` and re-running the publish pipeline so everything ends up in the canonical snippets/index artifacts.

## Troubleshooting
- **RAG requests return 503** – run `bash scripts/publish_data.sh`, then restart the vector and RAG servers.
- **`npm install` fails on Windows** – install the latest Visual Studio build tools with the C++ workload so `better-sqlite3` can compile.
- **`curl` missing** – install Git for Windows or use WSL to run the bash scripts.
- **Vector server health check fails** – check `data/vector_server.log` for uvicorn errors and confirm FAISS artifacts exist.

For architectural details (data flow diagrams, intent routing, caching), see [`docs/RAG_ARCHITECTURE.md`](docs/RAG_ARCHITECTURE.md).
