# America250 Data Warehouse

Multi-domain data acquisition and visualization platform for the America250 initiative. Automated pipelines ingest, validate, clean, and export official U.S. government data. A plugin-based React dashboard visualizes all 50 states + D.C. across 6 data domains.

## Quick Start

```bash
# Data pipeline (Python)
pip install pandas openpyxl numpy
python main.py

# Dashboard (Node.js)
cd dashboard/dashboard-app
npm install
npm run dev        # http://localhost:5173
npm run verify     # full verification suite
npm run build      # production build
```

## Data Domains

Each team member owns one domain. The dashboard is plugin-based — adding a domain requires **one config file + one import**, zero component changes.

| # | Domain | Owner | Sources | Status |
|---|--------|-------|---------|--------|
| 1 | Demographics & Census | Sai | Census Bureau (PEP, ACS) | Active |
| 2 | Economy & Employment | Vignesh | BLS, BEA | Sample data |
| 3 | Geography & Environment | Charu | EPA, USGS, NOAA | Pending |
| 4 | Real Estate & Housing | Yeswant | Census, HUD | Pending |
| 5 | Politics & Elections | Vishal | FEC, EAC | Pending |
| 6 | Agriculture & Energy | Bala | USDA NASS, EIA | Pending |

## Repository Structure

```
dataset sai/
├── main.py                         # Pipeline orchestrator (all domains)
├── scripts/
│   ├── download.py                 # Census data acquisition
│   ├── download_economy.py         # BLS data acquisition
│   ├── validate.py                 # Data validation & quality checks
│   ├── clean.py                    # Census data cleaning
│   ├── clean_economy.py            # BLS data cleaning
│   └── export_excel.py             # Excel workbook generation
├── bea/                            # BEA raw data (GDP, personal income)
├── bls/                            # BLS raw data (CPI, employment, wages)
├── dashboard/
│   ├── extract_data.py             # Excel → demographics.json converter
│   ├── verify.py                   # Quick JSON sanity check
│   ├── public/                     # Legacy JSON data
│   └── dashboard-app/              # React dashboard (main app)
│       ├── src/
│       │   ├── App.jsx             # Main layout
│       │   ├── components/         # 11 generic components (shared)
│       │   └── modules/            # Plugin configs (one per domain)
│       │       ├── registry.js     # Module registry (edit to add)
│       │       ├── demographics.js # Sai's module
│       │       └── economy.js      # Vignesh's module (sample)
│       ├── public/                 # Per-state JSON data files
│       ├── core/                   # Shared utilities
│       ├── verify/                 # Verification scripts
│       ├── templates/              # Module templates & guides
│       └── reports/                # Generated verification reports
├── project/                        # Working copy (not tracked)
└── README.md                       # This file
```

## Dashboard Architecture

The dashboard uses a **config-driven plugin system**. Generic React components render any domain — module authors write only a config file.

```
Module Config (JS)  →  Generic Components  →  Rendered UI
                        ├── USMap              Choropleth map
                        ├── StatePanel         Detail panel
                        ├── SummaryCards       Summary cards
                        ├── StateRanking       Ranking table
                        ├── TrendChart         Line chart
                        ├── BarBreakdown       Horizontal bars
                        ├── CategoryBreakdown  Donut chart
                        └── FlowCompare        Positive/negative flow
```

**Adding a module requires touching only 2 files:**
1. `src/modules/yourdomain.js` — your config (new file)
2. `src/modules/registry.js` — one import + one array entry

See [`dashboard/dashboard-app/README.md`](dashboard/dashboard-app/README.md) for the full LLM-readable integration guide.

## Data Pipeline

The pipeline runs 4 stages for all domains:

```
Download  →  Validate  →  Clean  →  Export
(Census,     (FIPS,       (Standardize,   (Excel workbook
 BLS, BEA)    GEOID,       deduplicate,    with formatting)
              encoding)    transform)
```

```bash
python main.py                    # Full pipeline
python main.py --skip-download    # Skip download (use existing raw data)
```

### API Keys

| Source | Required? | How to get |
|--------|-----------|------------|
| Census Bureau | No (rate-limited) | Register at api.census.gov/data/key_signup.html |
| BLS | Yes (for state-level) | Register at registration.bls.gov |
| BEA | Yes | Register at bea.gov/api/signup/ |

## Verification Framework

```bash
cd dashboard/dashboard-app
npm run verify         # Full suite (8 checks, ~2s)
npm run verify:quick   # Module accessors only
```

| Check | What it validates |
|-------|-------------------|
| Repository Health | .gitignore, secrets, directory structure |
| Raw Data Integrity | File sizes, encoding, corruption |
| Module Metadata | Module config fields, required properties |
| Module Accessors | Every accessor function against real data |
| Checksums | SHA-256 integrity of all raw files |
| Data Sources | Source URLs are official government domains |
| Duplicate Detection | No duplicate files by checksum |
| Download Scripts | Retry logic, logging, error handling |

Reports auto-generated to `dashboard/dashboard-app/reports/`.

## Tech Stack

- **Frontend:** React 19, Vite 8, D3 7, topojson-client
- **Backend:** Python 3.13, pandas, openpyxl
- **Linting:** OxLint
- **Data:** U.S. Census Bureau, BLS, BEA (all public domain)

## License

Public Domain — U.S. Government data
