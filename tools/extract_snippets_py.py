#!/usr/bin/env python3
"""Python-based extractor to produce data/snippets.json and data/snippets.db

This script reads `src/data/collegeData.ts` by running a tiny Node helper
that strips TypeScript-only annotations and prints JSON. It then creates
text blob files under `data/blobs/`, writes `data/snippets.json`, and
writes a SQLite index `data/snippets.db` compatible with the project's
schema.
"""
from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
BLOBS_DIR = DATA_DIR / "blobs"
MEDIA_DIR = BLOBS_DIR / "media"
SNIPPETS_JSON = DATA_DIR / "snippets.json"
SQLITE_PATH = DATA_DIR / "snippets.db"


def node_extract_college_json(ts_path: Path) -> Dict[str, Any]:
    # Read the TS source here and perform lightweight, targeted transforms
    import re

    ts_src = ts_path.read_text(encoding='utf8')
    # Remove import lines
    ts_src = re.sub(r'^\s*import.*$', '', ts_src, flags=re.M)
    # Replace `export const collegeDatabase = (` with `const collegeDatabase = (`
    ts_src = re.sub(r'export\s+const\s+collegeDatabase\s*=\s*\(', 'const collegeDatabase = (', ts_src)
    # Remove common TypeScript casts like `) as unknown) as CollegeInfo;` -> `);`
    ts_src = re.sub(r'\)\s*as\s*unknown\)\s*as\s*CollegeInfo\s*;?', ');', ts_src)
    ts_src = re.sub(r'\s+as\s+CollegeInfo\s*;?', ';', ts_src)
    ts_src = re.sub(r'\)\s*as\s*unknown\s*;?', ')', ts_src)
    ts_src = re.sub(r'\}\s*as\s*unknown\s*;?', '}', ts_src)
    ts_src = re.sub(r'\s+as\s+[A-Za-z0-9_<\>\[\]]+\s*;?', '', ts_src)

    # Build a JS file that inlines the transformed source inside an IIFE and
    # returns the `collegeDatabase` (or module.exports) so we can print JSON.
    js_content = (
        "console.error('TRANSFORMED_SRC_START');\n"
        "console.error('--- trimmed; not printing full source ---');\n"
        "console.error('TRANSFORMED_SRC_END');\n"
        "try {\n"
        "  const __result = (function() {\n"
        + ts_src
        + "\n  return (typeof collegeDatabase !== 'undefined') ? collegeDatabase : (typeof module !== 'undefined' && module.exports && (module.exports.default || module.exports));\n"
        "  })();\n"
        "  console.log(JSON.stringify(__result));\n"
        "} catch (err) {\n"
        "  console.error('EVAL_ERROR', err && err.stack ? err.stack : String(err));\n"
        "  process.exit(2);\n"
        "}\n"
    )

    import tempfile
    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.js', encoding='utf8') as fh:
        fh.write(js_content)
        tmp_path = fh.name
    try:
        proc = subprocess.run(["node", tmp_path], capture_output=True, text=True)
        if proc.returncode != 0:
            print("Failed to extract college data via Node:\n", proc.stderr, file=sys.stderr)
            raise SystemExit(1)
        return json.loads(proc.stdout)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    BLOBS_DIR.mkdir(parents=True, exist_ok=True)
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)


def summarize(text: str, words: int = 60) -> str:
    clean = " ".join(text.split())
    if not clean:
        return ""
    parts = clean.split(" ")
    if len(parts) <= words:
        return clean
    return " ".join(parts[:words]) + "…"


run_seed = datetime.utcnow().strftime("%Y%m%d%H%M%S")
sequence = 0


def next_id(section: str) -> str:
    global sequence
    sequence += 1
    return f"{section}-{run_seed}-{sequence}"


def write_blob(id_: str, text: str) -> str:
    path = BLOBS_DIR / f"{id_}.txt"
    with path.open("w", encoding="utf8") as fh:
        fh.write(text.rstrip() + "\n")
    return str(path)


def create_snippet(section: str, title: str, text: str, source_path: str, **kwargs) -> Dict[str, Any]:
    id_ = next_id(section)
    blob_path = write_blob(id_, text)
    snippet = {
        "id": id_,
        "section": section,
        "title": title,
        "shortSummary": summarize(text),
        "fullTextPath": blob_path,
        "updatedAt": kwargs.get("updatedAt") or datetime.utcnow().isoformat(),
        "sourcePath": source_path,
    }
    for k in ("aliases", "tags", "contact", "coords", "blobType", "metadata"):
        if k in kwargs and kwargs[k] is not None:
            snippet[k] = kwargs[k]
    return snippet


