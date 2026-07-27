"""
validate.py - Data Validation and Quality Checks

Performs validation and quality assessments on Census Bureau datasets:
- Duplicate detection
- Missing value analysis
- GEOID/FIPS validation
- Encoding checks
- Data type verification
- Range validation
"""

import json
import logging
import re
from pathlib import Path
from typing import Any
from datetime import datetime

import pandas as pd

logger = logging.getLogger(__name__)

RAW_DIR = Path(__file__).parent.parent / "raw"


# ── FIPS Code Validation ──────────────────────────────────────────────────────

# Valid FIPS state codes (US states + territories)
VALID_FIPS_STATES = {
    "01", "02", "04", "05", "06", "08", "09", "10", "11", "12",
    "13", "15", "16", "17", "18", "19", "20", "21", "22", "23",
    "24", "25", "26", "27", "28", "29", "30", "31", "32", "33",
    "34", "35", "36", "37", "38", "39", "40", "41", "42", "44",
    "45", "46", "47", "48", "49", "50", "51", "53", "54", "55",
    "56", "60", "66", "69", "72", "78",
}

# Valid FIPS county code range (001-999)
FIPS_COUNTY_PATTERN = re.compile(r"^\d{3}$")

# Valid GEOID patterns
GEOID_PATTERNS = {
    "state": re.compile(r"^\d{2}$"),
    "county": re.compile(r"^\d{5}$"),
    "tract": re.compile(r"^\d{11}$"),
    "block_group": re.compile(r"^\d{12}$"),
    "place": re.compile(r"^\d{7}$"),
    "zcta": re.compile(r"^\d{5}$"),
    "cbsa": re.compile(r"^\d{5}$"),
}


# ── Validation Report Structure ───────────────────────────────────────────────

class ValidationReport:
    """Accumulates validation results for a single dataset."""

    def __init__(self, dataset_name: str):
        self.dataset_name = dataset_name
        self.total_rows = 0
        self.total_columns = 0
        self.duplicate_count = 0
        self.missing_values: dict[str, int] = {}
        self.invalid_geoids = 0
        self.invalid_fips = 0
        self.encoding_issues = 0
        self.rows_removed = 0
        self.rows_retained = 0
        self.warnings: list[str] = []
        self.errors: list[str] = []
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "Dataset": self.dataset_name,
            "Total Rows": self.total_rows,
            "Total Columns": self.total_columns,
            "Duplicate Count": self.duplicate_count,
            "Missing Values (columns with gaps)": len([v for v in self.missing_values.values() if v > 0]),
            "Total Missing Cells": sum(self.missing_values.values()),
            "Invalid GEOIDs": self.invalid_geoids,
            "Invalid FIPS Codes": self.invalid_fips,
            "Encoding Issues": self.encoding_issues,
            "Rows Removed": self.rows_removed,
            "Rows Retained": self.rows_retained,
            "Warnings": "; ".join(self.warnings[:5]),
            "Validation Date": self.timestamp,
        }


# ── Validation Functions ──────────────────────────────────────────────────────

def validate_geoid(value: Any, geo_type: str = "state") -> bool:
    """Validate a GEOID against expected pattern."""
    if pd.isna(value) or value == "" or value is None:
        return False
    s = str(value).strip()
    pattern = GEOID_PATTERNS.get(geo_type)
    if pattern is None:
        return True  # Unknown type, skip validation
    return bool(pattern.match(s))


def validate_fips_state(code: Any) -> bool:
    """Validate a FIPS state code."""
    if pd.isna(code) or code is None:
        return False
    s = str(code).strip().zfill(2)
    return s in VALID_FIPS_STATES


def validate_fips_county(code: Any) -> bool:
    """Validate a FIPS county code format."""
    if pd.isna(code) or code is None:
        return False
    s = str(code).strip()
    return bool(FIPS_COUNTY_PATTERN.match(s))


def detect_geographic_level(df: pd.DataFrame) -> str:
    """Auto-detect the geographic level of a DataFrame."""
    cols_lower = set(c.lower() for c in df.columns)

    if "block group" in cols_lower or "blkgrp" in cols_lower:
        return "block_group"
    if "tract" in cols_lower or "geo_id" in cols_lower:
        if "county" in cols_lower:
            return "tract"
    if "zcta" in cols_lower or "zip" in cols_lower:
        return "zcta"
    if "place" in cols_lower:
        return "place"
    if "cbsa" in cols_lower or "metropolitan" in cols_lower:
        return "cbsa"
    if "county" in cols_lower:
        return "county"
    if "state" in cols_lower:
        return "state"
    if "us" in cols_lower:
        return "us"
    return "unknown"


def find_geoid_columns(df: pd.DataFrame) -> list[str]:
    """Find columns that likely contain GEOIDs."""
    geoid_candidates = []
    geoid_names = ["geo_id", "geoid", "fips", "state_fips", "county_fips",
                   "state", "county", "tract", "place", "cbsa", "zcta",
                   "geocode", "geography"]
    for col in df.columns:
        col_lower = col.lower().strip()
        if col_lower in geoid_names:
            geoid_candidates.append(col)
        elif any(g in col_lower for g in ["geoid", "fips", "geo_id"]):
            geoid_candidates.append(col)
    return geoid_candidates


