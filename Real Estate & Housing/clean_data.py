"""
America250 - Real Estate & Infrastructure Data Cleaner
=====================================================
Reads raw data files, cleans them, and saves to processed/<source>/ folders.
"""

import pandas as pd
import os
import re
import warnings
warnings.filterwarnings("ignore")

BASE = "C:/Users/You/Downloads/America250"
RAW = f"{BASE}/raw"
PROC = f"{BASE}/processed"

results = []


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def save(df, source, name):
    folder = f"{PROC}/{source}"
    ensure_dir(folder)
    path = f"{folder}/{name}.csv"
    df.to_csv(path, index=False)
    size_kb = os.path.getsize(path) / 1024
    results.append((source, name, len(df), len(df.columns), f"{size_kb:.1f} KB"))
    print(f"  {source}/{name}.csv  ({len(df)} rows x {len(df.columns)} cols, {size_kb:.1f} KB)")


def clean_col(c):
    c = str(c).strip().lower()
    c = re.sub(r"[^a-z0-9]+", "_", c)
    c = c.strip("_")
    return c


# ============================================================
# 1. FHFA HOUSE PRICE INDEX
# ============================================================
print("\n--- FHFA House Price Index ---")

# 1a. All-Transactions Metro (no header)
with open(f"{RAW}/fhfa/hpi_at_metro.txt", "r") as f:
    lines = f.readlines()

records = []
for line in lines:
    line = line.strip()
    if not line:
        continue
    m = re.match(r'"([^"]+)"\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+|-)\s+\(\s*([\d.]+|-)\s*\)', line)
    if m:
        metro, cbsa, yr, qtr, idx, err = m.groups()
        records.append({
            "metro_name": metro,
            "cbsa": int(cbsa),
            "year": int(yr),
            "quarter": int(qtr),
            "index_nsa": None if idx == "-" else float(idx),
            "std_error": None if err == "-" else float(err),
        })

hpi_metro = pd.DataFrame(records)
hpi_metro.dropna(subset=["index_nsa"], inplace=True)
hpi_metro.sort_values(["cbsa", "year", "quarter"], inplace=True)
hpi_metro.reset_index(drop=True, inplace=True)
save(hpi_metro, "fhfa", "hpi_metro_at")

# 1b. Expanded-Data State
hpi_state = pd.read_csv(f"{RAW}/fhfa/hpi_exp_state.txt", sep="\t", na_values=["-"])
hpi_state.columns = [clean_col(c) for c in hpi_state.columns]
hpi_state["yr"] = pd.to_numeric(hpi_state["yr"], errors="coerce").astype("Int64")
hpi_state["qtr"] = pd.to_numeric(hpi_state["qtr"], errors="coerce").astype("Int64")
hpi_state["index_nsa"] = pd.to_numeric(hpi_state["index_nsa"], errors="coerce")
hpi_state["index_sa"] = pd.to_numeric(hpi_state["index_sa"], errors="coerce")
hpi_state.dropna(subset=["index_nsa", "index_sa"], inplace=True)
hpi_state.sort_values(["state", "yr", "qtr"], inplace=True)
hpi_state.reset_index(drop=True, inplace=True)
save(hpi_state, "fhfa", "hpi_state_exp")

# 1c. Expanded-Data US & Census Divisions
hpi_us = pd.read_csv(f"{RAW}/fhfa/hpi_exp_us_and_census.txt", sep="\t", na_values=["-"])
hpi_us.columns = [clean_col(c) for c in hpi_us.columns]
hpi_us["yr"] = pd.to_numeric(hpi_us["yr"], errors="coerce").astype("Int64")
hpi_us["qtr"] = pd.to_numeric(hpi_us["qtr"], errors="coerce").astype("Int64")
hpi_us["index_nsa"] = pd.to_numeric(hpi_us["index_nsa"], errors="coerce")
hpi_us["index_sa"] = pd.to_numeric(hpi_us["index_sa"], errors="coerce")
hpi_us.dropna(subset=["index_nsa", "index_sa"], inplace=True)
hpi_us.sort_values(["cd", "yr", "qtr"], inplace=True)
hpi_us.reset_index(drop=True, inplace=True)
save(hpi_us, "fhfa", "hpi_us_census_divisions")

