"""
download_economy.py - Economy & Employment Data Acquisition

Downloads economic datasets from the Bureau of Labor Statistics (BLS) API v2.
- LAUS: Local Area Unemployment Statistics (state & national)
- CPI: Consumer Price Index
- CES: Current Employment Statistics

Note: BEA data is not available via API without a key, and FRED is unreachable.
BLS JSON API is used as the primary source (no API key required).
"""

import json
import logging
import time
import urllib.request
import urllib.error
from pathlib import Path

logger = logging.getLogger(__name__)

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
REQUEST_TIMEOUT = 60
MAX_SERIES_PER_REQUEST = 45
BLS_START_YEAR = "2015"
BLS_END_YEAR = "2023"


def _bls_post(payload: dict) -> dict:
    """POST to BLS API and return parsed JSON."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BLS_API_URL, data=data, headers={
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
    })
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        return json.loads(resp.read())


def _fetch_bls_series(series_ids: list[str], name: str) -> Path | None:
    """Fetch a batch of BLS series and save as JSON."""
    filepath = RAW_DIR / "bls" / f"{name}.json"
    if filepath.exists() and filepath.stat().st_size > 100:
        logger.info(f"Skip existing: {name}.json")
        return filepath

    all_data = {}
    for i in range(0, len(series_ids), MAX_SERIES_PER_REQUEST):
        batch = series_ids[i:i + MAX_SERIES_PER_REQUEST]
        payload = {
            "seriesid": batch,
            "startyear": BLS_START_YEAR,
            "endyear": BLS_END_YEAR,
        }
        try:
            result = _bls_post(payload)
            if result.get("status") == "REQUEST_SUCCEEDED":
                for series in result["Results"]["series"]:
                    sid = series["seriesID"]
                    all_data[sid] = series["data"]
            else:
                logger.warning(f"BLS API error for {name}: {result.get('message', 'unknown')}")
        except Exception as exc:
            logger.error(f"BLS batch failed for {name}: {exc}")
            return None

    if all_data:
        filepath.write_text(json.dumps(all_data, indent=2), encoding="utf-8")
        logger.info(f"Saved {filepath} ({len(all_data)} series)")
        return filepath
    return None


def _build_laus_state_series(series_code: str) -> list[str]:
    """Build LAUS series IDs for all 50 states + DC + PR."""
    state_fips = [
        "01","02","04","05","06","08","09","10","11","12",
        "13","15","16","17","18","19","20","21","22","23",
        "24","25","26","27","28","29","30","31","32","33",
        "34","35","36","37","38","39","40","41","42","44",
        "45","46","47","48","49","50","51","53","54","55",
        "56","72",
    ]
    return [f"LAUST{fips}0000000000{series_code}" for fips in state_fips]


def download_bls_data() -> dict[str, Path]:
    """Download BLS economic data via JSON API."""
    logger.info("--- BLS Economic Data (JSON API) ---")
    results = {}

    # LAUS Unemployment Rate (seasonally adjusted, monthly)
    ids = _build_laus_state_series("003")
    ids.append("LAUSM000000000000003")  # National
    p = _fetch_bls_series(ids, "laus_unemployment_rate")
    if p:
        results["laus_unemployment_rate"] = p

    # LAUS Labor Force (monthly)
    ids = _build_laus_state_series("006")
    ids.append("LAUSM000000000000006")
    p = _fetch_bls_series(ids, "laus_labor_force")
    if p:
        results["laus_labor_force"] = p

    # LAUS Employment Level (monthly)
    ids = _build_laus_state_series("009")
    ids.append("LAUSM000000000000009")
    p = _fetch_bls_series(ids, "laus_employment")
    if p:
        results["laus_employment"] = p

    # CPI - All items
    p = _fetch_bls_series(["CUSR0000SA0"], "cpi_all_items")
    if p:
        results["cpi_all_items"] = p

    # CPI - Food
    p = _fetch_bls_series(["CUSR0000SAF11"], "cpi_food")
    if p:
        results["cpi_food"] = p

    # CPI - Energy
    p = _fetch_bls_series(["CUSR0000SAG"], "cpi_less_food_energy")
    if p:
        results["cpi_less_food_energy"] = p

    # CES - Total Nonfarm Employment
    p = _fetch_bls_series([
        "CES0000000001",   # All employees, thousands
        "CES0000000003",   # Production employees, thousands
        "CES0000000008",   # Avg weekly hours
        "CES0000000011",   # All employees, goods-producing
        "CES0000000014",   # All employees, service-providing
    ], "ces_national")
    if p:
        results["ces_national"] = p

    # CES - State employment (monthly, not seasonally adjusted)
    state_ces_ids = []
    for fips in ["01","02","04","05","06","08","09","10","12","13",
                 "15","16","17","18","19","20","21","22","23","24",
                 "25","26","27","28","29","30","31","32","33","34",
                 "35","36","37","38","39","40","41","42","44","45",
                 "46","47","48","49","50","51","53","54","55","56"]:
        state_ces_ids.append(f"CES{fips}0000000101")
    p = _fetch_bls_series(state_ces_ids, "ces_state_employment")
    if p:
        results["ces_state_employment"] = p

    return results


def run_economy_download() -> dict[str, dict[str, Path]]:
    """Execute the complete download pipeline for Economy & Employment datasets."""
    results: dict[str, dict[str, Path]] = {}

    logger.info("=" * 60)
    logger.info("ECONOMY & EMPLOYMENT DATA ACQUISITION")
    logger.info("=" * 60)

    results["bls"] = download_bls_data()

    logger.info("\n" + "=" * 60)
    logger.info("ECONOMY DOWNLOAD COMPLETE")
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
    run_economy_download()
