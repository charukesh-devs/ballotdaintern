# America250 Dashboard

Interactive dashboard exploring U.S. real estate and infrastructure data across all 50 states — including house prices, airports, roads, transit, and building permits.

## Project Structure

```
├── public/                    # Frontend assets
│   ├── index.html             # HTML entry point
│   ├── app.js                 # React application (data fetching, routing, UI)
│   ├── us_map.js              # US map SVG path data
│   └── styles.css             # All styles
├── raw/                       # Raw source data (CSV, TXT, XLSX)
│   ├── faa/                   # Airport & runway data
│   ├── fhfa/                  # FHFA House Price Index
│   ├── fhwa/                  # Highway statistics
│   ├── hud/                   # HUD data (pending)
│   ├── ntd/                   # National Transit Database
│   └── transportation/        # Census building permits
├── processed/                 # Cleaned data output from pipeline
├── dashboard_data.json        # Aggregated state-level data consumed by the API
├── clean_data.py              # Data cleaning pipeline (raw → processed)
├── aggregate_data.py          # Aggregation script (processed → dashboard_data.json)
├── server.js                  # Node.js/Express API server (port 3000)
├── serve.py                   # Alternative Python static server (port 8080)
├── package.json               # Node.js dependencies (express)
├── metadata.csv               # Data source inventory
├── america250_real_estate_infrastructure_combined.csv  # Combined dataset export
├── op_map_data.js             # US map paths (legacy format)
├── us_map_svg.js              # US map paths (alternative format)
└── README.md
```

## Quick Start

### Node.js (recommended — includes API)

```bash
npm install
npm start
```

Open http://localhost:3000

### Python (static file server only)

```bash
python serve.py
```

Open http://localhost:8080

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/summary` | National totals (airports, runways, road miles, permits, avg HPI, transit ridership) |
| `GET /api/states` | All 50 states + DC with full metrics |
| `GET /api/states/:abbr` | Single state detail (e.g., `/api/states/CA`) |

## Data Sources

- **FHFA** — House Price Index (1975–2026)
- **FAA / OurAirports** — Airport & runway inventory
- **FHWA** — Public road length & vehicle miles traveled
- **NTD / FTA** — Transit agency ridership & service modes
- **Census Bureau** — Building permits by state

## Data Pipeline

```bash
python clean_data.py       # Raw → Processed CSVs
python aggregate_data.py   # Processed → dashboard_data.json
```