# 1d. Purchase-Only Metro
hpi_po = pd.read_csv(f"{RAW}/fhfa/hpi_po_metro.txt", sep="\t", na_values=["-"])
hpi_po.columns = [clean_col(c) for c in hpi_po.columns]
hpi_po["metro_name"] = hpi_po["metro_name"].str.strip('"')
hpi_po["cbsa"] = pd.to_numeric(hpi_po["cbsa"], errors="coerce").astype("Int64")
hpi_po["yr"] = pd.to_numeric(hpi_po["yr"], errors="coerce").astype("Int64")
hpi_po["qtr"] = pd.to_numeric(hpi_po["qtr"], errors="coerce").astype("Int64")
hpi_po["index_nsa"] = pd.to_numeric(hpi_po["index_nsa"], errors="coerce")
hpi_po["index_sa"] = pd.to_numeric(hpi_po["index_sa"], errors="coerce")
hpi_po.dropna(subset=["index_nsa", "index_sa"], inplace=True)
hpi_po.sort_values(["cbsa", "yr", "qtr"], inplace=True)
hpi_po.reset_index(drop=True, inplace=True)
save(hpi_po, "fhfa", "hpi_metro_po")


# ============================================================
# 2. FAA / OURAIRPORTS
# ============================================================
print("\n--- FAA Airport Data ---")

airports = pd.read_csv(f"{RAW}/faa/airports.csv", on_bad_lines="warn", quoting=3)
airports.columns = [clean_col(c) for c in airports.columns]
airports["latitude_deg"] = pd.to_numeric(airports["latitude_deg"], errors="coerce")
airports["longitude_deg"] = pd.to_numeric(airports["longitude_deg"], errors="coerce")
airports["elevation_ft"] = pd.to_numeric(airports["elevation_ft"], errors="coerce")
airports.dropna(subset=["latitude_deg", "longitude_deg"], inplace=True)
airports.reset_index(drop=True, inplace=True)
save(airports, "faa", "airports")

runways = pd.read_csv(f"{RAW}/faa/runways.csv", on_bad_lines="warn", quoting=3)
runways.columns = [clean_col(c) for c in runways.columns]
for col in ["length_ft", "width_ft"]:
    runways[col] = pd.to_numeric(runways[col], errors="coerce")
runways.dropna(subset=["length_ft"], inplace=True)
runways.reset_index(drop=True, inplace=True)
save(runways, "faa", "runways")

freq = pd.read_csv(f"{RAW}/faa/airport-frequencies.csv", on_bad_lines="warn", quoting=3)
freq.columns = [clean_col(c) for c in freq.columns]
freq.reset_index(drop=True, inplace=True)
save(freq, "faa", "airport_frequencies")


# ============================================================
# 3. NTD PUBLIC TRANSIT
# ============================================================
print("\n--- NTD Transit Data ---")

ntd_mode = pd.read_csv(f"{RAW}/ntd/ntd_service_by_mode_2024.csv")
ntd_mode.columns = [clean_col(c) for c in ntd_mode.columns]
ntd_mode.columns = [c.replace("max_", "") for c in ntd_mode.columns]
ntd_mode["report_year"] = pd.to_numeric(ntd_mode["report_year"], errors="coerce").astype("Int64")
ntd_mode.reset_index(drop=True, inplace=True)
save(ntd_mode, "ntd", "service_by_mode_2024")

ntd_agency = pd.read_csv(f"{RAW}/ntd/ntd_service_by_agency_2024.csv")
ntd_agency.columns = [clean_col(c) for c in ntd_agency.columns]
ntd_agency.columns = [c.replace("max_", "") for c in ntd_agency.columns]
ntd_agency["report_year"] = pd.to_numeric(ntd_agency["report_year"], errors="coerce").astype("Int64")
ntd_agency.reset_index(drop=True, inplace=True)
save(ntd_agency, "ntd", "service_by_agency_2024")


# ============================================================
# 4. FHWA HIGHWAY DATA
# ============================================================
print("\n--- FHWA Highway Data ---")


def read_fhwa_excel(filename, header_rows, data_start_row):
    df_raw = pd.read_excel(f"{RAW}/fhwa/{filename}", sheet_name="A", header=None)
    headers = []
    for col_idx in range(len(df_raw.columns)):
        parts = []
        for r in range(header_rows[0], header_rows[1] + 1):
            val = df_raw.iloc[r, col_idx]
            if pd.notna(val) and str(val).strip():
                parts.append(str(val).strip())
        headers.append(" ".join(parts))
    headers = [clean_col(h) for h in headers]
    seen = {}
    unique_headers = []
    for h in headers:
        if h in seen:
            seen[h] += 1
            unique_headers.append(f"{h}_{seen[h]}")
        else:
            seen[h] = 0
            unique_headers.append(h)
    headers = unique_headers
    data = df_raw.iloc[data_start_row:].copy()
    data.columns = headers
    data.dropna(how="all", inplace=True)
    for col in data.columns:
        if col not in ("state",):
            data[col] = pd.to_numeric(data[col], errors="coerce")
    data.dropna(subset=["state"], inplace=True)
    data["state"] = data["state"].str.strip()
    data.reset_index(drop=True, inplace=True)
    return data


