# America250 Data Warehouse — Audit Report

**Generated:** 2026-07-28T05:31:51.354Z
**Elapsed:** 1.9s
**Overall:** ❌ FAIL

## Results

| Verifier | Status | Time |
|----------|--------|------|
| Repository Health | ✅ PASS | 0.1s |
| Raw Data Integrity | ✅ PASS | 0.4s |
| Module Metadata | ❌ FAIL | 0.1s |
| Module Accessors | ✅ PASS | 0.1s |
| Checksums | ✅ PASS | 0.7s |
| Data Sources | ✅ PASS | 0.1s |
| Duplicate Detection | ✅ PASS | 0.4s |
| Download Scripts | ❌ FAIL | 0.1s |

## Details

### Repository Health

```
=== Repository Health Check ===

--- .gitignore ---
  ok  Covers: raw/
  ok  Covers: processed/
  ok  Covers: node_modules/
  ok  Covers: dist/
  ok  Covers: logs/

--- package.json ---
  info  Name: dashboard-app
  info  Scripts: dev, build, lint, preview, verify, verify:quick
  ok  node_modules installed (61 packages)

--- Secrets Scan ---
  ok  No secrets found in source files

--- Directory Structure ---
  ok  scripts/ (8 entries)
  ok  raw/ (8 entries)
  ok  processed/ (2 entries)
  ok  logs/ (8 entries)
  ok  core/ (0 entries)
  ok  dashboard/ (4 entries)

--- Dashboard ---
  ok  src/modules/ (3 entries)
  ok  src/components/ (11 entries)
  ok  verify/ (9 entries)
  ok  templates/ (4 entries)
  ok  public/ (5 entries)

--- Summary ---
Issues: 0
REPOSITORY HEALTHY

```

### Raw Data Integrity

```
=== Raw Data Verification ===


--- Summary ---
Files checked: 69
Total size: 350.1 MB
Duplicate groups: None
Issues: 0

ALL CHECKS PASSED

```

### Module Metadata

```
=== Module Metadata Verification ===

--- demographics ---
  WARN  raw/demographics/ directory does not exist

--- economy ---
  WARN  Missing recommended field: trend
  WARN  raw/economy/ directory does not exist

--- Summary ---
Issues: 3
3 ISSUE(S) FOUND


```

### Module Accessors

```

=== module: demographics ===
  ok  mapMetric.getValue on all states
  ok  mapMetric.format
  ok  summary(states)
  ok  panel.hero.getValue + format
  ok  panel.badge.getValue
  ok  panel.rankBadge.getValue
  ok  quickStats["National Rank"]
  ok  quickStats["Median Income"]
  ok  quickStats["Births (2023)"]
  ok  section["Population Growth"] (timeseries)
  ok  section["Migration (2023)"] (flow)
  ok  section["Age Distribution"] (bars)
  ok  section["Race & Ethnicity"] (categories)
  ok  ranking["rank"]
  ok  ranking["name"]
  ok  ranking["population"]
  ok  ranking["growth"]
  ok  ranking["income"]
  ok  ranking["under18"]
  ok  ranking["65plus"]
  ok  trend accessors
  ok  ALL states panel accessors (no throw)

=== module: economy ===
  ok  mapMetric.getValue on all states
  ok  mapMetric.format
  ok  summary(states)
  ok  panel.hero.getValue + format
  ok  panel.badge.getValue
  ok  panel.rankBadge.getValue
  ok  quickStats["GDP Rank"]
  ok  quickStats["GDP (2024)"]
  ok  quickStats["Labor Force"]
  ok  section["Unemployment Rate"] (timeseries)
  ok  section["Trade (2024, $M)"] (flow)
  ok  section["Regional CPI"] (timeseries)
  ok  section["Employment by Sector"] (categories)
  ok  ranking["rank"]
  ok  ranking["name"]
  ok  ranking["gdp"]
  ok  ranking["growth"]
  ok  ranking["unemployment"]
  ok  ranking["labor"]
  ok  ALL states panel accessors (no throw)

--- Summary ---
Modules checked: 2
Total checks: 42
ALL CHECKS PASSED

```

### Checksums

