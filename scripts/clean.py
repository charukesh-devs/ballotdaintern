"""
clean.py - Data Cleaning and Standardization

Cleans and standardizes Census Bureau datasets:
- PEP CSV files
- Gazetteer ZIP files
- TIGER/Line ZIP files
- ACS fixed-width .dat files
- Decennial Census fixed-width files
- Standardizes column names
- Removes duplicates
- Handles missing values
- Preserves GEOID/FIPS columns
"""

import csv
import io
import json
import logging
import re
import zipfile
from pathlib import Path
from typing import Any
from datetime import datetime

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

RAW_DIR = Path(__file__).parent.parent / "raw"
PROCESSED_DIR = Path(__file__).parent.parent / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


# ── Column Name Standardization ────────────────────────────────────────────────

PEP_COLUMN_MAP = {
    "SUMLEV": "Summary_Level",
    "REGION": "Region",
    "DIVISION": "Division",
    "STATE": "State_FIPS",
    "COUNTY": "County_FIPS",
    "STNAME": "State_Name",
    "CTYNAME": "County_Name",
    "NAME": "Name",
    "ESTIMATESBASE2020": "Estimates_Base_2020",
    "POPESTIMATE2020": "Pop_Estimate_2020",
    "POPESTIMATE2021": "Pop_Estimate_2021",
    "POPESTIMATE2022": "Pop_Estimate_2022",
    "POPESTIMATE2023": "Pop_Estimate_2023",
    "NPOPCHG_2020": "Pop_Change_2020",
    "NPOPCHG_2021": "Pop_Change_2021",
    "NPOPCHG_2022": "Pop_Change_2022",
    "NPOPCHG_2023": "Pop_Change_2023",
    "NPOPCHG2020": "Pop_Change_2020",
    "NPOPCHG2021": "Pop_Change_2021",
    "NPOPCHG2022": "Pop_Change_2022",
    "NPOPCHG2023": "Pop_Change_2023",
    "BIRTHS2020": "Births_2020",
    "BIRTHS2021": "Births_2021",
    "BIRTHS2022": "Births_2022",
    "BIRTHS2023": "Births_2023",
    "DEATHS2020": "Deaths_2020",
    "DEATHS2021": "Deaths_2021",
    "DEATHS2022": "Deaths_2022",
    "DEATHS2023": "Deaths_2023",
    "NATURALCHG2020": "Natural_Change_2020",
    "NATURALCHG2021": "Natural_Change_2021",
    "NATURALCHG2022": "Natural_Change_2022",
    "NATURALCHG2023": "Natural_Change_2023",
    "DOMESTICMIG2020": "Domestic_Migration_2020",
    "DOMESTICMIG2021": "Domestic_Migration_2021",
    "DOMESTICMIG2022": "Domestic_Migration_2022",
    "DOMESTICMIG2023": "Domestic_Migration_2023",
    "INTERNATIONALMIG2020": "Intl_Migration_2020",
    "INTERNATIONALMIG2021": "Intl_Migration_2021",
    "INTERNATIONALMIG2022": "Intl_Migration_2022",
    "INTERNATIONALMIG2023": "Intl_Migration_2023",
    "NETMIG2020": "Net_Migration_2020",
    "NETMIG2021": "Net_Migration_2021",
    "NETMIG2022": "Net_Migration_2022",
    "NETMIG2023": "Net_Migration_2023",
    "RBIRTH2023": "Birth_Rate_2023",
    "RDEATH2023": "Death_Rate_2023",
    "RNATURALCHG2023": "Natural_Change_Rate_2023",
    "RDOMESTICMIG2023": "Domestic_Migration_Rate_2023",
    "RINTERNATIONALMIG2023": "Intl_Migration_Rate_2023",
    "RNETMIG2023": "Net_Migration_Rate_2023",
    "POPDENSITY2020": "Pop_Density_2020",
    "POPDENSITY2023": "Pop_Density_2023",
    "REGIONMI": "RegionMI",
    "DIVISIONMI": "DivisionMI",
    "STATEMI": "StateMI",
}

