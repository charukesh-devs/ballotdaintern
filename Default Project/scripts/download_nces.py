import json
import requests
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "raw" / "nces"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def download_school_district_finances():
    url = "https://nces.ed.gov/ccd/elsi/tableGenerator.aspx"
    params = {
        "filename": "district_finance",
        "format": "json",
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "district_finances.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


def download_enrollment():
    url = "https://nces.ed.gov/ccd/elsi/tableGenerator.aspx"
    params = {
        "filename": "enrollment",
        "format": "json",
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "enrollment.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


if __name__ == "__main__":
    download_school_district_finances()
    download_enrollment()