```
=== Checksum Generation & Verification ===

Generated checksums:
  acs/ACS20231YR_Table_Shells.txt
    SHA-256: e25ee815917f1b660d0b2c2a86d814ee3c18add086e0d6ac94f35c7ecbfb4711
    Size: 6.87 MB
  acs/acsdt1y2023-b01001.dat
    SHA-256: efb771950eef0eaa221d231b979b9aa8e664679a5fe0718d5eab1cf653ea301b
    Size: 3.79 MB
  acs/acsdt1y2023-b01002.dat
    SHA-256: b574c75119e57186752b7b7edbe4bd16fd7dc265a5a906de720366f7757c7363
    Size: 341.7 KB
  acs/acsdt1y2023-b02001.dat
    SHA-256: 3b8441120ce4cd1e4ad2db31dafb3d99af562cea8f0530867e4f30303fa8a914
    Size: 947.6 KB
  acs/acsdt1y2023-b03001.dat
    SHA-256: bab465e19ddb5cc2f37566de4121b628b857d5bf8b3dfe29bb44a3e3878ceceb
    Size: 461.8 KB
  acs/acsdt1y2023-b03002.dat
    SHA-256: 6b105eebede5fbc71bd2fb477db9774c0ef30bc7ce474e47d10854854f57f9e2
    Size: 1.52 MB
  acs/acsdt1y2023-b07003.dat
    SHA-256: 0e763b6d0d2e7b56b1bae935068b32f2532c4f4c7b4e00aee3a8f489a53e6019
    Size: 1.52 MB
  acs/acsdt1y2023-b11001.dat
    SHA-256: 2b163b7bb1f7d1cb966f021dd6d54183e978d6308b0caca1f984340eefce90a7
    Size: 892.1 KB
  acs/acsdt1y2023-b11003.dat
    SHA-256: fce93b12768ed554fa0c7546ca0c8bfb204d4fd9e4316e7e29b382ca38b824c5
    Size: 1.61 MB
  acs/acsdt1y2023-b15003.dat
    SHA-256: 6e3c7262a3ad24b8fab39ec87eff3cc1a3646403db8a49cb4ac3ac2390790078
    Size: 1.77 MB
  acs/acsdt1y2023-b16001.dat
    SHA-256: 24964edc0d2f1232f714b99151fea7caa923bfb4de8941c801303c98bb067461
    Size: 967.7 KB
  acs/acsdt1y2023-b18101.dat
    SHA-256: afe75fbdcedee4dc9686415ed53693c0f847f3f3777f3f4b0959632ff97bc52b
    Size: 3.10 MB
  acs/acsdt1y2023-b19001.dat
    SHA-256: c29b619cc65424fe4af911389c070db47422333491d4f54df0e56002549ca3cf
    Size: 1.41 MB
  acs/acsdt1y2023-b19013.dat
    SHA-256: 20530c33c93443062505a438df45917d61195bb07462a69701b4cce793cd556d
    Size: 217.1 KB
  acs/acsdt1y2023-b21001.dat
    SHA-256: 4b1b1001a3f4bf9c42468be997f5c15e6aad4efd200f76461608bab068651a28
    Size: 3.07 MB
  acs/acsdt1y2023-b25001.dat
    SHA-256: f723ca4
```

### Data Sources

```
=== Source Validation ===

--- demographics ---
  info  Source: Data: U.S. Census Bureau — PEP 2020–2023 & ACS 1-Year 2023...
  info  Data sources: 2 declared
    - U.S. Census Bureau PEP Population Estimates 2020-2023
    - U.S. Census Bureau ACS 1-Year Estimates 2023

--- economy ---
  info  Source: Sample data for template demo — swap in BLS/BEA via scripts/download_economy.py...
  info  Data sources: 1 declared
    - SAMPLE DATA — for demonstrating the module template only. Swap in real U.S. Bureau of Labor Statistics (BLS) and Bureau of Economic Analysis (BEA) data via scripts/download_economy.py + clean_economy.py.

--- Summary ---
Issues: 0
ALL SOURCES VALID

```

### Duplicate Detection

```
=== Duplicate File Detection ===

--- Summary ---
Duplicate groups: 0
No duplicates found
Report: reports/duplicate_files.csv

```

### Download Scripts

```
=== Download Script Analysis ===

--- download.py ---
  info  349 lines, 11 functions, 0 classes
  ok    Retry logic
  ok    Logging
  ok    Timeout configured
  ok    Error handling
  ok    User-Agent header
  WARN  download.py: Missing: Metadata generation
  WARN  download.py: Missing: Checksum generation
  WARN  download.py: Missing: Post-download validation
  ok    Skip-existing logic
  ok    No hardcoded absolute paths
  info  Imports: 10

--- download_economy.py ---
  info  186 lines, 5 functions, 0 classes
  WARN  download_economy.py: Missing: Retry logic
  ok    Logging
  ok    Timeout configured
  ok    Error handling
  ok    User-Agent header
  WARN  download_economy.py: Missing: Metadata generation
  WARN  download_economy.py: Missing: Checksum generation
  WARN  download_economy.py: Missing: Post-download validation
  ok    Skip-existing logic
  ok    No hardcoded absolute paths
  info  Imports: 6

--- Summary ---
Issues: 7
7 ISSUE(S) FOUND


```

