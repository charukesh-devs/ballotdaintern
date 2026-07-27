"""Extract per-state demographics from the Excel workbook into a single JSON for the dashboard."""
import pandas as pd
import json
from pathlib import Path

WB = Path(__file__).parent.parent / "processed" / "Demographics_Data_new.xlsx"
OUT = Path(__file__).parent / "public" / "demographics.json"

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


def safe_int(v):
    try:
        return int(v)
    except (ValueError, TypeError):
        return 0


def extract():
    print("Reading workbook...")
    pep = pd.read_excel(WB, sheet_name="PEP_County", skiprows=11)
    age_raw = pd.read_excel(WB, sheet_name="ACS_b01001", skiprows=11)
    race_raw = pd.read_excel(WB, sheet_name="ACS_b03002", skiprows=11)
    income_raw = pd.read_excel(WB, sheet_name="ACS_b19013", skiprows=11)

    # Aggregate PEP county -> state
    pep["State_FIPS"] = pep["State_FIPS"].astype(str).str.zfill(2)
    state_pep = pep.groupby("State_FIPS").agg({
        "Pop_Estimate_2020": "sum",
        "Pop_Estimate_2021": "sum",
        "Pop_Estimate_2022": "sum",
        "Pop_Estimate_2023": "sum",
        "Births_2023": "sum",
        "Deaths_2023": "sum",
        "Intl_Migration_2023": "sum",
        "Domestic_Migration_2023": "sum",
    }).reset_index()

    # ACS state-level GEOID format: 0400000US{FIPS}
    def get_state_fips(geoid):
        s = str(geoid)
        if s.startswith("0400000US"):
            return s[-2:]
        return None

    age_raw["_fips"] = age_raw["GEOID"].apply(get_state_fips)
    state_age = age_raw[age_raw["_fips"].notna()].copy()

    race_raw["_fips"] = race_raw["GEOID"].apply(get_state_fips)
    state_race = race_raw[race_raw["_fips"].notna()].copy()

    income_raw["_fips"] = income_raw["GEOID"].apply(get_state_fips)
    state_income = income_raw[income_raw["_fips"].notna()].copy()

    # Build per-state records
    states = {}

    for _, row in state_pep.iterrows():
        fips = row["State_FIPS"]
        if fips not in STATE_NAMES:
            continue

        pop_2020 = safe_int(row["Pop_Estimate_2020"])
        pop_2023 = safe_int(row["Pop_Estimate_2023"])
        growth = round((pop_2023 - pop_2020) / pop_2020 * 100, 1) if pop_2020 > 0 else 0

        states[fips] = {
            "name": STATE_NAMES[fips],
            "abbr": STATE_ABBR.get(fips, fips),
            "fips": fips,
            "population": {
                "2020": pop_2020,
                "2021": safe_int(row["Pop_Estimate_2021"]),
                "2022": safe_int(row["Pop_Estimate_2022"]),
                "2023": pop_2023,
            },
            "growth_pct": growth,
            "births_2023": safe_int(row["Births_2023"]),
            "deaths_2023": safe_int(row["Deaths_2023"]),
            "intl_migration_2023": safe_int(row["Intl_Migration_2023"]),
            "domestic_migration_2023": safe_int(row["Domestic_Migration_2023"]),
            "age": {},
            "race": {},
            "income": 0,
        }

    # Add age data
    # B01001_001 = Total
    # B01001_002 = Male total
    # Male age groups: _003(under5), _004(5-9), _005(10-14), _006(15-17), _007(18), _008(19), _009(20),
    #   _010(21), _011(22-24), _012(25-29), _013(30-34), _014(35-39), _015(40-44), _016(45-49),
    #   _017(50-54), _018(55-59), _019(60-61), _020(62-64), _021(65-66), _022(67-69),
    #   _023(70-74), _024(75-79), _025(80-84), _026... wait _026 = Female total
    # Female age groups: _027-049 same pattern
    for _, row in state_age.iterrows():
        fips = row["_fips"]
        if fips not in states:
            continue
        total = safe_int(row.get("B01001_001", 0))

        def col(n):
            return safe_int(row.get(f"B01001_{str(n).zfill(3)}", 0))

        # Male groups
        m_under5 = col(3)
        m_5_9 = col(4)
        m_10_14 = col(5)
        m_15_17 = col(6)
        m_18_19 = col(7) + col(8)
        m_20_24 = col(9) + col(10) + col(11)
        m_25_34 = col(12) + col(13)
        m_35_44 = col(14) + col(15)
        m_45_54 = col(16) + col(17)
        m_55_64 = col(18) + col(19) + col(20)
        m_65_plus = col(21) + col(22) + col(23) + col(24) + col(25)

        # Female groups (offset by 24: _027 = under5, etc.)
        f_under5 = col(27)
        f_5_9 = col(28)
        f_10_14 = col(29)
        f_15_17 = col(30)
        f_18_19 = col(31) + col(32)
        f_20_24 = col(33) + col(34) + col(35)
        f_25_34 = col(36) + col(37)
        f_35_44 = col(38) + col(39)
        f_45_54 = col(40) + col(41)
        f_55_64 = col(42) + col(43) + col(44)
        f_65_plus = col(45) + col(46) + col(47) + col(48) + col(49)

        under18 = (m_under5 + m_5_9 + m_10_14 + m_15_17 +
                   f_under5 + f_5_9 + f_10_14 + f_15_17)
        age_18_24 = m_18_19 + m_20_24 + f_18_19 + f_20_24
        age_25_44 = m_25_34 + m_35_44 + f_25_34 + f_35_44
        age_45_64 = m_45_54 + m_55_64 + f_45_54 + f_55_64
        age_65_plus = m_65_plus + f_65_plus

        states[fips]["age"] = {
            "total": total,
            "under_18": under18,
            "18_to_24": age_18_24,
            "25_to_44": age_25_44,
            "45_to_64": age_45_64,
            "65_plus": age_65_plus,
        }

    # Add race data
    for _, row in state_race.iterrows():
        fips = row["_fips"]
        if fips not in states:
            continue
        total = safe_int(row.get("B03002_001", 0))
        white = safe_int(row.get("B03002_003", 0))
        black = safe_int(row.get("B03002_004", 0))
        aian = safe_int(row.get("B03002_005", 0))
        asian = safe_int(row.get("B03002_006", 0))
        nhpi = safe_int(row.get("B03002_007", 0))
        two_plus = safe_int(row.get("B03002_008", 0))
        hispanic = safe_int(row.get("B03002_012", 0))
        other = total - white - black - aian - asian - nhpi - two_plus - hispanic
        if other < 0:
            other = 0

        states[fips]["race"] = {
            "total": total,
            "white": white,
            "black": black,
            "hispanic": hispanic,
            "asian": asian,
            "aian": aian,
            "two_plus": two_plus,
            "other": other,
        }

    # Add income data
    for _, row in state_income.iterrows():
        fips = row["_fips"]
        if fips not in states:
            continue
        states[fips]["income"] = safe_int(row.get("B19013_001", 0))

    # Build final output with sorted states
    output = {
        "metadata": {
            "title": "U.S. Census Demographics Dashboard",
            "sources": [
                "U.S. Census Bureau PEP Population Estimates 2020-2023",
                "U.S. Census Bureau ACS 1-Year Estimates 2023",
            ],
            "generated": "2026-07-24",
        },
        "states": dict(sorted(states.items(), key=lambda x: x[1]["population"]["2023"], reverse=True)),
    }

    # Add rank
    rank = 1
    for fips, st in output["states"].items():
        st["population_rank"] = rank
        rank += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Written {len(states)} states to {OUT}")
    print(f"File size: {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    extract()