hm20 = read_fhwa_excel("hm20_public_road_length_2024.xlsx", (11, 14), 15)
save(hm20, "fhwa", "public_road_length_2024")

vm2 = read_fhwa_excel("vm2_vehicle_miles_2024.xlsx", (10, 13), 14)
save(vm2, "fhwa", "vehicle_miles_traveled_2024")

hm15 = read_fhwa_excel("hm15_federal_aid_highway_2024.xlsx", (11, 13), 14)
save(hm15, "fhwa", "federal_aid_highway_2024")


# ============================================================
# 5. CENSUS BUILDING PERMITS
# ============================================================
print("\n--- Census Building Permits ---")


def read_bps_text(filename):
    with open(f"{RAW}/transportation/{filename}", "r") as f:
        lines = f.readlines()
    header_line = None
    for i, line in enumerate(lines):
        if "Total" in line and "1 Unit" in line:
            header_line = i
            break
    if header_line is None:
        return pd.DataFrame()
    data_start = None
    for i in range(header_line + 1, len(lines)):
        if lines[i].strip():
            data_start = i
            break
    if data_start is None:
        return pd.DataFrame()
    records = []
    for line in lines[data_start:]:
        line = line.rstrip("\n")
        if not line.strip():
            continue
        parts = re.split(r"\s{2,}", line.strip())
        if len(parts) >= 2:
            state = parts[0].strip()
            nums = []
            for p in parts[1:]:
                try:
                    nums.append(int(p.replace(",", "")))
                except ValueError:
                    try:
                        nums.append(float(p.replace(",", "")))
                    except ValueError:
                        nums.append(p)
            records.append([state] + nums)
    if not records:
        return pd.DataFrame()
    max_cols = max(len(r) for r in records)
    col_names = ["state", "total", "1_unit", "2_units", "3_4_units", "5_plus_units"]
    if max_cols > 6:
        col_names.append("5_plus_structures")
    while len(col_names) < max_cols:
        col_names.append(f"col_{len(col_names)}")
    df = pd.DataFrame(records, columns=col_names[:max_cols])
    return df


for year in [2015, 2018]:
    df = read_bps_text(f"bps_state_units_{year}.txt")
    if not df.empty:
        for col in df.columns[1:]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        save(df, "census", f"bps_state_units_{year}")

df = read_bps_text("bps_state_valuation_2018.txt")
if not df.empty:
    for col in df.columns[1:]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    save(df, "census", "bps_state_valuation_2018")

for year in [2019, 2020, 2021]:
    try:
        xls = pd.ExcelFile(f"{RAW}/transportation/building_permits_state_annual_{year}.xls")
        for sheet in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet, header=None)
            header_row = None
            for i in range(min(15, len(df))):
                row_vals = [str(v) for v in df.iloc[i].dropna().values]
                if any("Total" in str(v) for v in row_vals):
                    header_row = i
                    break
            if header_row is not None:
                cols = [clean_col(str(v)) for v in df.iloc[header_row].dropna().values]
                data = df.iloc[header_row + 1:].copy()
                data = data.dropna(how="all")
                if len(data.columns) >= len(cols):
                    data = data.iloc[:, :len(cols)]
                data.columns = cols
                for col in data.columns:
                    if col not in ("state", "area", "region", "division"):
                        data[col] = pd.to_numeric(data[col], errors="coerce")
                data.dropna(how="all", inplace=True)
                data.reset_index(drop=True, inplace=True)
                if len(data) > 0:
                    sheet_clean = clean_col(sheet)
                    save(data, "census", f"bps_{year}_{sheet_clean}")
    except Exception as e:
        print(f"  Warning: Could not read building_permits_{year}.xls: {e}")


# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 75)
print("CLEANING COMPLETE")
print("=" * 75)
print(f"\n{'Source':<10} {'Dataset':<40} {'Rows':>7} {'Cols':>5} {'Size':>10}")
print("-" * 75)
current_source = None
for source, name, rows, cols, size in results:
    print(f"{source:<10} {name:<40} {rows:>7} {cols:>5} {size:>10}")
print("-" * 75)
print(f"Total files: {len(results)}")
