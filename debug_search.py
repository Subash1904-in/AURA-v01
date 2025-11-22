import sys
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

def main():
    base_dir = Path("d:/AURA v01")
    data_dir = base_dir / "data"
    index_path = data_dir / "snippets.index"
    meta_path = data_dir / "snippets_meta.json"
    
    print(f"Loading index from {index_path}...")
    index = faiss.read_index(str(index_path))
    
    print(f"Loading metadata from {meta_path}...")
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
        
    print(f"Loading model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    query = "ICDCA 2026 conference date"
    with open("debug_results.txt", "w", encoding="utf-8") as f:
        f.write(f"Querying for: '{query}'\n")
        
        emb = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)
        scores, idxs = index.search(emb, 5)

        f.write("\nResults:\n")
        for score, idx in zip(scores[0], idxs[0]):
            if idx < 0 or idx >= len(meta):
                continue
            item = meta[idx]
            f.write(f"[{score:.4f}] {item.get('title')} ({item.get('sourcePath')})\n")
            f.write(f"       Summary: {item.get('shortSummary')[:100]}...\n")
            f.write("-" * 40 + "\n")
    print("Done writing results to debug_results.txt")

if __name__ == "__main__":
    main()
