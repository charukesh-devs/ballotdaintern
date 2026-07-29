import pandas as pd
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "raw"
PROCESSED_DIR = Path(__file__).parent.parent / "processed"
PROCESSED_DIR.mkdir(exist_ok=True)

SOURCE_URLS = {
    "population": "https://data.census.gov",
    "gdp": "https://apps.bea.gov",
    "housing": "https://www.fhfa.gov",
}


def clean_population():
    df = pd.read_csv(RAW_DIR / "census" / "population.csv")
    df = df.rename(columns={"Population": "population"})
    df["source_url"] = SOURCE_URLS["population"]
    df["status"] = "Complete"
    return df


def clean_gdp():
    df = pd.read_csv(RAW_DIR / "bea" / "gdp.csv")
    df = df.rename(columns={"GDP": "gdp"})
    df["source_url"] = SOURCE_URLS["gdp"]
    df["status"] = "Complete"
    return df


def clean_housing():
    df = pd.read_csv(RAW_DIR / "fhfa" / "housing.csv")
    df = df.rename(columns={"HousePriceIndex": "housing"})
    df["source_url"] = SOURCE_URLS["housing"]
    df["status"] = "Complete"
    return df


def merge_all():
    pop = clean_population()
    gdp = clean_gdp()
    housing = clean_housing()

    merged = pop[["State", "Year", "population", "source_url", "status"]].copy()
    merged = merged.rename(columns={"State": "state", "Year": "year"})

    merged = merged.merge(
        gdp[["State", "Year", "gdp"]].rename(columns={"State": "state", "Year": "year"}),
        on=["state", "year"],
        how="outer",
    )

    merged = merged.merge(
        housing[["State", "Year", "housing"]].rename(columns={"State": "state", "Year": "year"}),
        on=["state", "year"],
        how="outer",
    )

    merged["source_url"] = merged["source_url"].fillna("Multiple sources")
    merged["status"] = merged["status"].fillna("Partial")

    merged = merged.sort_values(["state", "year"]).reset_index(drop=True)

    return merged


if __name__ == "__main__":
    df = merge_all()
    output_file = PROCESSED_DIR / "america250_allstates.csv"
    df.to_csv(output_file, index=False)
    print(f"Saved: {output_file}")
    print(f"Rows: {len(df)}, Columns: {list(df.columns)}")
    print(df.head(10))
