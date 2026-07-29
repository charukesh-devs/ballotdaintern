import json
import requests
from pathlib import Path

BASE_URL = "https://data.cdc.gov/resource"
OUTPUT_DIR = Path(__file__).parent.parent / "raw" / "cdc"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def download_covid_cases():
    dataset_id = "9mf2-cz29"
    url = f"{BASE_URL}/{dataset_id}.json"
    params = {
        "$limit": 50000,
        "$order": "submission_date DESC",
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "covid_cases.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


def download_life_expectancy():
    dataset_id = "rv28-5yiw"
    url = f"{BASE_URL}/{dataset_id}.json"
    params = {"$limit": 50000}

    response = requests.get(url, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "life_expectancy.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


if __name__ == "__main__":
    download_covid_cases()
    download_life_expectancy()