GAZETTEER_COLUMN_MAP = {
    "GEOID": "GEOID",
    "GEOIDQ": "GEOID_Qualifier",
    "NAME": "Name",
    "ALAND": "Land_Area_SqM",
    "AWATER": "Water_Area_SqM",
    "ALAND_SQMI": "Land_Area_SqMi",
    "AWATER_SQMI": "Water_Area_SqMi",
    "INTPTLAT": "Latitude",
    "INTPTLONG": "Longitude",
    "FUNCSTAT": "Functional_Status",
    "MTFCC": "MTFCC_Code",
    "LSAD": "Legal/Statistical_Area_Description_Code",
    "CLASSFP": "FIPS_Class_Code",
}


def standardize_column_name(col: str, mapping: dict | None = None) -> str:
    """Standardize a column name using a mapping or general rules."""
    if mapping and col in mapping:
        return mapping[col]
    c = col.strip()
    c = re.sub(r"[\s\-/()]+", "_", c)
    c = re.sub(r"[^a-zA-Z0-9_]", "", c)
    c = re.sub(r"_+", "_", c)
    c = c.strip("_")
    return c


# ── Processing Functions ──────────────────────────────────────────────────────

def process_pep_csv(filepath: Path) -> pd.DataFrame:
    """Process a PEP CSV file."""
    logger.info(f"Processing PEP: {filepath.name}")
    try:
        df = pd.read_csv(filepath, encoding="utf-8", low_memory=False)
    except UnicodeDecodeError:
        df = pd.read_csv(filepath, encoding="latin-1", low_memory=False)

    # Standardize column names
    df = df.rename(columns={c: standardize_column_name(c, PEP_COLUMN_MAP) for c in df.columns})

    # Convert numeric columns
    for col in df.columns:
        if col not in ("State_Name", "County_Name", "Name", "STNAME", "CTYNAME"):
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Remove exact duplicates
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    if removed:
        logger.info(f"  Removed {removed} duplicates")

    logger.info(f"  {len(df)} rows, {len(df.columns)} columns")
    return df


def process_gazetteer_zip(filepath: Path) -> pd.DataFrame:
    """Process a Gazetteer ZIP file."""
    logger.info(f"Processing Gazetteer: {filepath.name}")
    try:
        with zipfile.ZipFile(filepath, "r") as z:
            txt_files = [n for n in z.namelist() if n.endswith(".txt")]
            if not txt_files:
                txt_files = [n for n in z.namelist() if n.endswith(".csv") or n.endswith(".tsv")]
            if not txt_files:
                logger.warning(f"  No data files found in {filepath.name}")
                return pd.DataFrame()

            with z.open(txt_files[0]) as f:
                content = f.read()
                # Try different encodings
                for enc in ("utf-8", "latin-1", "cp1252"):
                    try:
                        text = content.decode(enc)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    text = content.decode("latin-1")

                # Detect separator
                first_line = text.split("\n")[0]
                if "\t" in first_line:
                    sep = "\t"
                else:
                    sep = ","

                df = pd.read_csv(io.StringIO(text), sep=sep, low_memory=False, on_bad_lines="skip")

    except Exception as exc:
        logger.error(f"  Failed to process {filepath.name}: {exc}")
        return pd.DataFrame()

    # Standardize column names
    df = df.rename(columns={c: standardize_column_name(c, GAZETTEER_COLUMN_MAP) for c in df.columns})

    # Remove duplicates
    df = df.drop_duplicates()

    logger.info(f"  {len(df)} rows, {len(df.columns)} columns")
    return df


