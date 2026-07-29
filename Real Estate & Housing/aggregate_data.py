"""
Aggregate all processed data by state into a single JSON for the dashboard.
"""

import pandas as pd
import json
import os

PROC = "C:/Users/You/Downloads/America250/processed"

# State FIPS to name and abbreviation mapping
STATE_ABBR = {
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
    "56": "WY",
}

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
    "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}

STATE_POP = {
    "AL": 5024279, "AK": 733391, "AZ": 7151502, "AR": 3011524,
    "CA": 39538223, "CO": 5773714, "CT": 3605944, "DE": 989948,
    "DC": 689545, "FL": 21538187, "GA": 10711908, "HI": 1455271,
    "ID": 1839106, "IL": 12812508, "IN": 6785528, "IA": 3190369,
    "KS": 2937880, "KY": 4505836, "LA": 4657757, "ME": 1362359,
    "MD": 6177224, "MA": 7029917, "MI": 10077331, "MN": 5706494,
    "MS": 2961279, "MO": 6154913, "MT": 1084225, "NE": 1961504,
    "NV": 3104614, "NH": 1377529, "NJ": 9288994, "NM": 2117522,
    "NY": 20201249, "NC": 10439388, "ND": 779094, "OH": 11799448,
    "OK": 3959353, "OR": 4237256, "PA": 13002700, "RI": 1097379,
    "SC": 5118425, "SD": 886667, "TN": 6910840, "TX": 29145505,
    "UT": 3271616, "VT": 643077, "VA": 8631393, "WA": 7614893,
    "WV": 1793716, "WI": 5893718, "WY": 576851,
}

# Initialize state data
states = {}
for abbr in STATE_NAMES:
    states[abbr] = {
        "abbr": abbr,
        "name": STATE_NAMES[abbr],
        "population": STATE_POP.get(abbr, 0),
        "airports": 0,
        "runways": 0,
        "road_length_miles": 0.0,
        "vehicle_miles_millions": 0.0,
        "hpi_latest": None,
        "hpi_year": None,
        "hpi_trend": [],
        "building_permits_latest": 0,
        "building_permits_trend": [],
        "transit_agencies": 0,
        "transit_ridership_upt": 0,
        "transit_modes": [],
    }


# 1. FAA Airports by state (iso_region format is "US-XX")
print("Processing airports...")
airports = pd.read_csv(f"{PROC}/faa/airports.csv")
# iso_region may have quotes like '"US-CA"' -> strip quotes then extract state abbr
airports["iso_region"] = airports["iso_region"].str.strip('"')
airports["state"] = airports["iso_region"].str.replace("US-", "", regex=False)
state_airports = airports.groupby("state").size().reset_index(name="count")
for _, row in state_airports.iterrows():
    s = row["state"]
    if s in states:
        states[s]["airports"] = int(row["count"])

# Airport type breakdown per state
airport_types = airports.groupby(["state", "type"]).size().reset_index(name="count")
# Save for later use
airport_type_data = {}
for _, row in airport_types.iterrows():
    s = row["state"]
    if s in states:
        if s not in airport_type_data:
            airport_type_data[s] = {}
        airport_type_data[s][row["type"]] = int(row["count"])


# 2. FAA Runways by state
print("Processing runways...")
runways = pd.read_csv(f"{PROC}/faa/runways.csv")
# Merge with airports to get state
runway_airports = runways.merge(airports[["ident", "state"]], left_on="airport_ident", right_on="ident", how="left")
state_runways = runway_airports.groupby("state").size().reset_index(name="count")
for _, row in state_runways.iterrows():
    s = row["state"]
    if s in states:
        states[s]["runways"] = int(row["count"])


# 3. FHWA Road Length by state
print("Processing road data...")
try:
    road = pd.read_csv(f"{PROC}/fhwa/public_road_length_2024.csv")
    # Find the total column
    total_cols = [c for c in road.columns if "total" in c.lower()]
    if total_cols:
        road["state_upper"] = road["state"].str.upper().str.strip()
        # Map full state names to abbreviations
        name_to_abbr = {v.upper(): k for k, v in STATE_NAMES.items()}
        road["abbr"] = road["state_upper"].map(name_to_abbr)
        for _, row in road.iterrows():
            abbr = row.get("abbr")
            if abbr and abbr in states:
                val = pd.to_numeric(row[total_cols[0]], errors="coerce")
                if pd.notna(val):
                    states[abbr]["road_length_miles"] = round(float(val), 1)
