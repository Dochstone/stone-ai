"""Batch-refactor hardcoded prices in SEO pages to use lib/pricing helpers."""
import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

FILES = [
    "website/app/alternatives/[slug]/page.tsx",
    "website/app/alternatives/page.tsx",
    "website/app/for/[role]/page.tsx",
    "website/app/docs/page.tsx",
    "website/app/blog/[slug]/page.tsx",
    "website/app/models/[id]/page.tsx",
    "website/app/models/page.tsx",
    "website/app/tools/[category]/page.tsx",
    "website/app/code/page.tsx",
    "website/app/topup/page.tsx",
]

# order matters: longest patterns first
PATTERNS = [
    (re.compile(r"590\s*₽\s*/\s*мес"),        '${planPriceFull("mini")}'),
    (re.compile(r"1\s*290\s*₽\s*/\s*мес"),    '${planPriceFull("max")}'),
    (re.compile(r"2\s*990\s*₽\s*/\s*мес"),    '${planPriceFull("max-pro")}'),
    (re.compile(r"590\s*₽"),                  '${planPrice("mini")}'),
    (re.compile(r"1\s*290\s*₽"),              '${planPrice("max")}'),
    (re.compile(r"2\s*990\s*₽"),              '${planPrice("max-pro")}'),
]

STRING_RE = re.compile(r'"(?:[^"\\]|\\.)*"')


def process_strings(match: "re.Match[str]") -> str:
    s = match.group(0)
    inner = s[1:-1]
    new_inner = inner
    for pat, repl in PATTERNS:
        new_inner = pat.sub(repl, new_inner)
    if new_inner == inner:
        return s
    # now it's a template literal — escape any existing backticks
    new_inner = new_inner.replace("`", "\\`")
    return "`" + new_inner + "`"


def has_price(text: str) -> bool:
    return bool(re.search(r"(590|1\s*290|2\s*990)\s*₽", text))


for path in FILES:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = f.read()
    except FileNotFoundError:
        print(f"SKIP {path} (not found)")
        continue

    original = data
    if not has_price(data):
        print(f"SKIP {path} (no prices)")
        continue

    # insert import if missing
    if 'from "@/lib/pricing"' not in data:
        m = re.search(r"^import[^\n]+\n", data, re.M)
        if m:
            idx = m.end()
            data = data[:idx] + 'import { planPrice, planPriceFull } from "@/lib/pricing";\n' + data[idx:]

    data = STRING_RE.sub(process_strings, data)

    if data != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(data)
        print(f"UPDATED {path}")

    left = re.findall(r"(590|1\s*290|2\s*990)\s*₽", data)
    if left:
        print(f"  leftover: {len(left)}")
        for n, line in enumerate(data.split("\n"), 1):
            if re.search(r"(590|1\s*290|2\s*990)\s*₽", line):
                print(f"    L{n}: {line.strip()[:140]}")