def build_snippets_from_college(col: Dict[str, Any]) -> List[Dict[str, Any]]:
    snippets: List[Dict[str, Any]] = []
    # about
    about = col.get("about", {})
    snippets.append(create_snippet("about", "About KSSEM", f"{about.get('description','')}\n\nMission: {about.get('mission','')}\nVision: {about.get('vision','')}", "src/data/collegeData.ts#about", aliases=about.get('keywords')))

    # admissions
    admissions = col.get("admissions", {})
    snippets.append(create_snippet("admissions", "Admissions Overview", f"{admissions.get('process','')}\n\nEligibility:\n{admissions.get('eligibility','')}", "src/data/collegeData.ts#admissions", aliases=admissions.get('keywords')))

    # placements
    placements = col.get("placements", {})
    placements_text = f"{placements.get('description','')}\n\nTop Recruiters: {', '.join(placements.get('recruiters', []))}"
    snippets.append(create_snippet("placements", "Placement Cell Snapshot", placements_text, "src/data/collegeData.ts#placements", aliases=placements.get('keywords'), metadata={"batchStatistics": placements.get('batchStatistics')}))

    # sports
    sports = col.get("sports")
    if sports:
        facilities = "\n".join(sports.get('facilities', []))
        achievements = "\n".join(sports.get('achievements', []))
        sports_text = (
            (sports.get('description', '') or '')
            + "\n\nFacilities:\n"
            + facilities
            + "\n\nAchievements:\n"
            + achievements
        )
        snippets.append(create_snippet("sports", "Sports & Physical Education", sports_text, "src/data/collegeData.ts#sports", tags=sports.get('keywords'), contact=(sports.get('director', {}) or {}).get('contact') if sports.get('director') else None))

    # cultural
    cultural = col.get('cultural')
    if cultural:
        cult_text = f"{cultural.get('description','')}\n\nEvents: {', '.join(cultural.get('events', []))}\nClubs: {', '.join(cultural.get('clubs', []))}"
        snippets.append(create_snippet('cultural', 'Cultural Activities', cult_text, 'src/data/collegeData.ts#cultural', tags=cultural.get('keywords')))

    # hostel
    hostel = col.get('hostel')
    if hostel:
        hostel_facilities = "\n".join(hostel.get('facilities', []))
        hostel_text = (hostel.get('description', '') or '') + "\n\nFacilities:\n" + hostel_facilities
        snippets.append(create_snippet('hostel', 'Hostel Facilities', hostel_text, 'src/data/collegeData.ts#hostel', metadata={'capacity': hostel.get('capacity')}))

    # leadership principal
    leadership = col.get('leadership', {})
    principal = leadership.get('principal')
    if principal:
        principal_text = f"{principal.get('name','')} ({principal.get('title','')})\n\n{principal.get('message','')}\n\nFocus Areas: {', '.join(principal.get('focusAreas', []))}"
        snippets.append(create_snippet('leadership', 'Principal Message', principal_text, 'src/data/collegeData.ts#leadership.principal', contact=principal.get('contact')))

    # managing committee
    mc = leadership.get('managingCommittee')
    if mc:
        mc_text = 'Officers:\n' + '\n'.join([f"{o.get('title')}: {o.get('name')}" for o in mc.get('officers', [])]) + '\n\nMembers:\n' + '\n'.join(mc.get('members', []))
        snippets.append(create_snippet('leadership', 'Managing Committee', mc_text, 'src/data/collegeData.ts#leadership.managingCommittee'))

    # departments
    for key, dept in (col.get('departments') or {}).items():
        text_parts = [dept.get('description','')]
        if dept.get('head'):
            text_parts.append(f"Head: {dept['head'].get('name','')} ({dept['head'].get('designation','')}) {dept['head'].get('message','')}")
        if dept.get('faculty'):
            text_parts.append('Faculty: ' + ', '.join([f.get('name','') for f in dept.get('faculty', [])]))
        if dept.get('highlights'):
            text_parts.append('Highlights: ' + '; '.join(dept.get('highlights', [])))
        if dept.get('achievements'):
            text_parts.append('Achievements: ' + '; '.join(dept.get('achievements', [])))
        if dept.get('placements') and dept.get('placements').get('description'):
            text_parts.append('Placements: ' + dept.get('placements').get('description'))
        snippets.append(create_snippet('departments', dept.get('name',''), '\n\n'.join(text_parts), f"src/data/collegeData.ts#departments.{key}", aliases=dept.get('identifiers'), tags=dept.get('keywords'), metadata={'labs': dept.get('labs'), 'programs': dept.get('programs')}))

    return snippets


def write_sqlite(snippets: List[Dict[str, Any]]):
    if SQLITE_PATH.exists():
        SQLITE_PATH.unlink()
    conn = sqlite3.connect(SQLITE_PATH)
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS snippets (
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
    );
    ''')
    cur.execute('DELETE FROM snippets;')
    insert_sql = '''INSERT INTO snippets (id, section, title, shortSummary, fullTextPath, updatedAt, sourcePath, aliases, tags, contact, coords, blobType, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'''
    for s in snippets:
        cur.execute(insert_sql, (
            s.get('id'), s.get('section'), s.get('title'), s.get('shortSummary'), s.get('fullTextPath'), s.get('updatedAt'), s.get('sourcePath'),
            json.dumps(s.get('aliases')) if s.get('aliases') is not None else None,
            json.dumps(s.get('tags')) if s.get('tags') is not None else None,
            json.dumps(s.get('contact')) if s.get('contact') is not None else None,
            json.dumps(s.get('coords')) if s.get('coords') is not None else None,
            s.get('blobType') or 'text',
            json.dumps(s.get('metadata')) if s.get('metadata') is not None else None,
        ))
    conn.commit()
    conn.close()


def main():
    ensure_dirs()
    ts_path = ROOT / 'src' / 'data' / 'collegeData.ts'
    if not ts_path.exists():
        print('Missing src/data/collegeData.ts', file=sys.stderr)
        raise SystemExit(1)
    print('[extract_py] Extracting college data via Node')
    college = node_extract_college_json(ts_path)
    print('[extract_py] Building snippets from college data')
    snippets = build_snippets_from_college(college)
    print(f'[extract_py] Writing {len(snippets)} snippets to {SNIPPETS_JSON}')
    with SNIPPETS_JSON.open('w', encoding='utf8') as fh:
        json.dump(snippets, fh, ensure_ascii=False, indent=2)
    print('[extract_py] Persisting SQLite index')
    write_sqlite(snippets)
    print('[extract_py] Done')


if __name__ == '__main__':
    main()
