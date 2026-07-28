# How to Add a Data Module

Step-by-step guide for adding a new data domain to the America250 dashboard.

## Prerequisites

- Node.js 18+ with `npm install` run in `dashboard/dashboard-app/`
- Python 3.12+ with `pandas`, `openpyxl` (for data pipeline)
- Access to your data source's official website

## Step 1: Create Your JSON Data File

Create `dashboard/dashboard-app/public/yourdomain.json`:

```json
{
  "metadata": {
    "title": "Your Module Title",
    "sources": ["Agency Name — https://official-source.gov"],
    "generated": "2026-07-25"
  },
  "states": {
    "01": {
      "name": "Alabama",
      "abbr": "AL",
      "fips": "01",
      "your_metric": 12345,
      "timeseries": { "2020": 10000, "2021": 10500, "2022": 11000, "2023": 11500 }
    }
  }
}
```

**Requirements:**
- Top-level key: `states`
- Each state keyed by 2-digit FIPS code string (`"01"` through `"56"` + `"11"` for DC)
- Every state MUST have: `name`, `abbr`, `fips`
- All other fields are your domain data
- 51 entries total (50 states + D.C.)

## Step 2: Create Your Module Config

```bash
cp dashboard/dashboard-app/templates/module.template.js dashboard/dashboard-app/src/modules/yourdomain.js
```

Edit the file. Key fields:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique lowercase identifier (matches JSON filename) |
| `label` | Yes | Display name in tab |
| `icon` | Yes | Emoji for tab |
| `owner` | Yes | Your name |
| `dataUrl` | Yes | Path to your JSON (e.g., `"/yourdomain.json"`) |
| `title` | Yes | Header title |
| `subtitle` | Yes | Header subtitle |
| `source` | Yes | Source attribution |
| `mapMetric` | Yes | Drives choropleth map + tooltip |
| `panel` | Yes | Detail panel when state is clicked |
| `summary` | No | Cards above the map |
| `ranking` | No | Ranking table view |
| `trend` | No | Line chart view |

**Your module file is pure config.** No JSX, no React, no component code.

## Step 3: Register Your Module

Edit `dashboard/dashboard-app/src/modules/registry.js`:

```js
import demographics from './demographics.js'
import economy from './economy.js'
import yourdomain from './yourdomain.js'   // ADD THIS

const modules = [
  demographics,
  economy,
  yourdomain,                              // ADD THIS
]

export default modules
```

**That's it.** One import, one array entry. Nothing else changes.

## Step 4: Verify

```bash
cd dashboard/dashboard-app
npm run verify
```

This validates:
- Your module config against real data (catches field-name typos)
- Raw data integrity
- Checksums
- Source URLs
- Duplicate files
- Repository health

## Step 5: Test Locally

```bash
npm run dev
```

Open `http://localhost:5173`, click your tab, verify map + panels render.

## Step 6: Create Raw Data Directory (Optional)

If you have a data pipeline:

```bash
mkdir -p raw/yourdomain
```

Place downloaded CSV/JSON/ZIP files here. Create `raw/yourdomain/metadata.json` using `templates/metadata.template.json`.

## Step 7: Create Download Script (Optional)

```bash
cp templates/download.template.py scripts/download_yourdomain.py
```

Fill in `YOUR_DATASETS` list and `MODULE_ID`. The template includes retry logic, logging, checksum generation, and metadata generation.

## Step 8: Commit

```bash
git add dashboard/dashboard-app/src/modules/yourdomain.js
git add dashboard/dashboard-app/public/yourdomain.json
git add raw/yourdomain/                                        # if applicable
git add raw/yourdomain/metadata.json                          # if applicable
git commit -m "feat: add [yourdomain] module"
```

## File Checklist

| File | Purpose | Required |
|------|---------|----------|
| `dashboard/dashboard-app/src/modules/yourdomain.js` | Module config | Yes |
| `dashboard/dashboard-app/public/yourdomain.json` | Per-state data | Yes |
| `dashboard/dashboard-app/src/modules/registry.js` | Register module | Yes (edit) |
| `raw/yourdomain/*.csv` | Raw downloaded data | Optional |
| `raw/yourdomain/metadata.json` | Dataset metadata | Optional |
| `scripts/download_yourdomain.py` | Download script | Optional |

## Architecture Notes

- **No new components needed.** Generic components handle all rendering.
- **Your module file is pure config.** Accessor functions receive a state record and return values.
- **Adding a module requires touching only 2 files.**
- **Verification is automatic.** `npm run verify` validates every module against real data.
- See `dashboard/dashboard-app/README.md` for the full integration guide with code examples.
