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
        
        # XML namespace for Word
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text_parts = []
        for p in tree.findall('.//w:p', namespaces):
            paragraph_text = []
            for t in p.findall('.//w:t', namespaces):
                if t.text:
                    paragraph_text.append(t.text)
            if paragraph_text:
                text_parts.append(''.join(paragraph_text))
        
        print('\n'.join(text_parts))

except Exception as e:
    print(f"Error: {e}")
