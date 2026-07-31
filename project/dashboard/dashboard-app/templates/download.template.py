"""
download_template.py - Data Acquisition Template

Copy this file as your download script. Follow the pattern:
1. Define URLs and filenames
2. Use _download_if_missing() for each file
3. Generate metadata.json after download

Replace YOUR_MODULE_ID, YOUR_DATASETS, and other placeholders.
"""

import hashlib
import json
import logging
import time
from datetime import datetime
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────────────────

MODULE_ID = "YOUR_MODULE_ID"  # e.g., "geography", "politics", "agriculture"

RAW_DIR = Path(__file__).parent.parent / "raw" / MODULE_ID
RAW_DIR.mkdir(parents=True, exist_ok=True)

RETRY_ATTEMPTS = 3
RETRY_DELAY = 2
REQUEST_TIMEOUT = 120

logger = logging.getLogger(__name__)

# ── Dataset Definitions ──────────────────────────────────────────────────────

# Each entry: (url, filename, dataset_name, description)
YOUR_DATASETS = [
    # Example:
    # ("https://example.gov/data/file.csv", "my_data.csv", "My Dataset", "Description of the dataset"),
]

# ── Download Helper ──────────────────────────────────────────────────────────

import urllib.request
import urllib.error


def _download(url: str, filename: str) -> Path | None:
    """Download with retry and return the path."""
    filepath = RAW_DIR / filename
    if filepath.exists() and filepath.stat().st_size > 0:
        logger.info(f"Skip existing: {filename}")
        return filepath

    for attempt in range(RETRY_ATTEMPTS):
        try:
            logger.info(f"Downloading {filename} (attempt {attempt + 1})...")
            req = urllib.request.Request(url, headers={
                "User-Agent": f"America250-{MODULE_ID}/1.0",
            })
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                data = resp.read()
            filepath.write_bytes(data)
            logger.info(f"Saved {filepath} ({len(data):,} bytes)")
            return filepath
        except Exception as exc:
            logger.warning(f"Attempt {attempt + 1} failed: {exc}")
            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))

    logger.error(f"Failed to download {filename} after {RETRY_ATTEMPTS} attempts")
    return None


def _sha256(filepath: Path) -> str:
    """Compute SHA-256 checksum of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ── Metadata Generation ─────────────────────────────────────────────────────

def generate_metadata(downloaded_files: list[tuple[Path, str, str]]):
    """Generate metadata.json for the module."""
    datasets = []
    for filepath, dataset_name, description in downloaded_files:
        if filepath is None:
            continue
        stat = filepath.stat()
        datasets.append({
            "dataset_name": dataset_name,
            "source_name": "U.S. Government Agency",
            "source_url": "",  # Fill in the actual source URL
            "download_date": datetime.now().strftime("%Y-%m-%d"),
            "update_frequency": "Annual",
            "years_covered": "Check source",
            "owner_agency": "U.S. Government",
            "license": "Public Domain",
            "description": description,
            "checksum_sha256": _sha256(filepath),
            "file_format": filepath.suffix.lstrip("."),
            "file_size_bytes": stat.st_size,
        })

    metadata = {
        "module_id": MODULE_ID,
        "module_name": MODULE_ID.replace("_", " ").title(),
        "owner": "YOUR_NAME",
        "created": datetime.now().strftime("%Y-%m-%d"),
        "datasets": datasets,
    }

    meta_path = RAW_DIR / "metadata.json"
    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    logger.info(f"Written metadata: {meta_path}")


# ── Main Pipeline ────────────────────────────────────────────────────────────

def run_download():
    """Download all datasets for this module."""
    logger.info(f"=== {MODULE_ID.upper()} DATA ACQUISITION ===")
    downloaded = []

    for url, filename, name, desc in YOUR_DATASETS:
        path = _download(url, filename)
        downloaded.append((path, name, desc))

    generate_metadata(downloaded)

    successful = sum(1 for p, _, _ in downloaded if p is not None)
    logger.info(f"Downloaded {successful}/{len(YOUR_DATASETS)} files")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    run_download()
