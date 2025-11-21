#!/usr/bin/env python3
"""FastAPI vector search service for the KSSEM kiosk."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import List, Optional

import faiss  # type: ignore
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
INDEX_PATH = DATA_DIR / "snippets.index"
EMB_PATH = DATA_DIR / "snippets_embs.npy"
META_PATH = DATA_DIR / "snippets_meta.json"
MODEL_NAME = "all-MiniLM-L6-v2"

logger = logging.getLogger("vector-server")
logging.basicConfig(level=logging.INFO, format="[vector-server] %(message)s")

app = FastAPI(title="KSSEM Vector Server", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchResult(BaseModel):
    id: str
    score: float
    shortSummary: Optional[str]
    section: str
    fullTextPath: str
    updatedAt: str
    sourcePath: str
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[dict] = None


class SearchResponse(BaseModel):
    results: List[SearchResult]


_model: Optional[SentenceTransformer] = None
_index: Optional[faiss.Index] = None
_meta: List[dict] = []


def ensure_resources() -> None:
    global _model, _index, _meta

    if not META_PATH.exists() or not INDEX_PATH.exists():
        raise RuntimeError(
            "Missing index artifacts. Run scripts/publish_data.sh to generate snippets.index and snippets_meta.json."
        )

    if _model is None:
        logger.info("Loading sentence-transformer model %s", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)

    if _index is None:
        logger.info("Loading FAISS index from %s", INDEX_PATH)
        _index = faiss.read_index(str(INDEX_PATH))

    if not _meta:
        logger.info("Loading snippet metadata %s", META_PATH)
        with META_PATH.open("r", encoding="utf-8") as fh:
            _meta = json.load(fh)
        if _index.ntotal != len(_meta):
            raise RuntimeError(
                f"Index vector count {_index.ntotal} does not match metadata entries {len(_meta)}"
            )


@app.on_event("startup")
async def startup_event() -> None:
    ensure_resources()


@app.get("/health")
async def health() -> dict:
    ensure_resources()
    return {"status": "ok", "vectors": _index.ntotal if _index else 0}


@app.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., description="Query text"),
    k: int = Query(5, ge=1, le=50, description="Number of results"),
    ids: Optional[str] = Query(None, description="Comma separated snippet IDs to filter within"),
):
    ensure_resources()
    assert _model is not None and _index is not None

    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter 'q' cannot be empty")

    try:
        embeddings = _model.encode([query], normalize_embeddings=True, convert_to_numpy=True)
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to encode query")
        raise HTTPException(status_code=500, detail=f"Embedding failure: {exc}") from exc

    scores, idxs = _index.search(embeddings, min(k, _index.ntotal))
    id_filter = None
    if ids:
        id_filter = {value.strip() for value in ids.split(',') if value.strip()}

    results: List[SearchResult] = []
    for score, idx in zip(scores[0], idxs[0]):
        if idx < 0 or idx >= len(_meta):
            continue
        meta = _meta[idx]
        if id_filter and meta.get("id") not in id_filter:
            continue
        results.append(
            SearchResult(
                id=meta.get("id"),
                score=float(score),
                shortSummary=meta.get("shortSummary"),
                section=meta.get("section"),
                fullTextPath=meta.get("fullTextPath"),
                updatedAt=meta.get("updatedAt"),
                sourcePath=meta.get("sourcePath"),
                title=meta.get("title"),
                tags=meta.get("tags"),
                metadata=meta.get("metadata"),
            )
        )
        if len(results) >= k:
            break

    return SearchResponse(results=results)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app,
        host="0.0.0.0",
        port=8001,
        reload=False,
    )
