import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("EIA_API_KEY")
BASE_URL = "https://api.eia.gov/v2/electricity/retail-sales/data/"
OUTPUT_DIR = Path(__file__).parent.parent / "raw" / "eia"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def download_electricity():
    params = {
        "api_key": API_KEY,
        "frequency": "annual",
        "data[0]": "price",
        "data[1]": "quantity",
        "facets[sectorid][]": "RES",  # Residential
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
    }
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()

    output_file = OUTPUT_DIR / "electricity.json"
    with open(output_file, "w") as f:
        json.dump(response.json(), f, indent=4)

    print(f"Saved: {output_file}")


if __name__ == "__main__":
    if not API_KEY:
        print("Error: Set EIA_API_KEY in .env file")
    else:
        download_electricity()
