import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("USDA_API_KEY")
BASE_URL = "https://quickstats.nass.usda.gov/api/api_GET/"
OUTPUT_DIR = Path(__file__).parent.parent / "raw" / "usda"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def download_corn():
    params = {
        "key": API_KEY,
        "commodity_desc": "CORN",
        "year__GE": 2020,
        "format": "JSON",
    }
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "corn.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


def download_soybeans():
    params = {
        "key": API_KEY,
        "commodity_desc": "SOYBEANS",
        "year__GE": 2020,
        "format": "JSON",
    }
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "soybeans.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


if __name__ == "__main__":
    if not API_KEY:
        print("Error: Set USDA_API_KEY in .env file")
    else:
        download_corn()
        download_soybeans()
