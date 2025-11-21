import sys, xml.etree.ElementTree as ET, os

docpath = r"c:\Users\ssuba\OneDrive\Desktop\KSSEM AI - Copy\temp\csbs_extracted\word\document.xml"
if not os.path.exists(docpath):
    print("MISSING_DOC")
    sys.exit(2)

ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

try:
    tree = ET.parse(docpath)
    root = tree.getroot()
except Exception as e:
    print('PARSE_ERROR', e)
    sys.exit(3)

texts = []
for t in root.findall('.//w:t', ns):
    if t.text:
        texts.append(t.text)

# Join runs into paragraphs by splitting on explicit breaks where present
# Word uses w:p for paragraphs; we'll emit a blank line between paragraphs
paras = []
for p in root.findall('.//w:p', ns):
    parts = [t.text for t in p.findall('.//w:t', ns) if t.text]
    if parts:
        paras.append(''.join(parts))

if paras:
    output = '\n\n'.join(paras)
else:
    output = '\n'.join(texts)

print(output)
