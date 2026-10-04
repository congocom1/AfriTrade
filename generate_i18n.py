import re
import glob
import json
import os
from collections import defaultdict

# 1. Collect ALL t() keys from src
used_keys = set()
for path in glob.glob('src/**/*.jsx', recursive=True) + glob.glob('src/**/*.js', recursive=True):
    if 'i18n' in path or 'test' in path or 'node_modules' in path:
        continue
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        matches = re.findall(r"t\(['\"]([^'\"]+)['\"]\)", content)
        used_keys.update(matches)
    except:
        pass

# Filter valid keys
valid_keys = {k for k in used_keys if re.match(r'^[a-zA-Z_][a-zA-Z0-9_.]*$', k)}

# Group by section
by_section = defaultdict(set)
for k in sorted(valid_keys):
    parts = k.split('.')
    if len(parts) >= 2:
        section = parts[0]
        by_section[section].add('.'.join(parts[1:]))
    else:
        by_section['__root__'].add(k)

# 2. Parse existing EN and FR files to get existing translations
def parse_translations(text):
    result = {}
    for m in re.finditer(r'^\s*(\w+)\s*:\s*\{', text, re.MULTILINE):
        section = m.group(1)
        start = m.start()
        depth = 0
        for i in range(start, len(text)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    section_text = text[start:i+1]
                    for sm in re.finditer(r'^\s*(\w+)\s*:\s*[\'"]([^\'"]*)[\'"]', section_text, re.MULTILINE):
                        subkey = sm.group(1)
                        value = sm.group(2)
                        result[f"{section}.{subkey}"] = value
                    break
    return result

with open('src/i18n/en.js', 'r', encoding='utf-8') as f:
    en_content = f.read()
with open('src/i18n/fr.js', 'r', encoding='utf-8') as f:
    fr_content = f.read()

en_leaves = parse_translations(en_content)
fr_leaves = parse_translations(fr_content)

print(f"EN existing leaves: {len(en_leaves)}")
print(f"FR existing leaves: {len(fr_leaves)}")

# 3. Generate complete translations
en_dict = defaultdict(dict)
fr_dict = defaultdict(dict)

for k, v in en_leaves.items():
    section, subkey = k.split('.', 1)
    en_dict[section][subkey] = v

for k, v in fr_leaves.items():
    section, subkey = k.split('.', 1)
    fr_dict[section][subkey] = v

# Add missing keys from used_keys
for section, subkeys in by_section.items():
    if section == '__root__':
        continue
    for subkey in subkeys:
        if subkey not in en_dict[section]:
            en_dict[section][subkey] = subkey.replace('_', ' ').title()
        if subkey not in fr_dict[section]:
            fr_dict[section][subkey] = subkey.replace('_', ' ').lower()

# Handle root-level keys
for k in by_section.get('__root__', []):
    if k not in en_dict['__root__']:
        en_dict['__root__'][k] = k.replace('_', ' ').title()
    if k not in fr_dict['__root__']:
        fr_dict['__root__'][k] = k.replace('_', ' ').lower()

# 4. Write complete files
def escape_js(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')

def write_translations(translations_dict, output_path):
    sections = []
    for section in sorted(translations_dict.keys()):
        if section == '__root__':
            continue
        lines = [f"  {section}: {{"]
        for k, v in sorted(translations_dict[section].items()):
            escaped = escape_js(v)
            lines.append(f"    {k}: '{escaped}',")
        lines.append("  },")
        sections.append("\n".join(lines))
    
    if '__root__' in translations_dict and translations_dict['__root__']:
        lines = []
        for k, v in sorted(translations_dict['__root__'].items()):
            escaped = escape_js(v)
            lines.append(f"  {k}: '{escaped}',")
        sections = lines + [""] + sections
    
    new_content = "export default {\n" + "\n\n".join(sections) + "\n}"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Wrote {output_path}")

write_translations(en_dict, 'src/i18n/en.js')
write_translations(fr_dict, 'src/i18n/fr.js')