import re
import sys

fpath = r"c:\Users\ssuba\OneDrive\Desktop\KSSEM AI - Copy\src\data\collegeData.ts"
text = open(fpath, "r", encoding="utf-8").read()

start = text.find("csbs:")
if start == -1:
    print("CSBS block not found")
    sys.exit(1)

end_marker = "\n    }\n} as unknown"
end = text.find(end_marker, start)
if end == -1:
    # fallback: take 4000 chars after start
    csbs_text = text[start:start+4000]
else:
    csbs_text = text[start:end]

# helper
def extract_regex(pattern, default=None, flags=0):
    m = re.search(pattern, csbs_text, flags)
    return m.group(1).strip() if m else default

# Query 1: Who is the head of CSBS?
head = extract_regex(r"head:\s*\{[^}]*name:\s*\"([^\"]+)\"", default="(unknown)", flags=re.S)

# Query 2: What is the intake for CSBS?
intake = extract_regex(r"Intake[:\s]*([0-9]{2,3})", default=None)
if not intake:
    intake = extract_regex(r"approved intake of ([0-9]{2,3})", default="(unknown)", flags=re.I)

# Query 3: Which companies prefer CSBS?
pref = extract_regex(r"topRecruiters:\s*\[([^\]]+)\]", default=None, flags=re.S)
if pref:
    # get first 5
    items = re.findall(r'"([^"]+)"', pref)
else:
    items = []

# Query 4: List 3 recent events of CSBS
events_block = extract_regex(r"events:\s*\[([^\]]+)\]", default=None, flags=re.S)
events = []
if events_block:
    events = re.findall(r'"([^"]+)"', events_block)

# Query 5: When was CSBS established?
est = extract_regex(r"established in (\d{4})", default=None, flags=re.I)

# Print results
print("QA Results for CSBS:\n")
print("1) Head of Department:", head)
print("2) Intake:", intake)
if items:
    print("3) Sample preferred recruiters:", ", ".join(items[:6]))
else:
    print("3) Sample preferred recruiters: (not found)")
if events:
    print("4) Recent events (sample):", "; ".join(events[:5]))
else:
    print("4) Recent events: (not found)")
print("5) Established:", est if est else "(not found)")
