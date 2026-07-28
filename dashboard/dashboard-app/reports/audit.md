# America250 Data Warehouse — Audit Report

**Generated:** 2026-07-28T05:46:14.131Z
**Elapsed:** 0.6s
**Overall:** ❌ FAIL

## Results

| Verifier | Status | Time |
|----------|--------|------|
| Repository Health | ❌ FAIL | 0.1s |
| Raw Data Integrity | ✅ PASS | 0.1s |
| Module Metadata | ❌ FAIL | 0.1s |
| Module Accessors | ✅ PASS | 0.1s |
| Checksums | ✅ PASS | 0.1s |
| Data Sources | ✅ PASS | 0.1s |
| Duplicate Detection | ✅ PASS | 0.1s |
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
  WARN  node_modules not installed - run: npm install

--- Secrets Scan ---

--- Directory Structure ---
  ok  scripts/ (7 entries)
  info  raw/ (not found - will be created as needed)
  info  processed/ (not found - will be created as needed)
  info  logs/ (not found - will be created as needed)
  info  core/ (not found - will be created as needed)
  ok  dashboard/ (4 entries)

--- Dashboard ---
  ok  src/modules/ (5 entries)
  ok  src/components/ (11 entries)
  ok  verify/ (9 entries)
  ok  templates/ (4 entries)
  ok  public/ (5 entries)

--- Summary ---
Issues: 1
1 ISSUE(S) FOUND


```

### Raw Data Integrity

```
=== Raw Data Verification ===

No raw/ directory found. Skipping.

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

No raw/ directory found. Skipping.

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

No raw/ directory found. Skipping.

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

