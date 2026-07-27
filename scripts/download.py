"""
download.py - Census Bureau Data Acquisition Module

Downloads demographic datasets from official U.S. Census Bureau file servers.
No API key required for file-based downloads.

Sources:
- Population Estimates Program (PEP) - Direct CSV files
- Gazetteer Files - Geographic reference data (zip)
- TIGER/Line Shapefiles - Geographic boundaries (zip)
- Decennial Census 2020 - Redistricting data
- ACS Summary Files - Table-based format
"""

import json
import logging
import re
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Any
from datetime import datetime

logger = logging.getLogger(__name__)

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)
FAILED_URLS_FILE = RAW_DIR / ".failed_urls.json"

RETRY_ATTEMPTS = 3
RETRY_DELAY = 2
REQUEST_TIMEOUT = 120


def _load_failed_urls() -> set:
    if FAILED_URLS_FILE.exists():
        try:
            return set(json.loads(FAILED_URLS_FILE.read_text(encoding="utf-8")))
        except Exception:
            pass
    return set()


def _save_failed_urls(failed: set):
    FAILED_URLS_FILE.write_text(json.dumps(sorted(failed)), encoding="utf-8")


def _get_url(url: str, timeout: int = REQUEST_TIMEOUT) -> bytes:
    """Fetch a URL with retry logic and return raw bytes."""
    failed_cache = _load_failed_urls()
    if url in failed_cache:
        raise RuntimeError(f"Previously failed URL (cached): {url}")
    attempt = 0
    last_error = None
    while attempt < RETRY_ATTEMPTS:
        try:
            logger.debug(f"GET {url} (attempt {attempt + 1})")
            req = urllib.request.Request(url, headers={"User-Agent": "America250-DemographicsPipeline/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
            last_error = exc
            attempt += 1
            if attempt < RETRY_ATTEMPTS:
                wait = RETRY_DELAY * attempt
                logger.warning(f"Retry {attempt}/{RETRY_ATTEMPTS} after {wait}s: {exc}")
                time.sleep(wait)
    failed_cache.add(url)
    _save_failed_urls(failed_cache)
    raise RuntimeError(f"Failed to fetch {url} after {RETRY_ATTEMPTS} attempts: {last_error}")


def _save_file(data: bytes, filename: str, dataset: str) -> Path:
    """Save data to raw directory under a dataset subfolder."""
    subdir = RAW_DIR / dataset
    subdir.mkdir(parents=True, exist_ok=True)
    path = subdir / filename
    path.write_bytes(data)
    logger.info(f"Saved {path} ({len(data):,} bytes)")
    return path


def _download_if_missing(url: str, filename: str, dataset: str) -> Path | None:
    """Download a file only if it doesn't already exist."""
    subdir = RAW_DIR / dataset
    subdir.mkdir(parents=True, exist_ok=True)
    filepath = subdir / filename

    if filepath.exists() and filepath.stat().st_size > 0:
        logger.info(f"Skip existing: {filename}")
        return filepath

    try:
        data = _get_url(url)
        return _save_file(data, filename, dataset)
    except Exception as exc:
        logger.error(f"Failed to download {filename}: {exc}")
        return None


# ── Census Data URLs ──────────────────────────────────────────────────────────

# PEP (Population Estimates Program) - Direct CSV downloads
PEP_FILES = {
    "state": "https://www2.census.gov/programs-surveys/popest/datasets/2020-2023/state/totals/NST-EST2023-ALLDATA.csv",
    "county": "https://www2.census.gov/programs-surveys/popest/datasets/2020-2023/counties/totals/co-est2023-alldata.csv",
}

# Gazetteer 2024 - National-level files
GAZETTEER_FILES = {
    "state": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_state_national.zip",
    "county": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip",
    "place": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip",
    "cbsa": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_cbsa_national.zip",
    "zcta": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip",
    "tracts": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_tracts_national.zip",
    "cousub": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_cousubs_national.zip",
    "elsd": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_elsd_national.zip",
    "scsd": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_scsd_national.zip",
    "unsd": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_unsd_national.zip",
    "sldl": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_sldl_national.zip",
    "sldu": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_sldu_national.zip",
    "aiannh": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_aiannh_national.zip",
    "ua": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_ua_national.zip",
}

# TIGER/Line 2023 - National-level and key state-level files
TIGER_NATIONAL = {
    "states": "https://www2.census.gov/geo/tiger/TIGER2023/STATE/tl_2023_us_states.zip",
    "counties": "https://www2.census.gov/geo/tiger/TIGER2023/COUNTY/tl_2023_us_county.zip",
    "cbsa": "https://www2.census.gov/geo/tiger/TIGER2023/CBSA/tl_2023_us_cbsa.zip",
    "csa": "https://www2.census.gov/geo/tiger/TIGER2023/CSA/tl_2023_us_csa.zip",
    "metdiv": "https://www2.census.gov/geo/tiger/TIGER2023/METDIV/tl_2023_us_metdiv.zip",
    "aiannh": "https://www2.census.gov/geo/tiger/TIGER2023/AIANNH/tl_2023_us_aiannh.zip",
}

# TIGER per-state (places, tracts) - just a few representative states
TIGER_STATE_FILES = {
    "places": {
        "CA": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_06_place.zip",
        "TX": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_48_place.zip",
        "FL": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_12_place.zip",
        "NY": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_36_place.zip",
        "PA": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_42_place.zip",
        "IL": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_17_place.zip",
        "OH": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_39_place.zip",
        "GA": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_13_place.zip",
        "NC": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_37_place.zip",
        "MI": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_26_place.zip",
        "NJ": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_34_place.zip",
        "VA": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_51_place.zip",
        "WA": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_53_place.zip",
        "AZ": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_04_place.zip",
        "MA": "https://www2.census.gov/geo/tiger/TIGER2023/PLACE/tl_2023_25_place.zip",
    },
    "tracts": {
        "CA": "https://www2.census.gov/geo/tiger/TIGER2023/TRACT/tl_2023_06_tract.zip",
        "TX": "https://www2.census.gov/geo/tiger/TIGER2023/TRACT/tl_2023_48_tract.zip",
        "FL": "https://www2.census.gov/geo/tiger/TIGER2023/TRACT/tl_2023_12_tract.zip",
        "NY": "https://www2.census.gov/geo/tiger/TIGER2023/TRACT/tl_2023_36_tract.zip",
        "PA": "https://www2.census.gov/geo/tiger/TIGER2023/TRACT/tl_2023_42_tract.zip",
    },
}

# ACS Summary Files - Table-based format (.dat files)
# These require the geography lookup file (Geos) and table shells to parse
ACS_BASE = "https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/1YRData"
ACS_GEO = "https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/documentation/Geos20231YR.txt"

# Key ACS table files (demographic profile tables)
ACS_TABLES = {
    "B01001": f"{ACS_BASE}/acsdt1y2023-b01001.dat",
    "B01002": f"{ACS_BASE}/acsdt1y2023-b01002.dat",
    "B02001": f"{ACS_BASE}/acsdt1y2023-b02001.dat",
    "B03001": f"{ACS_BASE}/acsdt1y2023-b03001.dat",
    "B03002": f"{ACS_BASE}/acsdt1y2023-b03002.dat",
    "B07003": f"{ACS_BASE}/acsdt1y2023-b07003.dat",
    "B11001": f"{ACS_BASE}/acsdt1y2023-b11001.dat",
    "B11003": f"{ACS_BASE}/acsdt1y2023-b11003.dat",
    "B15003": f"{ACS_BASE}/acsdt1y2023-b15003.dat",
    "B16001": f"{ACS_BASE}/acsdt1y2023-b16001.dat",
    "B18101": f"{ACS_BASE}/acsdt1y2023-b18101.dat",
    "B19001": f"{ACS_BASE}/acsdt1y2023-b19001.dat",
    "B19013": f"{ACS_BASE}/acsdt1y2023-b19013.dat",
    "B21001": f"{ACS_BASE}/acsdt1y2023-b21001.dat",
    "B25001": f"{ACS_BASE}/acsdt1y2023-b25001.dat",
    "B25002": f"{ACS_BASE}/acsdt1y2023-b25002.dat",
    "B25003": f"{ACS_BASE}/acsdt1y2023-b25003.dat",
    "B25004": f"{ACS_BASE}/acsdt1y2023-b25004.dat",
    "B25064": f"{ACS_BASE}/acsdt1y2023-b25064.dat",
    "B25077": f"{ACS_BASE}/acsdt1y2023-b25077.dat",
}

# ACS Table shells - defines column layout
ACS_SHELL_URL = "https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/documentation/ACS20231YR_Table_Shells.txt"

# Decennial Census 2020 PL (Redistricting) - state-level files
FIPS_TO_STATE = {
    "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
    "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
    "11": "District_of_Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
    "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
    "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
    "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
    "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
    "32": "Nevada", "33": "New_Hampshire", "34": "New_Jersey", "35": "New_Mexico",
    "36": "New_York", "37": "North_Carolina", "38": "North_Dakota", "39": "Ohio",
    "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode_Island",
    "45": "South_Carolina", "46": "South_Dakota", "47": "Tennessee", "48": "Texas",
    "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
    "54": "West_Virginia", "55": "Wisconsin", "56": "Wyoming",
    "60": "American_Samoa", "66": "Guam", "69": "Northern_Mariana_Islands",
    "72": "Puerto_Rico", "78": "Virgin_Islands",
}


# ── Download Functions ─────────────────────────────────────────────────────────

def download_pep_data() -> dict[str, Path]:
    """Download Population Estimates Program data."""
    logger.info("--- PEP Population Estimates ---")
    results = {}
    for name, url in PEP_FILES.items():
        path = _download_if_missing(url, f"pep_{name}_2020_2023.csv", "pep")
        if path:
            results[name] = path
    return results


def download_gazetteer_files() -> dict[str, Path]:
    """Download Census Gazetteer files."""
    logger.info("--- Gazetteer Files ---")
    results = {}
    for name, url in GAZETTEER_FILES.items():
        path = _download_if_missing(url, f"2024_Gaz_{name}_national.zip", "gazetteer")
        if path:
            results[name] = path
    return results


def download_tiger_files() -> dict[str, Path]:
    """Download TIGER/Line boundary files."""
    logger.info("--- TIGER/Line Shapefiles ---")
    results = {}

    # National files
    for name, url in TIGER_NATIONAL.items():
        path = _download_if_missing(url, f"tl_2023_us_{name}.zip", "tiger")
        if path:
            results[f"tiger_{name}"] = path

    # Key state-level files (places and tracts for top 5 states)
    for geo_type, state_files in TIGER_STATE_FILES.items():
        for state_abbr, url in state_files.items():
            filename = url.split("/")[-1]
            path = _download_if_missing(url, filename, "tiger")
            if path:
                results[f"tiger_{geo_type}_{state_abbr}"] = path

    return results


def download_acs_files() -> dict[str, Path]:
    """Download ACS summary files (table-based format)."""
    logger.info("--- ACS Summary Files ---")
    results = {}

    # Download geography file
    geo_path = _download_if_missing(ACS_GEO, "Geos20231YR.txt", "acs")
    if geo_path:
        results["geo"] = geo_path

    # Download table shells
    shell_path = _download_if_missing(ACS_SHELL_URL, "ACS20231YR_Table_Shells.txt", "acs")
    if shell_path:
        results["shells"] = shell_path

    # Download key data tables
    for table_name, url in ACS_TABLES.items():
        filename = url.split("/")[-1]
        path = _download_if_missing(url, filename, "acs")
        if path:
            results[table_name] = path

    return results


def download_decennial_census() -> dict[str, Path]:
    """Download key state Decennial Census 2020 data files."""
    logger.info("--- Decennial Census 2020 ---")
    results = {}
    # Decennial PL files are not reliably available at these URLs
    # Skipping - PEP data covers population estimates
    logger.info("  Skipped - Decennial PL files not available at expected URLs")
    return results


# ── Main Pipeline ──────────────────────────────────────────────────────────────

def run_download_pipeline() -> dict[str, dict[str, Path]]:
    """
    Execute the complete download pipeline for all demographic datasets.

    Returns nested dict: {dataset_category: {name: filepath}}
    """
    results: dict[str, dict[str, Path]] = {}

    logger.info("=" * 60)
    logger.info("CENSUS BUREAU DATA ACQUISITION PIPELINE")
    logger.info("=" * 60)

    # 1. PEP data
    results["pep"] = download_pep_data()

    # 2. Gazetteer files
    results["gazetteer"] = download_gazetteer_files()

    # 3. TIGER/Line
    results["tiger"] = download_tiger_files()

    # 4. ACS Summary Files
    results["acs"] = download_acs_files()

    # 5. Decennial Census
    results["decennial"] = download_decennial_census()

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("DOWNLOAD PIPELINE COMPLETE")
    total_files = 0
    for category, files in results.items():
        count = len(files)
        total_files += count
        logger.info(f"  {category:15s}: {count} files")
    logger.info(f"  {'TOTAL':15s}: {total_files} files")
    logger.info("=" * 60)

    return results


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    run_download_pipeline()