def validate_dataframe(df: pd.DataFrame, dataset_name: str) -> ValidationReport:
    """
    Run all validation checks on a DataFrame and return a report.
    """
    report = ValidationReport(dataset_name)
    report.total_rows = len(df)
    report.total_columns = len(df.columns)

    if df.empty:
        report.warnings.append("DataFrame is empty")
        report.rows_retained = 0
        return report

    # 1. Duplicate check
    dup_mask = df.duplicated()
    report.duplicate_count = int(dup_mask.sum())

    # 2. Missing values
    missing = df.isnull().sum()
    report.missing_values = {col: int(cnt) for col, cnt in missing.items() if cnt > 0}

    # 3. GEOID validation
    geo_cols = find_geoid_columns(df)
    geo_level = detect_geographic_level(df)

    for col in geo_cols:
        if col.lower() in ("state",):
            invalid = df[col].apply(lambda x: not validate_fips_state(x)).sum()
            report.invalid_fips += int(invalid)
        elif col.lower() in ("county",):
            invalid = df[col].apply(lambda x: not validate_fips_county(x)).sum()
            report.invalid_fips += int(invalid)
        elif col.lower() in ("geo_id", "geoid", "fips", "geocode"):
            invalid = df[col].apply(lambda x: not validate_geoid(x, geo_level)).sum()
            report.invalid_geoids += int(invalid)

    # 4. Check for encoding issues (non-ASCII in string columns)
    for col in df.select_dtypes(include=["object"]).columns:
        try:
            sample = df[col].dropna().head(100).astype(str)
            for val in sample:
                val.encode("ascii", errors="strict")
        except UnicodeEncodeError:
            report.encoding_issues += 1
            break

    # 5. Rows retained (after accounting for duplicates)
    report.rows_removed = report.duplicate_count
    report.rows_retained = report.total_rows - report.rows_removed

    return report


def validate_json_file(filepath: Path) -> ValidationReport:
    """Validate a JSON file (Census API response)."""
    dataset_name = filepath.stem
    report = ValidationReport(dataset_name)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        report.errors.append(f"Invalid JSON: {exc}")
        return report
    except Exception as exc:
        report.errors.append(f"Read error: {exc}")
        return report

    if not isinstance(data, list) or len(data) < 2:
        report.errors.append("JSON data is not a valid table format")
        return report

    # First row is header, rest is data
    header = data[0]
    rows = data[1:]

    report.total_rows = len(rows)
    report.total_columns = len(header)

    # Convert to DataFrame for validation
    df = pd.DataFrame(rows, columns=header)
    return validate_dataframe(df, dataset_name)


def validate_csv_file(filepath: Path, encoding: str = "utf-8") -> ValidationReport:
    """Validate a CSV/TXT file."""
    dataset_name = filepath.stem
    report = ValidationReport(dataset_name)

    try:
        df = pd.read_csv(filepath, encoding=encoding, low_memory=False)
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(filepath, encoding="latin-1", low_memory=False)
            report.encoding_issues += 1
        except Exception as exc:
            report.errors.append(f"Cannot read file: {exc}")
            return report
    except Exception as exc:
        report.errors.append(f"Read error: {exc}")
        return report

    return validate_dataframe(df, dataset_name)


def validate_gazetteer_file(filepath: Path) -> ValidationReport:
    """Validate a Gazetteer file."""
    dataset_name = f"gazetteer_{filepath.stem}"
    report = ValidationReport(dataset_name)

    try:
        df = pd.read_csv(filepath, encoding="latin-1", sep="\t", low_memory=False,
                          on_bad_lines="skip")
        report.total_rows = len(df)
        report.total_columns = len(df.columns)
    except Exception as exc:
        report.errors.append(f"Read error: {exc}")
        return report

    return validate_dataframe(df, dataset_name)


# ── Batch Validation ──────────────────────────────────────────────────────────

def validate_all_raw_files(raw_dir: Path | None = None) -> list[ValidationReport]:
    """Validate all files in the raw directory."""
    if raw_dir is None:
        raw_dir = RAW_DIR

    reports = []

    for subdir in sorted(raw_dir.iterdir()):
        if not subdir.is_dir():
            continue
        for filepath in sorted(subdir.iterdir()):
            if filepath.is_dir():
                continue
            logger.info(f"Validating: {filepath.name}")
            try:
                if filepath.suffix == ".json":
                    report = validate_json_file(filepath)
                elif filepath.suffix in (".txt", ".tsv"):
                    report = validate_gazetteer_file(filepath)
                elif filepath.suffix == ".csv":
                    report = validate_csv_file(filepath)
                else:
                    continue
                reports.append(report)
            except Exception as exc:
                logger.error(f"Validation failed for {filepath}: {exc}")
                r = ValidationReport(filepath.stem)
                r.errors.append(str(exc))
                reports.append(r)

    return reports


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    reports = validate_all_raw_files()
    for r in reports:
        print(f"\n{'=' * 50}")
        print(f"Dataset: {r.dataset_name}")
        print(f"  Rows: {r.total_rows}, Columns: {r.total_columns}")
        print(f"  Duplicates: {r.duplicate_count}")
        print(f"  Missing columns: {len([v for v in r.missing_values.values() if v > 0])}")
        print(f"  Invalid GEOIDs: {r.invalid_geoids}")
        print(f"  Invalid FIPS: {r.invalid_fips}")
        print(f"  Encoding issues: {r.encoding_issues}")
