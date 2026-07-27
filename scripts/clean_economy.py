"""
clean_economy.py - Economy & Employment Data Cleaning

Processes BLS JSON API data into clean DataFrames for Excel export.
"""

import json
import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

RAW_DIR = Path(__file__).parent.parent / "raw"

BLS_SERIES_NAMES = {
    "laus_unemployment_rate": "BLS_LAU_Unemployment_Rate",
    "laus_labor_force": "BLS_LAU_Labor_Force",
    "laus_employment": "BLS_LAU_Employment_Level",
    "cpi_all_items": "BLS_CPI_All_Items",
    "cpi_food": "BLS_CPI_Food",
    "cpi_less_food_energy": "BLS_CPI_Less_Food_Energy",
    "ces_national": "BLS_CES_National",
    "ces_state_employment": "BLS_CES_State_Employment",
}


def _bls_json_to_df(filepath: Path) -> pd.DataFrame:
    """Convert BLS JSON file to a flat DataFrame."""
    raw = json.loads(filepath.read_text(encoding="utf-8"))
    rows = []
    for series_id, data in raw.items():
        for obs in data:
            rows.append({
                "series_id": series_id,
                "year": int(obs["year"]),
                "period": obs["period"],
                "period_name": obs.get("periodName", ""),
                "value": float(obs["value"]),
            })
    df = pd.DataFrame(rows)
    df = df.sort_values(["series_id", "year", "period"]).reset_index(drop=True)
    return df


def _build_state_lookup() -> dict[str, str]:
    """Map state FIPS to names."""
    return {
        "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
        "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
        "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
        "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
        "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
        "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
        "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
        "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
        "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
        "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
        "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
        "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
        "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming", "72": "Puerto Rico",
    }


def _add_state_column(df: pd.DataFrame) -> pd.DataFrame:
    """Extract state FIPS from series_id and add State column."""
    lookup = _build_state_lookup()
    fips = df["series_id"].str[4:6]
    df["State"] = fips.map(lookup).fillna(fips)
    return df


def run_economy_cleaning(raw_dir: Path | None = None) -> dict[str, pd.DataFrame]:
    """Process all BLS JSON files into clean DataFrames."""
    if raw_dir is None:
        raw_dir = RAW_DIR

    all_datasets: dict[str, pd.DataFrame] = {}

    logger.info("=" * 60)
    logger.info("ECONOMY & EMPLOYMENT CLEANING PIPELINE")
    logger.info("=" * 60)

    bls_dir = raw_dir / "bls"
    if not bls_dir.exists():
        logger.warning("No BLS data directory found")
        return all_datasets

    for json_file in sorted(bls_dir.glob("*.json")):
        stem = json_file.stem
        sheet_name = BLS_SERIES_NAMES.get(stem, stem)
        logger.info(f"Processing: {json_file.name} -> {sheet_name}")

        df = _bls_json_to_df(json_file)
        if df.empty:
            continue

        # Add state names for state-level series
        if stem.startswith("laus_") or stem == "ces_state_employment":
            df = _add_state_column(df)

        all_datasets[sheet_name] = df
        logger.info(f"  {len(df):,} rows, {len(df.columns)} columns")

    logger.info("\n" + "=" * 60)
    logger.info("ECONOMY CLEANING COMPLETE")
    logger.info(f"Datasets produced: {len(all_datasets)}")
    for name, df in all_datasets.items():
        logger.info(f"  {name:40s}  {len(df):>8,} rows  {len(df.columns):>4} cols")
    logger.info("=" * 60)

    return all_datasets


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    datasets = run_economy_cleaning()
    for name, df in datasets.items():
        print(f"\n{name}: {df.shape}")
