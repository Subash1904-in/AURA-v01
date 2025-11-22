import zipfile
import xml.etree.ElementTree as ET
import sys
import os

docx_path = sys.argv[1]

if not os.path.exists(docx_path):
    print(f"Error: File not found at {docx_path}")
    sys.exit(1)

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text_parts = []
        # Find all text nodes anywhere in the document
        for t in tree.findall('.//w:t', namespaces):
            if t.text:
                text_parts.append(t.text)
        
        print('\n'.join(text_parts))

except Exception as e:
    print(f"Error: {e}")
