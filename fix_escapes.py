#!/usr/bin/env python3
import re

# Read the file
with open('src/data/collegeData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all escaped quotes with normal quotes (except in actual escape sequences)
content = content.replace('\\"', '"')

# Replace literal \n with actual line breaks (but not within strings)
content = content.replace('\\n            ', '\n            ')

# Write back
with open('src/data/collegeData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed escape characters in collegeData.ts")
