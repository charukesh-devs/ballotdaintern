import urllib.request
import re

# TIGER files are state-level, not national. Let me check for correct paths.
urls = [
    ("TIGER CBSA", "https://www2.census.gov/geo/tiger/TIGER2023/CBSA/"),
    ("TIGER ZCTA", "https://www2.census.gov/geo/tiger/TIGER2023/ZCTA5/"),
    ("TIGER TRACT", "https://www2.census.gov/geo/tiger/TIGER2023/TRACT/"),
    ("TIGER STATE nat", "https://www2.census.gov/geo/tiger/TIGER2023/STATE/"),
    ("TIGER PLACE nat", "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/"),
]

for label, url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Test/1.0'})
        resp = urllib.request.urlopen(req, timeout=15)
        data = resp.read().decode('utf-8')
        files = re.findall(r'href="([^"]+)"', data)
        zips = [f for f in files if f.endswith('.zip')]
        print(f"\n=== {label} === ({len(zips)} zip files)")
        # Show first and last few
        for f in zips[:5]:
            print(f"  {f}")
        if len(zips) > 10:
            print(f"  ... ({len(zips) - 10} more)")
        for f in zips[-5:]:
            print(f"  {f}")
    except Exception as e:
        print(f"\n=== {label} === FAILED: {e}")
