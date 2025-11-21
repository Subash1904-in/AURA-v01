import sys
import xml.etree.ElementTree as ET
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: extract_doc_text.py <path-to-document.xml>")
    sys.exit(1)

path = Path(sys.argv[1])
if not path.exists():
    print(f"Missing file: {path}")
    sys.exit(2)

ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root = ET.parse(path).getroot()
paras = []
for p in root.findall('.//w:p', ns):
    texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
    if texts:
        paras.append(''.join(texts))

print('\n'.join(paras))