def process_tiger_zip(filepath: Path) -> pd.DataFrame:
    """Process a TIGER/Line ZIP file - extract the DBF/attributes."""
    logger.info(f"Processing TIGER: {filepath.name}")
    try:
        import geopandas as gpd
        gdf = gpd.read_file(filepath)
        df = pd.DataFrame(gdf.drop(columns=["geometry"], errors="ignore"))
    except ImportError:
        # Fallback: extract and read the DBF file
        try:
            with zipfile.ZipFile(filepath, "r") as z:
                dbf_files = [n for n in z.namelist() if n.endswith(".dbf")]
                if dbf_files:
                    try:
                        from dbfread import DBF
                        with z.open(dbf_files[0]) as f:
                            import tempfile
                            with tempfile.NamedTemporaryFile(suffix=".dbf", delete=False) as tmp:
                                tmp.write(f.read())
                                tmp_path = tmp.name
                        table = DBF(tmp_path)
                        df = pd.DataFrame(list(table))
                    except ImportError:
                        # No dbfread, try basic binary parsing
                        logger.warning(f"  Cannot parse DBF without geopandas or dbfread: {filepath.name}")
                        df = pd.DataFrame()
                else:
                    df = pd.DataFrame()
        except Exception as exc:
            logger.error(f"  Failed: {exc}")
            df = pd.DataFrame()
    except Exception as exc:
        logger.error(f"  Failed: {exc}")
        df = pd.DataFrame()

    if not df.empty:
        # Standardize GEOID and key columns
        for col in df.columns:
            if "GEOID" in col.upper() or "FIPS" in col.upper():
                df[col] = df[col].astype(str).str.strip()
        df = df.drop_duplicates()
        logger.info(f"  {len(df)} rows, {len(df.columns)} columns")
    return df


def process_acs_dat(filepath: Path, geo_file: Path | None = None) -> pd.DataFrame:
    """
    Process an ACS table-based summary file (.dat format).
    These files are pipe-delimited with columns like GEO_ID|B01001_E001|B01001_M001|...
    """
    logger.info(f"Processing ACS: {filepath.name}")
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            first_line = f.readline()
            if "|" in first_line:
                sep = "|"
            elif "," in first_line:
                sep = ","
            elif "\t" in first_line:
                sep = "\t"
            else:
                sep = ","

        df = pd.read_csv(filepath, sep=sep, low_memory=False, on_bad_lines="skip",
                          encoding="utf-8", dtype=str)

        # Keep only estimate columns (E suffix), drop margin of error (M suffix)
        estimate_cols = [c for c in df.columns if c.endswith("E") or c == "GEO_ID" or c == "id"]
        if len(estimate_cols) > 2:
            df = df[estimate_cols]

        # Rename columns to be more descriptive
        new_cols = []
        for col in df.columns:
            col_str = str(col).strip()
            if col_str == "GEO_ID" or col_str == "id":
                col_str = "GEOID"
            else:
                # B01001_E001 -> B01001_001E (Estimate)
                col_str = col_str.replace("_E", "_")
            new_cols.append(col_str)
        df.columns = new_cols

        # Convert estimate columns to numeric
        for col in df.columns:
            if col != "GEOID":
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Extract GEOID components from the GEO_ID field
        if "GEOID" in df.columns and df["GEOID"].dtype == object:
            # GEO_ID format: "0400000US06" -> extract state FIPS
            sample = df["GEOID"].iloc[0] if len(df) > 0 else ""
            if sample.startswith("040") or sample.startswith("160") or sample.startswith("050"):
                # Remove the prefix
                df["GEOID"] = df["GEOID"].str.replace(r"^0\d{5}", "", regex=True)

        df = df.drop_duplicates()
        logger.info(f"  {len(df)} rows, {len(df.columns)} columns")
        return df

    except Exception as exc:
        logger.error(f"  Failed to process {filepath.name}: {exc}")
        return pd.DataFrame()


