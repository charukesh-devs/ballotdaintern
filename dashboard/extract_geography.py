import pandas as pd
import json
from pathlib import Path

WB = Path(__file__).parent.parent / "America250_Geography_Environment (1).xlsx"
OUT = Path(__file__).parent / "dashboard-app" / "public" / "geography.json"

STATE_FIPS = {
    "Alabama":"01","Alaska":"02","Arizona":"04","Arkansas":"05","California":"06",
    "Colorado":"08","Connecticut":"09","Delaware":"10","District of Columbia":"11",
    "Florida":"12","Georgia":"13","Hawaii":"15","Idaho":"16","Illinois":"17",
    "Indiana":"18","Iowa":"19","Kansas":"20","Kentucky":"21","Louisiana":"22",
    "Maine":"23","Maryland":"24","Massachusetts":"25","Michigan":"26","Minnesota":"27",
    "Mississippi":"28","Missouri":"29","Montana":"30","Nebraska":"31","Nevada":"32",
    "New Hampshire":"33","New Jersey":"34","New Mexico":"35","New York":"36",
    "North Carolina":"37","North Dakota":"38","Ohio":"39","Oklahoma":"40",
    "Oregon":"41","Pennsylvania":"42","Rhode Island":"44","South Carolina":"45",
    "South Dakota":"46","Tennessee":"47","Texas":"48","Utah":"49","Vermont":"50",
    "Virginia":"51","Washington":"53","West Virginia":"54","Wisconsin":"55","Wyoming":"56",
}

STATE_ABBR = {
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
    "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
    "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
    "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
    "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
    "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
    "54":"WV","55":"WI","56":"WY",
}

REGION_COLORS = {
    "Northeast": "#e74c3c",
    "South": "#f39c12",
    "Midwest": "#2ecc71",
    "West": "#3498db",
}

CLIMATE_COLORS = {
    "Cold / Dry": "#5dade2",
    "Cold / Snowy": "#85c1e9",
    "Mild / Wet": "#2ecc71",
    "Mild / Arid": "#f39c12",
    "Hot / Arid": "#e67e22",
    "Hot / Humid": "#e74c3c",
    "Temperate / Marine": "#1abc9c",
    "Continental": "#8e44ad",
}

def safe_float(v):
    try: return float(v)
    except: return 0.0

def safe_int(v):
    try: return int(float(v))
    except: return 0

def safe_str(v):
    if pd.isna(v): return ""
    return str(v)