except Exception as e:
    print(f"  Road data error: {e}")

try:
    vmt = pd.read_csv(f"{PROC}/fhwa/vehicle_miles_traveled_2024.csv")
    total_cols = [c for c in vmt.columns if "total" in c.lower()]
    if total_cols:
        vmt["state_upper"] = vmt["state"].str.upper().str.strip()
        name_to_abbr = {v.upper(): k for k, v in STATE_NAMES.items()}
        vmt["abbr"] = vmt["state_upper"].map(name_to_abbr)
        for _, row in vmt.iterrows():
            abbr = row.get("abbr")
            if abbr and abbr in states:
                val = pd.to_numeric(row[total_cols[0]], errors="coerce")
                if pd.notna(val):
                    states[abbr]["vehicle_miles_millions"] = round(float(val), 1)
except Exception as e:
    print(f"  VMT data error: {e}")


# 4. FHFA House Price Index by state
print("Processing house price data...")
hpi_state = pd.read_csv(f"{PROC}/fhfa/hpi_state_exp.csv")
# Get latest year per state
hpi_state["yr"] = pd.to_numeric(hpi_state["yr"], errors="coerce")
hpi_state["qtr"] = pd.to_numeric(hpi_state["qtr"], errors="coerce")
hpi_state["index_nsa"] = pd.to_numeric(hpi_state["index_nsa"], errors="coerce")
hpi_state["index_sa"] = pd.to_numeric(hpi_state["index_sa"], errors="coerce")

# Map state abbreviations (already in the data)
for abbr in states:
    state_data = hpi_state[hpi_state["state"] == abbr].copy()
    if not state_data.empty:
        # Get latest quarter
        state_data["period"] = state_data["yr"] * 10 + state_data["qtr"]
        latest = state_data.loc[state_data["period"].idxmax()]
        states[abbr]["hpi_latest"] = round(float(latest["index_sa"]), 2) if pd.notna(latest["index_sa"]) else None
        states[abbr]["hpi_year"] = int(latest["yr"]) if pd.notna(latest["yr"]) else None

        # Get yearly trend (annual average of quarterly SA values)
        yearly = state_data.groupby("yr")["index_sa"].mean().reset_index()
        yearly = yearly.dropna()
        yearly = yearly[yearly["yr"] >= 2010]
        states[abbr]["hpi_trend"] = [
            {"year": int(r["yr"]), "hpi": round(float(r["index_sa"]), 2)}
            for _, r in yearly.iterrows()
        ]


# 5. Census Building Permits by state
print("Processing building permits...")
name_to_abbr = {v.upper(): k for k, v in STATE_NAMES.items()}
# Also handle region/division names
region_to_abbr = {
    "UNITED STATES": None, "NORTHEAST": None, "NEW ENGLAND": None,
    "MID-ATLANTIC": None, "MIDWEST": None, "EAST NORTH CENTRAL": None,
    "WEST NORTH CENTRAL": None, "SOUTH": None, "SOUTH ATLANTIC": None,
    "EAST SOUTH CENTRAL": None, "WEST SOUTH CENTRAL": None, "WEST": None,
    "MOUNTAIN": None, "PACIFIC": None,
}

RAW_DIR = "C:/Users/You/Downloads/America250/raw"

# Read from raw Excel/text files directly for proper state mapping
def read_bps_excel(year):
    """Read building permits from raw Excel, return dict of abbr -> total_units."""
    try:
        xls = pd.ExcelFile(f"{RAW_DIR}/transportation/building_permits_state_annual_{year}.xls")
        df = pd.read_excel(xls, sheet_name="State Units", header=None)
        results = {}
        for i in range(len(df)):
            row = df.iloc[i]
            # State name is in first column, total units in second column
            state_val = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
            total_val = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
            state_upper = state_val.upper()
            abbr = name_to_abbr.get(state_upper)
            if abbr and total_val is not None:
                try:
                    results[abbr] = int(float(str(total_val).replace(",", "")))
                except (ValueError, TypeError):
                    pass
        return results
    except Exception as e:
        print(f"  Error reading Excel {year}: {e}")
        return {}

def read_bps_text(year):
    """Read building permits from processed text files."""
    try:
        df = pd.read_csv(f"{PROC}/census/bps_state_units_{year}.csv")
        results = {}
        for _, row in df.iterrows():
            state_upper = str(row["state"]).strip().upper()
            abbr = name_to_abbr.get(state_upper)
            if abbr:
                try:
                    results[abbr] = int(float(str(row["total"]).replace(",", "")))
                except (ValueError, TypeError):
                    pass
        return results
    except Exception as e:
        print(f"  Error reading text {year}: {e}")
        return {}