def process_decennial_dat(filepath: Path, state_fips: str = "") -> pd.DataFrame:
    """
    Process a Decennial Census 2020 PL .dat file.
    These are fixed-width records with a specific layout.
    """
    logger.info(f"Processing Decennial: {filepath.name}")
    try:
        df = pd.read_csv(filepath, encoding="latin-1", header=None, low_memory=False,
                          on_bad_lines="skip")

        # PL94-171 layout:
        # Col 1-5: STUSAB (State abbreviation)
        # Col 6-9: SUMLEV
        # Col 10-12: GEOCOMP
        # Col 13-22: GEOID
        # Col 23-122: POP100, HU100, P1-P9 table data...

        if df.shape[1] >= 5:
            df.columns = [f"col_{i}" for i in range(df.shape[1])]
            df = df.rename(columns={
                "col_0": "STUSAB",
                "col_1": "SUMLEV",
                "col_2": "GEOCOMP",
                "col_3": "REGION",
                "col_4": "DIVISION",
            })

            # Extract state FIPS from first column if available
            if len(df.columns) > 6:
                df = df.rename(columns={df.columns[6]: "STATE_FIPS"})

        df = df.drop_duplicates()
        logger.info(f"  {len(df)} rows, {len(df.columns)} columns")
        return df

    except Exception as exc:
        logger.error(f"  Failed to process {filepath.name}: {exc}")
        return pd.DataFrame()


# ── Domain Aggregation ────────────────────────────────────────────────────────

