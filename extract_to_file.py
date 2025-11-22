import zipfile
import xml.etree.ElementTree as ET
import sys
import os

docx_path = sys.argv[1]
output_txt = sys.argv[2]

if not os.path.exists(docx_path):
    print(f"Error: File not found at {docx_path}")
    sys.exit(1)

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        with open(output_txt, 'w', encoding='utf-8') as f:
            for p in tree.findall('.//w:p', namespaces):
                texts = [node.text for node in p.findall('.//w:t', namespaces) if node.text]
                if texts:
                    f.write(''.join(texts) + '\n')
                    
    print(f"Extracted text to {output_txt}")

except Exception as e:
    print(f"Error: {e}")
