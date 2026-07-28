# How to Add a Data Module

This guide walks you through adding a new data domain to the America250 Data Warehouse.

## Prerequisites

- Python 3.12+ with `pandas`, `openpyxl` installed
- Node.js 18+ with `npm install` run in `dashboard/dashboard-app/`
- Access to your data source's official website

## Step 1: Create Your Module Config

```bash
cp dashboard-app/templates/module.template.js dashboard-app/src/modules/yourdomain.js
```

Edit `yourdomain.js` and fill in:
- `id` — lowercase unique name (e.g., `"geography"`)
- `label` — display name for the tab
- `icon` — emoji for the tab
- `dataUrl` — path to your JSON (e.g., `"/geography.json"`)
- `mapMetric` — what value colors each state on the map
- `panel` — what shows in the detail panel when a state is clicked
- Optional: `summary`, `ranking`, `trend`

**Your module file should contain ONLY configuration.** No JSX, no React, no component code. The generic components handle all rendering.

## Step 2: Create Your Raw Data Directory

```bash
mkdir -p project/raw/yourdomain
```

Place your downloaded CSV/JSON/ZIP files here. **Never edit raw files.**

## Step 3: Create Metadata

```bash
cp dashboard-app/templates/metadata.template.json project/raw/yourdomain/metadata.json
```

Fill in every dataset's:
- `dataset_name`
- `source_url` (official government URL)
- `download_date`
- `update_frequency`
- `years_covered`
- `checksum_sha256`

## Step 4: Create Your Download Script (Optional)

If you need a custom download script:

```bash
cp dashboard-app/templates/download.template.py project/scripts/download_yourdomain.py
```

Fill in `YOUR_DATASETS` list and the `MODULE_ID`. The template includes retry logic, logging, checksum generation, and metadata generation.

## Step 5: Build Your Dashboard JSON

Create `dashboard/public/yourdomain.json` with this structure:

```json
{
  "metadata": {
    "title": "Your Module Title",
    "sources": ["Source Name - URL"],
    "generated": "2026-07-25"
  },
  "states": {
    "01": {
      "name": "Alabama",
      "abbr": "AL",
      "fips": "01",
      "your_field": 12345,
      "...": "..."
    }
  }
}
```

The JSON must have `states` keyed by 2-digit FIPS code, with each state containing the fields your module config references.

## Step 6: Register Your Module

Edit `dashboard-app/src/modules/registry.js`:

```js
import demographics from './demographics.js'
import economy from './economy.js'
import yourdomain from './yourdomain.js'   // <-- ADD THIS LINE

const modules = [
  demographics,
  economy,
  yourdomain,                             // <-- ADD THIS LINE
]

export default modules
```

**That's it.** One import, one array entry. Nothing else in the codebase changes.

## Step 7: Verify

```bash
cd dashboard-dashboard-app
npm run verify
```

This runs all verifiers:
- Module accessor validation (catches field-name typos)
- Raw data integrity checks
- Checksum verification
- Source URL validation
- Duplicate detection
- Repository health

## Step 8: Test Locally

```bash
cd dashboard-app
npm run dev
```

Open `http://localhost:5173`, click your module tab, and verify the map and panels render correctly.

## Step 9: Commit

```bash
git add project/raw/yourdomain/
git add dashboard-app/src/modules/yourdomain.js
git add dashboard-app/public/yourdomain.json
git add project/raw/yourdomain/metadata.json
git commit -m "feat: add [yourdomain] module"
```

## File Checklist

| File | Purpose |
|------|---------|
| `src/modules/yourdomain.js` | Module configuration (REQUIRED) |
| `public/yourdomain.json` | Per-state data (REQUIRED) |
| `raw/yourdomain/*.csv` | Raw downloaded data (REQUIRED) |
| `raw/yourdomain/metadata.json` | Dataset metadata (REQUIRED) |
| `scripts/download_yourdomain.py` | Download script (OPTIONAL) |
| `src/modules/registry.js` | Register module (REQUIRED - add import) |

## Architecture Notes

- **No new components needed.** The existing generic components (`StatePanel.jsx`, `USMap.jsx`, `BarBreakdown.jsx`, `CategoryBreakdown.jsx`, `FlowCompare.jsx`, `TimeSeriesChart.jsx`) handle all rendering.
- **Your module file is pure config.** It exports accessor functions that receive a state record and return values. The dashboard calls these functions.
- **Adding a module requires touching only 2 files**: your new `yourdomain.js` and one line in `registry.js`.
- **Verification is automatic.** `npm run verify` validates every module's accessors against real data.