# Collect building permits for all available years
all_years_data = {}
for year in [2015, 2018]:
    all_years_data[year] = read_bps_text(year)

for year in [2019, 2020, 2021]:
    all_years_data[year] = read_bps_excel(year)

for year, year_data in all_years_data.items():
    for abbr, total in year_data.items():
        if abbr in states:
            states[abbr]["building_permits_trend"].append({
                "year": year, "permits": total
            })

# Set latest building permits from most recent year with data
for abbr in states:
    trends = states[abbr]["building_permits_trend"]
    if trends:
        latest = max(trends, key=lambda x: x["year"])
        states[abbr]["building_permits_latest"] = latest["permits"]

# Sort building permits trend
for abbr in states:
    states[abbr]["building_permits_trend"].sort(key=lambda x: x["year"])


# 6. NTD Transit Data by state
print("Processing transit data...")
try:
    ntd = pd.read_csv(f"{PROC}/ntd/service_by_agency_2024.csv")
    ntd["state"] = ntd["state"].str.upper().str.strip()
    state_transit = ntd.groupby("state").agg({
        "5_digit_ntd_id": "nunique",
        "sum_unlinked_passenger_trips_upt": "sum",
    }).reset_index()
    state_transit.columns = ["state", "agencies", "upt"]
    for _, row in state_transit.iterrows():
        s = row["state"]
        if s in states:
            states[s]["transit_agencies"] = int(row["agencies"])
            states[s]["transit_ridership_upt"] = int(row["upt"]) if pd.notna(row["upt"]) else 0
except Exception as e:
    print(f"  Transit data error: {e}")

# Transit mode breakdown
try:
    ntd_mode = pd.read_csv(f"{PROC}/ntd/service_by_mode_2024.csv")
    ntd_mode["state"] = ntd_mode["state"].str.upper().str.strip()
    mode_by_state = ntd_mode.groupby(["state", "mode_name"]).agg({
        "sum_unlinked_passenger_trips_upt": "sum"
    }).reset_index()
    for abbr in states:
        state_modes = mode_by_state[mode_by_state["state"] == abbr]
        if not state_modes.empty:
            states[abbr]["transit_modes"] = [
                {"mode": r["mode_name"], "upt": int(r["sum_unlinked_passenger_trips_upt"]) if pd.notna(r["sum_unlinked_passenger_trips_upt"]) else 0}
                for _, r in state_modes.nlargest(5, "sum_unlinked_passenger_trips_upt").iterrows()
            ]
except Exception as e:
    print(f"  Transit mode error: {e}")


# Airport type data for charts
for abbr in states:
    if abbr in airport_type_data:
        states[abbr]["airport_types"] = [
            {"type": t, "count": c} for t, c in sorted(airport_type_data[abbr].items(), key=lambda x: -x[1])
        ]
    else:
        states[abbr]["airport_types"] = []


# Compute national totals for KPIs
total_airports = sum(s["airports"] for s in states.values())
total_runways = sum(s["runways"] for s in states.values())
total_road = sum(s["road_length_miles"] for s in states.values())
total_permits = sum(s["building_permits_latest"] for s in states.values())
hpi_values = [s["hpi_latest"] for s in states.values() if s["hpi_latest"]]
avg_hpi = round(sum(hpi_values) / len(hpi_values), 2) if hpi_values else 0
total_transit_ridership = sum(s["transit_ridership_upt"] for s in states.values())

output = {
    "summary": {
        "total_airports": total_airports,
        "total_runways": total_runways,
        "total_road_miles": round(total_road, 1),
        "total_building_permits": total_permits,
        "avg_hpi": avg_hpi,
        "total_transit_ridership": total_transit_ridership,
    },
    "states": states,
}

out_path = f"C:/Users/You/Downloads/America250/dashboard_data.json"
with open(out_path, "w") as f:
    json.dump(output, f)

print(f"\nSaved dashboard_data.json ({os.path.getsize(out_path) / 1024:.1f} KB)")
print(f"States: {len(states)}")
print(f"Total airports: {total_airports:,}")
print(f"Total runways: {total_runways:,}")
print(f"Total road miles: {total_road:,.1f}")
print(f"Total building permits: {total_permits:,}")
print(f"Avg HPI: {avg_hpi}")
print(f"Total transit ridership: {total_transit_ridership:,}")
