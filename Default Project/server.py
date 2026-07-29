import json
import subprocess
import sys
from pathlib import Path
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder="dashboard", static_url_path="")

BASE_DIR = Path(__file__).parent
PROCESSED_DIR = BASE_DIR / "processed"
SCRIPTS_DIR = BASE_DIR / "scripts"


def load_data():
    csv_path = PROCESSED_DIR / "america250_allstates.csv"
    if not csv_path.exists():
        return {"error": "No data found. Run 'python scripts/clean_and_merge.py' first."}

    import csv
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            r["population"] = int(r["population"])
            r["gdp"] = float(r["gdp"])
            r["housing"] = float(r["housing"])
            rows.append(r)
    return rows


@app.route("/")
def index():
    return send_from_directory("dashboard", "index.html")


@app.route("/api/data")
def api_data():
    return jsonify(load_data())


@app.route("/api/refresh")
def api_refresh():
    if not (SCRIPTS_DIR / "clean_and_merge.py").exists():
        return jsonify({"error": "clean_and_merge.py not found"}), 404
    result = subprocess.run(
        [sys.executable, str(SCRIPTS_DIR / "clean_and_merge.py")],
        capture_output=True, text=True, cwd=BASE_DIR
    )
    if result.returncode != 0:
        return jsonify({"error": result.stderr}), 500
    return jsonify({"message": "Data refreshed", "output": result.stdout})


@app.route("/api/sources")
def api_sources():
    return jsonify([
        {"name": "Census", "agency": "Census", "years": "1900-2025", "status": "Complete"},
        {"name": "GDP", "agency": "BEA", "years": "1963-2025", "status": "In Progress"},
        {"name": "Housing", "agency": "FHFA", "years": "1975-2025", "status": "Complete"},
        {"name": "Elections", "agency": "FEC", "years": "1980-2024", "status": "Pending"},
        {"name": "Agriculture", "agency": "USDA", "years": "1950-2025", "status": "In Progress"},
        {"name": "Rivers", "agency": "USGS", "years": "Current", "status": "Pending"},
    ])


if __name__ == "__main__":
    print("=" * 60)
    print("  America250 Data Dashboard")
    print("=" * 60)
    print(f"  Frontend: http://127.0.0.1:5000")
    print(f"  API:      http://127.0.0.1:5000/api/data")
    print(f"  Refresh:  http://127.0.0.1:5000/api/refresh")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
