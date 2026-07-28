"""Extract per-state economy data from the Excel workbook into JSON for the dashboard."""
import pandas as pd
import json
from pathlib import Path

WB = Path(__file__).parent.parent / "economy_employment_workbook.xlsx"
OUT = Path(__file__).parent / "dashboard-app" / "public" / "economy.json"

STATE_NAMES = {
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
}

STATE_ABBR = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY",
}


def safe_float(v):
    try:
        return float(v)
    except (ValueError, TypeError):
        return 0.0


def safe_int(v):
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return 0


def extract():
    print("Reading workbook...")
    xls = pd.ExcelFile(WB)

    # ── GDP by State ──────────────────────────────────────────────────
    gdp_raw = pd.read_excel(xls, sheet_name="GDP by State", skiprows=2)
    gdp_raw.columns = gdp_raw.iloc[0]
    gdp_raw = gdp_raw[1:].reset_index(drop=True)
    gdp_raw.columns = [str(c) for c in gdp_raw.columns]

    # Build per-state GDP dict: {fips: {year_str: value, ...}}
    state_gdp = {}
    for _, row in gdp_raw.iterrows():
        fips_raw = str(row["GeoFIPS"]).strip()
        if len(fips_raw) < 5:
            continue
        fips = fips_raw[:2]
        if fips not in STATE_NAMES:
            continue
        gdp_series = {}
        for col in gdp_raw.columns:
            try:
                yr = int(float(col))
                if 1997 <= yr <= 2025:
                    gdp_series[str(yr)] = safe_float(row[col])
            except (ValueError, TypeError):
                continue
        state_gdp[fips] = gdp_series

    print(f"  GDP by State: {len(state_gdp)} states")

    # ── Personal Income (SAINC1) ─────────────────────────────────────
    pi = pd.read_excel(xls, sheet_name="SAINC1")

    state_income = {}
    state_population = {}
    state_percapita = {}

    # Normalize GeoFIPS to string for matching
    pi["GeoFIPS_str"] = pi["GeoFIPS"].astype(str).str.strip().str.zfill(5)

    for fips_code in STATE_NAMES:
        fips5 = fips_code + "000"
        row_data = pi[pi["GeoFIPS_str"] == fips5]
        if row_data.empty:
            continue

        income_series = {}
        pop_series = {}
        percap_series = {}

        # Multiple rows per state (LineCode 1,2,3)
        for _, r in row_data.iterrows():
            lc = safe_int(r["LineCode"])
            for col in pi.columns:
                try:
                    yr = int(float(col))
                    if 2018 <= yr <= 2025:
                        yr_str = str(yr)
                        if lc == 1:
                            income_series[yr_str] = safe_float(r[col])
                        elif lc == 2:
                            pop_series[yr_str] = safe_int(r[col])
                        elif lc == 3:
                            percap_series[yr_str] = safe_int(r[col])
                except (ValueError, TypeError):
                    continue

        state_income[fips_code] = income_series
        state_population[fips_code] = pop_series
        state_percapita[fips_code] = percap_series

    print(f"  Personal Income: {len(state_income)} states")

    # ── Unemployment Rate by State ───────────────────────────────────
    ue = pd.read_excel(xls, sheet_name="Unemployment Rate")
    ue["unemployment_rate"] = pd.to_numeric(ue["unemployment_rate"], errors="coerce")

    STATE_NAME_TO_FIPS = {v: k for k, v in STATE_NAMES.items()}

    state_unemployment = {}
    for state_name, grp in ue.groupby("state"):
        fips = STATE_NAME_TO_FIPS.get(state_name)
        if not fips:
            continue
        yearly = grp.groupby("year")["unemployment_rate"].mean()
        series = {}
        for yr, val in yearly.items():
            yr_int = int(yr)
            if 2018 <= yr_int <= 2025:
                series[str(yr_int)] = round(float(val), 1)
        state_unemployment[fips] = series

    print(f"  Unemployment Rate: {len(state_unemployment)} states")

    # ── Employment by Industry (national) ────────────────────────────
    emp = pd.read_excel(xls, sheet_name="Employment by Industry")
    emp["employment_thousands"] = pd.to_numeric(emp["employment_thousands"], errors="coerce")
    national_emp = {}
    for industry, grp in emp.groupby("industry"):
        yearly = grp.groupby("year")["employment_thousands"].mean()
        series = {}
        for yr, val in yearly.items():
            yr_int = int(yr)
            if 2018 <= yr_int <= 2025:
                series[str(yr_int)] = round(float(val), 0)
        national_emp[industry] = series

    print(f"  Employment by Industry: {len(national_emp)} industries")

    # ── CPI (national) ──────────────────────────────────────────────
    cpi = pd.read_excel(xls, sheet_name="CPI")
    cpi["cpi_value"] = pd.to_numeric(cpi["cpi_value"], errors="coerce")
    national_cpi = {}
    for series_name, grp in cpi.groupby("series"):
        yearly = grp.groupby("year")["cpi_value"].mean()
        s = {}
        for yr, val in yearly.items():
            yr_int = int(yr)
            if 2018 <= yr_int <= 2025:
                s[str(yr_int)] = round(float(val), 1)
        national_cpi[series_name] = s

    print(f"  CPI: {len(national_cpi)} series")

    # ── Build per-state records ─────────────────────────────────────
    states = {}
    for fips, name in STATE_NAMES.items():
        gdp_series = state_gdp.get(fips, {})
        years = sorted(gdp_series.keys())

        gdp_latest = gdp_series.get("2024", gdp_series.get("2023", 0))
        gdp_prev = gdp_series.get("2023", gdp_series.get("2022", 0))
        gdp_growth = round((gdp_latest - gdp_prev) / gdp_prev * 100, 1) if gdp_prev > 0 else 0

        # Unemployment time series (fill gaps)
        ue_series = state_unemployment.get(fips, {})

        # Personal income
        pi_series = state_income.get(fips, {})
        pi_latest = pi_series.get("2024", pi_series.get("2023", 0))

        # Per capita income
        pc_series = state_percapita.get(fips, {})
        pc_latest = pc_series.get("2024", pc_series.get("2023", 0))

        states[fips] = {
            "name": name,
            "abbr": STATE_ABBR.get(fips, fips),
            "fips": fips,
            "gdp_millions": gdp_series,
            "gdp_latest": gdp_latest,
            "gdp_growth_pct": gdp_growth,
            "personal_income_millions": pi_series,
            "per_capita_income": pc_series,
            "unemployment": ue_series,
            "per_capita_income_latest": pc_latest,
        }

    # Add GDP rank
    ranked = sorted(states.values(), key=lambda s: s["gdp_latest"], reverse=True)
    for i, st in enumerate(ranked):
        st["gdp_rank"] = i + 1

    output = {
        "metadata": {
            "title": "U.S. State Economic Indicators",
            "sources": [
                "U.S. Bureau of Economic Analysis (BEA) — GDP & Personal Income",
                "U.S. Bureau of Labor Statistics (BLS) — Unemployment Rate",
                "National CPI, Employment by Industry from workbook",
            ],
            "generated": "2026-07-28",
            "data_from_excel": True,
        },
        "states": {st["fips"]: st for st in ranked},
        "national": {
            "employment_by_industry": national_emp,
            "cpi": national_cpi,
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"\nWritten {len(states)} states to {OUT}")
    print(f"File size: {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    extract()
