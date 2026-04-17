"""Daily GSC report — run: python3 scripts/gsc_daily.py"""
import json
from datetime import date, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

SA_FILE = "/var/www/stone-ai/backend/secrets/gsc-sa.json"
SITE = "https://stoneai.ru/"

creds = service_account.Credentials.from_service_account_file(
    SA_FILE, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)
service = build("searchconsole", "v1", credentials=creds)

end = date.today() - timedelta(days=3)  # GSC data lag 2-3 days
start = end - timedelta(days=7)

print(f"=== GSC Report: {start} → {end} ===\n")

# Top pages
resp = service.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["page"], "rowLimit": 20, "type": "web",
}).execute()

total_clicks = sum(r.get("clicks", 0) for r in resp.get("rows", []))
total_impr = sum(r.get("impressions", 0) for r in resp.get("rows", []))
pages_count = len(resp.get("rows", []))

print(f"TOTALS: {total_clicks} clicks | {total_impr} impressions | {pages_count} pages showing\n")
print(f"{'PAGE':<55} {'CLICKS':>6} {'IMPR':>7} {'CTR':>6} {'POS':>5}")
print("-" * 85)
for r in resp.get("rows", []):
    page = r["keys"][0].replace("https://stoneai.ru", "")
    clicks = r.get("clicks", 0)
    impr = r.get("impressions", 0)
    ctr = r.get("ctr", 0) * 100
    pos = r.get("position", 0)
    marker = " ★" if clicks > 0 else ""
    print(f"{page:<55} {clicks:>6} {impr:>7} {ctr:>5.1f}% {pos:>5.1f}{marker}")

# Top queries
print(f"\n{'QUERY':<50} {'CLICKS':>6} {'IMPR':>7} {'CTR':>6} {'POS':>5}")
print("-" * 80)
resp2 = service.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["query"], "rowLimit": 20, "type": "web",
}).execute()
for r in resp2.get("rows", []):
    q = r["keys"][0][:48]
    clicks = r.get("clicks", 0)
    impr = r.get("impressions", 0)
    ctr = r.get("ctr", 0) * 100
    pos = r.get("position", 0)
    print(f"{q:<50} {clicks:>6} {impr:>7} {ctr:>5.1f}% {pos:>5.1f}")

# Growth comparison
print(f"\n=== Compare with previous 7 days ===")
prev_end = start - timedelta(days=1)
prev_start = prev_end - timedelta(days=7)
resp3 = service.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(prev_start), "endDate": str(prev_end),
    "dimensions": ["page"], "rowLimit": 50, "type": "web",
}).execute()
prev_clicks = sum(r.get("clicks", 0) for r in resp3.get("rows", []))
prev_impr = sum(r.get("impressions", 0) for r in resp3.get("rows", []))

c_diff = total_clicks - prev_clicks
i_diff = total_impr - prev_impr
c_pct = (c_diff / prev_clicks * 100) if prev_clicks else 0
i_pct = (i_diff / prev_impr * 100) if prev_impr else 0
print(f"Clicks: {total_clicks} vs {prev_clicks} ({c_diff:+d}, {c_pct:+.0f}%)")
print(f"Impressions: {total_impr} vs {prev_impr} ({i_diff:+d}, {i_pct:+.0f}%)")
