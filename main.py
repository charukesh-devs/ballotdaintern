"""
main.py - Pipeline Orchestrator (Multi-Domain)

Complete automated data acquisition pipeline for the America250 Data Warehouse.
Domains:
  1. Demographics & Census - Population, age, race, migration, households
  2. Economy & Employment - GDP, income, inflation, unemployment, wages

Executes the full ETL workflow:
1. Download - Acquire data from Census Bureau, BEA, and BLS
2. Validate - Quality checks and reporting
3. Clean   - Standardize and transform
4. Export  - Generate the final Excel workbook
"""

import sys
import logging
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "scripts"))

from download import run_download_pipeline
from download_economy import run_economy_download
from validate import validate_all_raw_files, ValidationReport
from clean import run_cleaning_pipeline, RAW_DIR
from clean_economy import run_economy_cleaning
from export_excel import export_to_excel

PROJECT_DIR = Path(__file__).parent
PROCESSED_DIR = PROJECT_DIR / "processed"
LOG_DIR = PROJECT_DIR / "logs"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)


def setup_logging():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = LOG_DIR / f"pipeline_{timestamp}.log"

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"))
    root_logger.addHandler(console_handler)

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
    root_logger.addHandler(file_handler)

    return log_file


def step_download_demographics() -> dict:
    logger = logging.getLogger("pipeline.download.demographics")
    logger.info("=" * 60)
    logger.info("STEP 1A: DEMOGRAPHICS & CENSUS DATA ACQUISITION")
    logger.info("=" * 60)
    start = time.time()
    results = run_download_pipeline()
    elapsed = time.time() - start
    total_files = sum(len(files) for files in results.values())
    logger.info(f"Demographics download complete: {total_files} files in {elapsed:.1f}s")
    return results


def step_download_economy() -> dict:
    logger = logging.getLogger("pipeline.download.economy")
    logger.info("\n" + "=" * 60)
    logger.info("STEP 1B: ECONOMY & EMPLOYMENT DATA ACQUISITION")
    logger.info("=" * 60)
    start = time.time()
    results = run_economy_download()
    elapsed = time.time() - start
    total_files = sum(len(files) for files in results.values())
    logger.info(f"Economy download complete: {total_files} files in {elapsed:.1f}s")
    return results


def step_validate() -> list[ValidationReport]:
    logger = logging.getLogger("pipeline.validate")
    logger.info("\n" + "=" * 60)
    logger.info("STEP 2: DATA VALIDATION")
    logger.info("=" * 60)
    start = time.time()
    reports = validate_all_raw_files(RAW_DIR)
    elapsed = time.time() - start
    logger.info(f"Validation complete: {len(reports)} files checked in {elapsed:.1f}s")
    return reports


def step_clean() -> dict:
    logger = logging.getLogger("pipeline.clean")
    logger.info("\n" + "=" * 60)
    logger.info("STEP 3: DATA CLEANING & STANDARDIZATION")
    logger.info("=" * 60)
    start = time.time()

    # Clean Demographics data
    logger.info("\n--- Demographics & Census ---")
    demo_datasets = run_cleaning_pipeline(RAW_DIR)

    # Clean Economy data
    logger.info("\n--- Economy & Employment ---")
    econ_datasets = run_economy_cleaning(RAW_DIR)

    # Merge all datasets
    all_datasets = {**demo_datasets, **econ_datasets}

    elapsed = time.time() - start
    logger.info(f"\nCleaning complete: {len(all_datasets)} datasets in {elapsed:.1f}s")
    return all_datasets


def step_export(datasets: dict, validation_reports: list[ValidationReport]) -> Path:
    logger = logging.getLogger("pipeline.export")
    logger.info("\n" + "=" * 60)
    logger.info("STEP 4: EXCEL WORKBOOK GENERATION")
    logger.info("=" * 60)
    start = time.time()
    output_path = export_to_excel(datasets, validation_reports)
    elapsed = time.time() - start
    logger.info(f"Export complete in {elapsed:.1f}s")
    return output_path


def run_pipeline(skip_download: bool = False) -> Path:
    log_file = setup_logging()
    logger = logging.getLogger("pipeline")

    logger.info("AMERICA250 DATA WAREHOUSE - MULTI-DOMAIN PIPELINE")
    logger.info("=" * 60)
    logger.info("Domain 1: Demographics & Census (U.S. Census Bureau)")
    logger.info("Domain 2: Economy & Employment (BEA, BLS)")
    logger.info("=" * 60)
    logger.info(f"Raw data: {RAW_DIR}")
    logger.info(f"Output: {PROCESSED_DIR / 'Demographics_Data.xlsx'}")
    logger.info(f"Log file: {log_file}")

    pipeline_start = time.time()

    try:
        if skip_download:
            logger.info("Skipping download steps (using existing raw data)")
        else:
            step_download_demographics()
            step_download_economy()

        validation_reports = step_validate()
        datasets = step_clean()
        output_path = step_export(datasets, validation_reports)

        total_time = time.time() - pipeline_start
        logger.info("\n" + "=" * 60)
        logger.info("PIPELINE COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Output file: {output_path}")
        if output_path.exists():
            logger.info(f"File size: {output_path.stat().st_size / 1024:.1f} KB")
        logger.info(f"Total runtime: {total_time:.1f} seconds")

        # Summary by domain
        logger.info(f"\nDatasets included ({len(datasets)} total):")
        for name, df in datasets.items():
            domain = "Economy" if "BEA" in name or "BLS" in name else "Demographics"
            logger.info(f"  [{domain:12s}] {name:40s}  {len(df):>8,} rows  {len(df.columns):>4} cols")

        return output_path

    except Exception as exc:
        logger.error(f"Pipeline failed: {exc}", exc_info=True)
        raise


if __name__ == "__main__":
    skip = "--skip-download" in sys.argv
    output = run_pipeline(skip_download=skip)
    print(f"\nDone! Output: {output}")