def extract():
    print("Reading geography workbook...")
    xls = pd.ExcelFile(WB)

    overview = pd.read_excel(xls, sheet_name="States_Overview")
    parks = pd.read_excel(xls, sheet_name="National_Parks")
    climate = pd.read_excel(xls, sheet_name="Climate")
    land_cover = pd.read_excel(xls, sheet_name="Land_Cover")
    air_quality = pd.read_excel(xls, sheet_name="Air_Quality")
    elevation = pd.read_excel(xls, sheet_name="Elevation")
    mountains = pd.read_excel(xls, sheet_name="Mountains_Peaks")
    drought = pd.read_excel(xls, sheet_name="Drought_Monitor")

    name_to_fips = STATE_FIPS
    states = {}

    for _, row in overview.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips:
            continue

        land_area = safe_float(row.get("Land Area (sq mi)", 0))
        water_area = safe_float(row.get("Water Area (sq mi)", 0))
        total_area = safe_float(row.get("Total Area (sq mi)", 0))
        pop_density = safe_float(row.get("Population Density (per sq mi land)", 0))
        pop_2020 = safe_int(row.get("Population (2020 Census)", 0))
        year_admitted = safe_int(row.get("Year Admitted to Union", 0))

        states[fips] = {
            "name": name,
            "abbr": STATE_ABBR.get(fips, ""),
            "fips": fips,
            "capital": safe_str(row.get("Capital", "")),
            "region": safe_str(row.get("Census Region", "")),
            "year_admitted": year_admitted,
            "land_area_sqmi": land_area,
            "water_area_sqmi": water_area,
            "total_area_sqmi": total_area,
            "pop_density": pop_density,
            "pop_2020_census": pop_2020,
            "forest_cover_pct": 0,
            "national_parks_count": 0,
            "national_parks": [],
            "avg_temp_f": 0,
            "avg_precip_in": 0,
            "climate_char": "",
            "avg_summer_temp_f": 0,
            "avg_winter_temp_f": 0,
            "avg_snowfall_in": 0,
            "good_air_days_pct": 0,
            "median_aqi": 0,
            "unhealthy_days": 0,
            "highest_point": "",
            "highest_elev_ft": 0,
            "lowest_point": "",
            "lowest_elev_ft": 0,
            "mean_elev_ft": 0,
            "elev_range_ft": 0,
            "highest_peak": "",
            "mountain_range": "",
            "peak_elev_ft": 0,
            "drought_region": "",
            "drought_pattern": "",
        }

    # National Parks
    for _, row in parks.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["national_parks_count"] = safe_int(row.get("Number of NPS 'National Park'-designated units", 0))
        parks_str = safe_str(row.get("National Park Name(s)", ""))
        if parks_str:
            states[fips]["national_parks"] = [p.strip() for p in parks_str.split(",") if p.strip()]

    # Climate - use positional matching for encoded columns
    clim_cols = list(climate.columns)
    temp_col = [c for c in clim_cols if 'Temperature' in c and 'Annual' in c][0]
    summer_col = [c for c in clim_cols if 'Summer' in c][0]
    winter_col = [c for c in clim_cols if 'Winter' in c][0]
    precip_col = [c for c in clim_cols if 'Precipitation' in c][0]
    snow_col = [c for c in clim_cols if 'Snowfall' in c][0]
    for _, row in climate.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["avg_temp_f"] = safe_float(row.get(temp_col, 0))
        states[fips]["avg_precip_in"] = safe_float(row.get(precip_col, 0))
        states[fips]["climate_char"] = safe_str(row.get("Climate Character", ""))
        states[fips]["avg_summer_temp_f"] = safe_float(row.get(summer_col, 0))
        states[fips]["avg_winter_temp_f"] = safe_float(row.get(winter_col, 0))
        states[fips]["avg_snowfall_in"] = safe_float(row.get(snow_col, 0))

    # Land Cover
    for _, row in land_cover.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["forest_cover_pct"] = safe_float(row.get("Forest Cover % (2016 FIA survey)", 0))

    # Air Quality
    for _, row in air_quality.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["good_air_days_pct"] = safe_float(row.get("Avg 'Good Air Day' Share 2020-2024 (%)", 0))
        states[fips]["median_aqi"] = safe_float(row.get("Avg Median AQI 2020-2024", 0))
        states[fips]["unhealthy_days"] = safe_int(row.get("Total Unhealthy-Level Days (2020-2024)", 0))

    # Elevation
    for _, row in elevation.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["highest_point"] = safe_str(row.get("Highest Point", ""))
        states[fips]["highest_elev_ft"] = safe_float(row.get("Highest Elevation (ft)", 0))
        states[fips]["lowest_point"] = safe_str(row.get("Lowest Point", ""))
        states[fips]["lowest_elev_ft"] = safe_float(row.get("Lowest Elevation (ft)", 0))
        states[fips]["mean_elev_ft"] = safe_float(row.get("Mean Elevation (ft)", 0))
        states[fips]["elev_range_ft"] = safe_float(row.get("Elevation Range (ft)", 0))

    # Mountains & Peaks
    for _, row in mountains.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["highest_peak"] = safe_str(row.get("State's Highest Peak", ""))
        states[fips]["mountain_range"] = safe_str(row.get("Mountain Range", ""))
        states[fips]["peak_elev_ft"] = safe_float(row.get("Peak Elevation (ft)", 0))

    # Drought Monitor
    for _, row in drought.iterrows():
        name = row["State"]
        fips = name_to_fips.get(name)
        if not fips or fips not in states:
            continue
        states[fips]["drought_region"] = safe_str(row.get("US Drought Monitor Region", ""))
        states[fips]["drought_pattern"] = safe_str(row.get("Recent Pattern (week of July 21, 2026)", ""))

    # Sort states by name
    output = {
        "metadata": {
            "title": "U.S. Geography & Environment",
            "sources": ["EPA", "USGS", "NOAA", "NPS", "USDA Forest Service"],
            "generated": "2026-07-28",
            "data_from_excel": True,
        },
        "states": dict(sorted(states.items(), key=lambda x: x[1]["name"])),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Written {len(states)} states to {OUT}")
    print(f"File size: {OUT.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    extract()
