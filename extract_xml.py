import zipfile
import sys
import os

docx_path = sys.argv[1]
output_xml = sys.argv[2]

if not os.path.exists(docx_path):
    print(f"Error: File not found at {docx_path}")
    sys.exit(1)

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
        with open(output_xml, 'wb') as f:
            f.write(xml_content)
        print(f"Extracted document.xml to {output_xml}")

except Exception as e:
    print(f"Error: {e}")
