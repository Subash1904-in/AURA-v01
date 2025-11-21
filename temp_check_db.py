import sqlite3, json, os
db_path = r'd:/AURA v01/data/snippets.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, section FROM snippets LIMIT 10")
rows = cur.fetchall()
print('Sample rows:', rows)
cur.execute("SELECT COUNT(*) FROM snippets WHERE section='leadership'")
print('Leadership count:', cur.fetchone()[0])
