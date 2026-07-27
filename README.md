# America250 Data Warehouse - Demographics & Census

## Overview

Automated data acquisition pipeline for U.S. Census Bureau demographic datasets as part of the America250 Data Warehouse project. This pipeline acquires, validates, cleans, and exports official government demographic data into a presentation-ready Excel workbook.

## Data Sources

All data comes exclusively from official U.S. Government sources:

- **Census Bureau API** - https://api.census.gov
- **American Community Survey (ACS)** - 1-Year and 5-Year estimates
- **Population Estimates Program (PEP)** - Annual population estimates
- **TIGER/Line Shapefiles** - Geographic boundary files
- **Gazetteer Files** - Geographic reference data

## Datasets Included

| Dataset | Description | Source |
|---------|-------------|--------|
| Population | Total population estimates | ACS, PEP |
| Age | Age distribution by sex | ACS B01001 |
| Sex | Male/Female population | ACS |
| Race | Race categories | ACS B02001 |
| Ethnicity | Hispanic/Latino origin | ACS B03001/B03002 |
| Households | Household type and income | ACS B11001, B19013 |
| Families | Family structure | ACS B11003, B11012 |
| Housing | Housing tenure, vacancy, value | ACS B25001-B25077 |
| Education | Educational attainment | ACS B15003 |
| Language | Language spoken at home | ACS B16001 |
| Disability | Disability status by age | ACS B18101 |
| Veterans | Veteran status | ACS B21001 |
| Migration | Geographic mobility | ACS B07003 |
| Household Income | Income distribution | ACS B19001 |
| Gazetteer | Geographic reference data | Census Gazetteer |
| State Lookup | FIPS codes and abbreviations | Census Bureau |
| County Lookup | County FIPS codes | Census Bureau |

## Project Structure

```
project/
├── main.py                 # Pipeline orchestrator
├── scripts/
│   ├── download.py         # Census API data acquisition
│   ├── validate.py         # Data validation and quality checks
│   ├── clean.py            # Data cleaning and standardization
│   └── export_excel.py     # Excel workbook generation
├── raw/                    # Raw downloaded data files
├── processed/
│   └── Demographics_Data.xlsx  # Final output workbook
├── logs/                   # Pipeline execution logs
└── README.md
```

## Setup

### Prerequisites

- Python 3.12+
- Internet connection

### Installation

```bash
pip install pandas openpyxl numpy
```

Optional (for TIGER/Line shapefile processing):
```bash
pip install geopandas shapely
```

## Usage

### Run Complete Pipeline

```bash
cd project
python main.py
```

### Run Individual Steps

```bash
# Download only
python -m scripts.download

# Validate only
python -m scripts.validate

# Clean only
python -m scripts.clean

# Export only
python -m scripts.export_excel
```

## Output

The pipeline produces `processed/Demographics_Data.xlsx` with:

- **One worksheet per dataset** with metadata header (rows 1-10)
- **Dataset_Catalog** - Summary of all datasets
- **Data_Dictionary** - Column descriptions for all worksheets
- **Quality_Report** - Validation results and data quality metrics

### Excel Formatting

- Frozen header rows
- Auto-filter enabled on all columns
- Auto-sized column widths
- Bold headers with professional styling
- Alternating row colors
- Border formatting

## Census API Key

This pipeline works without an API key, but rate limits apply (500 requests/day). To increase limits:

1. Register at https://api.census.gov/data/key_signup.html
2. Set the API key in `scripts/download.py`:
   ```python
   CENSUS_API_KEY = "your_key_here"
   ```

## Data Quality

The pipeline performs these validation checks:

- Duplicate row detection and removal
- Missing value analysis
- GEOID format validation
- FIPS code validation
- Encoding issue detection
- Data type verification

## License

Public Domain - U.S. Government data

## Contact

America250 Data Warehouse Project