def aggregate_acs_domains(acs_datasets: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    """Group ACS datasets by demographic domain for the final workbook."""
    domain_datasets = {}

    # Map table IDs to domains
    table_domain_map = {
        "B01001": "Age",
        "B01002": "Age",
        "B02001": "Race",
        "B03001": "Ethnicity",
        "B03002": "Ethnicity",
        "B07003": "Migration",
        "B11001": "Households",
        "B11003": "Families",
        "B15003": "Education",
        "B16001": "Language",
        "B18101": "Disability",
        "B19001": "Household_Income",
        "B19013": "Household_Income",
        "B21001": "Veterans",
        "B25001": "Housing",
        "B25002": "Housing",
        "B25003": "Housing",
        "B25004": "Housing",
        "B25064": "Housing",
        "B25077": "Housing",
    }

    for table_id, df in acs_datasets.items():
        if table_id in ("geo", "shells"):
            continue
        domain = table_domain_map.get(table_id, table_id)
        if domain not in domain_datasets:
            domain_datasets[domain] = df
        # Could merge/concat here if needed

    return domain_datasets


# ── Lookup Tables ─────────────────────────────────────────────────────────────

def build_state_lookup() -> pd.DataFrame:
    """Build a state FIPS to name lookup table."""
    state_names = {
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
        "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming",
        "60": "American Samoa", "66": "Guam", "69": "Northern Mariana Islands",
        "72": "Puerto Rico", "78": "Virgin Islands",
    }
    state_abbrev = {
        "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
        "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
        "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
        "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
        "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
        "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
        "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
        "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
        "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
        "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
        "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR", "78": "VI",
    }
    return pd.DataFrame({
        "FIPS_Code": list(state_names.keys()),
        "State_Name": list(state_names.values()),
        "State_Abbreviation": [state_abbrev.get(k, "") for k in state_names.keys()],
    })


# ── Main Cleaning Pipeline ────────────────────────────────────────────────────

def run_cleaning_pipeline(raw_dir: Path | None = None) -> dict[str, pd.DataFrame]:
    """
    Execute the complete data cleaning pipeline.
    Returns a dictionary mapping worksheet names to DataFrames.
    """
    if raw_dir is None:
        raw_dir = RAW_DIR

    all_datasets: dict[str, pd.DataFrame] = {}

    logger.info("=" * 60)
    logger.info("DATA CLEANING AND STANDARDIZATION PIPELINE")
    logger.info("=" * 60)

    # 1. Process PEP data
    logger.info("\n--- Processing PEP Data ---")
    pep_dir = raw_dir / "pep"
    if pep_dir.exists():
        for csv_file in sorted(pep_dir.glob("*.csv")):
            df = process_pep_csv(csv_file)
            if not df.empty:
                if "state" in csv_file.name:
                    all_datasets["Population_Estimates"] = df
                elif "county" in csv_file.name:
                    all_datasets["PEP_County"] = df

    # 2. Process Gazetteer data (store individual, skip huge combined)
    logger.info("\n--- Processing Gazetteer Data ---")
    gaz_dir = raw_dir / "gazetteer"
    gaz_datasets = {}
    if gaz_dir.exists():
        for zip_file in sorted(gaz_dir.glob("*.zip")):
            df = process_gazetteer_zip(zip_file)
            if not df.empty:
                short_name = zip_file.stem.replace("2024_Gaz_", "").replace("_national", "")
                gaz_datasets[short_name] = df
                worksheet_name = f"Gazetteer_{short_name.title()}"
                all_datasets[worksheet_name] = df

    # 3. Process TIGER data
    logger.info("\n--- Processing TIGER Data ---")
    tiger_dir = raw_dir / "tiger"
    if tiger_dir.exists():
        for zip_file in sorted(tiger_dir.glob("*.zip")):
            df = process_tiger_zip(zip_file)
            if not df.empty:
                name = zip_file.stem.replace("tl_2023_", "").replace("us_", "").replace("tl_2023_", "")
                worksheet_name = f"TIGER_{name.title()}"
                all_datasets[worksheet_name] = df

    # 4. Process ACS data - only use domain-aggregated datasets
    logger.info("\n--- Processing ACS Data ---")
    acs_dir = raw_dir / "acs"
    acs_datasets = {}
    if acs_dir.exists():
        for dat_file in sorted(acs_dir.glob("*.dat")):
            df = process_acs_dat(dat_file)
            if not df.empty:
                table_name = dat_file.stem.replace("acsdt1y2023-", "")
                acs_datasets[table_name] = df

        # Save the geo file
        geo_files = list(acs_dir.glob("Geos*.txt"))
        if geo_files:
            try:
                geo_df = pd.read_csv(geo_files[0], sep="|", low_memory=False, on_bad_lines="skip")
                geo_df = geo_df.rename(columns={c: standardize_column_name(c) for c in geo_df.columns})
                all_datasets["ACS_Geography"] = geo_df
                logger.info(f"  ACS Geography: {len(geo_df)} rows")
            except Exception as exc:
                logger.warning(f"  Failed to parse ACS geography: {exc}")

        # Create domain-aggregated ACS datasets (no individual table duplicates)
        domain_data = aggregate_acs_domains(acs_datasets)
        for domain, df in domain_data.items():
            all_datasets[f"ACS_{domain}"] = df

    # 5. Build lookup tables
    logger.info("\n--- Building Lookup Tables ---")
    all_datasets["State_Lookup"] = build_state_lookup()

    # Extract county lookup from PEP county data
    if "PEP_County" in all_datasets:
        county_df = all_datasets["PEP_County"]
        if "State_FIPS" in county_df.columns and "County_FIPS" in county_df.columns:
            county_lookup = county_df[["State_FIPS", "County_FIPS", "State_Name", "County_Name"]].drop_duplicates()
            all_datasets["County_Lookup"] = county_lookup

    # 6. Create Population worksheet from PEP state data
    if "Population_Estimates" in all_datasets:
        pop_df = all_datasets["Population_Estimates"]
        if "Summary_Level" in pop_df.columns:
            state_pop = pop_df[pop_df["Summary_Level"].isin([10, 40])].copy()
            if not state_pop.empty:
                all_datasets["Population"] = state_pop

    logger.info("\n" + "=" * 60)
    logger.info("CLEANING PIPELINE COMPLETE")
    logger.info(f"Datasets produced: {len(all_datasets)}")
    for name, df in all_datasets.items():
        logger.info(f"  {name:40s}  {len(df):>8,} rows  {len(df.columns):>4} cols")
    logger.info("=" * 60)

    return all_datasets


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    datasets = run_cleaning_pipeline()
    for name, df in datasets.items():
        print(f"\n{name}: {df.shape}")
