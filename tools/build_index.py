#!/usr/bin/env python3
"""Build FAISS vector index for KSSEM snippets."""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Any, List

import faiss  # type: ignore
import numpy as np
from sentence_transformers import SentenceTransformer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build FAISS index for kiosk snippets")
    parser.add_argument(
        "--snippets",
        default="data/snippets.json",
        help="Path to snippets.json produced by extract_snippets.ts",
    )
    parser.add_argument(
        "--out",
        default="data",
        help="Directory where index artifacts should be written",
    )
    parser.add_argument(
        "--model",
        default="all-MiniLM-L6-v2",
        help="Sentence-Transformers model name",
    )
    parser.add_argument(
        "--hnsw",
        action="store_true",
        help="Use IndexHNSWFlat (recommended for >10k vectors)",
    )
    return parser.parse_args()


def load_snippets(snippets_path: Path) -> List[dict[str, Any]]:
    if not snippets_path.exists():
        raise FileNotFoundError(f"Missing snippets file: {snippets_path}")
    with snippets_path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def build_corpus(snippets: List[dict[str, Any]]) -> List[str]:
    corpus: List[str] = []
    for snippet in snippets:
        title = snippet.get("title", "")
        summary = snippet.get("shortSummary", "")
        aliases = ", ".join(snippet.get("aliases") or [])
        tags = ", ".join(snippet.get("tags") or [])
        text_parts = [title, summary, aliases, tags]
        corpus.append("\n".join(part for part in text_parts if part))
    return corpus


def build_index(vectors: np.ndarray, use_hnsw: bool = False) -> faiss.Index:
    dim = vectors.shape[1]
    if use_hnsw:
        index = faiss.IndexHNSWFlat(dim, 32)
        index.hnsw.efConstruction = 200
    else:
        index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    return index


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="[build-index] %(message)s")

    snippets_path = Path(args.snippets)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    logging.info("Loading snippets from %s", snippets_path)
    snippets = load_snippets(snippets_path)
    if not snippets:
        raise RuntimeError("No snippets found. Run extract_snippets.ts first.")

    corpus = build_corpus(snippets)
    logging.info("Loaded %d snippets", len(corpus))

    logging.info("Loading model %s", args.model)
    model = SentenceTransformer(args.model)

    logging.info("Encoding snippets…")
    embeddings = model.encode(
        corpus,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    logging.info("Embeddings shape: %s", embeddings.shape)

    logging.info("Building %s index", "HNSW" if args.hnsw else "FlatIP")
    index = build_index(embeddings, use_hnsw=args.hnsw)

    index_path = out_dir / "snippets.index"
    meta_path = out_dir / "snippets_meta.json"
    emb_path = out_dir / "snippets_embs.npy"

    logging.info("Writing index to %s", index_path)
    faiss.write_index(index, str(index_path))

    logging.info("Saving embeddings to %s", emb_path)
    np.save(emb_path, embeddings)

    logging.info("Saving metadata to %s", meta_path)
    with meta_path.open("w", encoding="utf-8") as fh:
        json.dump(snippets, fh, ensure_ascii=False, indent=2)

    logging.info("Index build complete.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover
        logging.error("Index build failed: %s", exc)
        raise
