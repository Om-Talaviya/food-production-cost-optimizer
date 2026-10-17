"""
Exploratory Data Analysis (EDA) for Food Production Cost Analytics
=================================================================
Reproducible, dependency-documented EDA over the analysis-ready dataset
exported by the web app (or by ``analysis/generate_sample_data.mjs``).

This script is intentionally self-contained: it reads a CSV and never imports
any Node.js/JavaScript code, so the Python analysis layer stays independent of
the application runtime.

Usage:
    python analysis/eda.py
    python analysis/eda.py --input analysis/data/sample_production_dataset.csv

Outputs (analysis/outputs/):
    eda_summary.txt                 human-readable metric summary
    fig_cost_structure.png          cost category shares
    fig_margin_distribution.png     profit-margin distribution
    fig_unit_cost_trend.png         mean unit cost by month
    fig_category_profit.png         gross profit by product category
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")  # headless / reproducible rendering
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "analysis" / "data" / "sample_production_dataset.csv"
OUTPUT_DIR = ROOT / "analysis" / "outputs"

COST_COLUMNS = [
    "raw_material_cost",
    "packaging_cost",
    "labour_cost",
    "energy_cost",
    "water_utilities_cost",
    "transport_logistics_cost",
    "overhead_cost",
    "wastage_cost",
]

NUMERIC_COLUMNS = [
    "batch_quantity",
    "sellable_quantity",
    "wastage_quantity",
    "wastage_percentage",
    "total_production_cost",
    "cost_per_unit",
    "selling_price_per_unit",
    "total_revenue",
    "gross_profit",
    "profit_margin_percentage",
    "roi_percentage",
    "contribution_margin_per_unit",
]


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise SystemExit(
            f"Dataset not found: {path}\n"
            "Generate it first with:  node analysis/generate_sample_data.mjs"
        )
    df = pd.read_csv(path)
    for col in NUMERIC_COLUMNS + COST_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
        df["month"] = df["created_at"].dt.strftime("%Y-%m")
    return df


def section(title: str) -> str:
    return f"\n{'=' * 70}\n{title}\n{'=' * 70}\n"


def describe(df: pd.DataFrame) -> str:
    present = [c for c in NUMERIC_COLUMNS if c in df.columns]
    desc = df[present].describe().T
    desc["missing"] = df[present].isna().sum()
    out = section("1. DESCRIPTIVE STATISTICS (key numeric fields)")
    out += desc.round(2).to_string()
    return out


def cost_structure(df: pd.DataFrame) -> tuple[str, pd.Series]:
    totals = df[COST_COLUMNS].sum()
    grand = totals.sum()
    shares = (totals / grand * 100).round(2) if grand else totals * 0
    out = section("2. COST STRUCTURE (absolute and % of total production cost)")
    table = pd.DataFrame({"total_cost": totals.round(2), "share_pct": shares})
    out += table.to_string()
    return out, shares


def margin_bands(df: pd.DataFrame) -> str:
    m = df["profit_margin_percentage"].dropna()
    bins = [-np.inf, 0, 10, 20, 35, np.inf]
    labels = ["Loss (<0%)", "Thin (0-10%)", "Moderate (10-20%)", "Healthy (20-35%)", "Strong (35%+)"]
    counts = pd.cut(m, bins=bins, labels=labels, right=False).value_counts().reindex(labels, fill_value=0)
    out = section("3. PROFIT-MARGIN DISTRIBUTION (batches per band)")
    out += counts.to_string()
    out += f"\n\nmean margin: {m.mean():.2f}%   median: {m.median():.2f}%   std: {m.std():.2f}"
    return out


def product_rollup(df: pd.DataFrame) -> str:
    agg = (
        df.groupby("product_name")
        .agg(
            batches=("batch_id", "count"),
            total_revenue=("total_revenue", "sum"),
            total_cost=("total_production_cost", "sum"),
            total_profit=("gross_profit", "sum"),
            mean_margin_pct=("profit_margin_percentage", "mean"),
            mean_unit_cost=("cost_per_unit", "mean"),
            mean_wastage_pct=("wastage_percentage", "mean"),
        )
        .sort_values("total_profit", ascending=False)
        .round(2)
    )
    out = section("4. PRODUCT ROLLUP (sorted by total gross profit)")
    out += agg.to_string()
    return out


def category_rollup(df: pd.DataFrame) -> pd.DataFrame:
    agg = (
        df.groupby("product_category")
        .agg(
            batches=("batch_id", "count"),
            total_revenue=("total_revenue", "sum"),
            total_profit=("gross_profit", "sum"),
            mean_margin_pct=("profit_margin_percentage", "mean"),
        )
        .sort_values("total_profit", ascending=False)
        .round(2)
    )
    return agg


def correlation(df: pd.DataFrame) -> str:
    drivers = [
        "raw_material_cost",
        "batch_quantity",
        "wastage_percentage",
        "total_production_cost",
        "cost_per_unit",
        "profit_margin_percentage",
        "gross_profit",
    ]
    present = [c for c in drivers if c in df.columns]
    corr = df[present].corr(numeric_only=True).round(2)
    out = section("5. CORRELATION MATRIX (Pearson) - cost/margin drivers")
    out += corr.to_string()
    return out


def wastage(df: pd.DataFrame) -> str:
    w = df["wastage_percentage"].dropna()
    total_waste_cost = df["wastage_cost"].sum()
    total_cost = df["total_production_cost"].sum()
    out = section("6. WASTAGE ANALYSIS")
    out += f"mean wastage: {w.mean():.2f}%   max wastage: {w.max():.2f}%   min: {w.min():.2f}%\n"
    out += f"total wastage cost: {total_waste_cost:,.2f} ({total_waste_cost / total_cost * 100:.2f}% of total production cost)\n"
    worst = df.nlargest(5, "wastage_percentage")[["product_name", "month", "wastage_percentage", "wastage_cost"]]
    out += "\nTop 5 batches by wastage %:\n"
    out += worst.to_string(index=False)
    return out


def make_figures(df: pd.DataFrame, shares: pd.Series) -> list[Path]:
    written: list[Path] = []

    plt.rcParams.update({"figure.dpi": 120, "font.size": 9})

    # Cost structure
    fig, ax = plt.subplots(figsize=(7, 4))
    labels = [c.replace("_", " ") for c in shares.index]
    ax.barh(labels, shares.values, color="#10b981")
    ax.set_xlabel("% of total production cost")
    ax.set_title("Cost structure share by category")
    fig.tight_layout()
    p = OUTPUT_DIR / "fig_cost_structure.png"
    fig.savefig(p)
    plt.close(fig)
    written.append(p)

    # Margin distribution
    fig, ax = plt.subplots(figsize=(7, 4))
    df["profit_margin_percentage"].dropna().hist(ax=ax, bins=12, color="#06b6d4", edgecolor="white")
    ax.axvline(0, color="#f43f5e", linestyle="--", label="break-even")
    ax.set_xlabel("Profit margin (%)")
    ax.set_ylabel("Batches")
    ax.set_title("Distribution of profit margin")
    ax.legend()
    fig.tight_layout()
    p = OUTPUT_DIR / "fig_margin_distribution.png"
    fig.savefig(p)
    plt.close(fig)
    written.append(p)

    # Unit-cost trend
    if "month" in df.columns:
        trend = df.groupby("month")["cost_per_unit"].mean()
        fig, ax = plt.subplots(figsize=(7, 4))
        ax.plot(trend.index, trend.values, marker="o", color="#f59e0b")
        ax.set_xlabel("Month")
        ax.set_ylabel("Mean cost per unit")
        ax.set_title("Mean unit production cost by month")
        ax.tick_params(axis="x", rotation=45)
        fig.tight_layout()
        p = OUTPUT_DIR / "fig_unit_cost_trend.png"
        fig.savefig(p)
        plt.close(fig)
        written.append(p)

    # Category profit
    cat = category_rollup(df)
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.bar(cat.index, cat["total_profit"], color="#8b5cf6")
    ax.set_ylabel("Gross profit")
    ax.set_title("Gross profit by product category")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    p = OUTPUT_DIR / "fig_category_profit.png"
    fig.savefig(p)
    plt.close(fig)
    written.append(p)

    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="EDA over the production dataset.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="path to the dataset CSV")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_dataset(args.input)

    parts = [
        f"Food Production Cost Analytics - EDA summary\n"
        f"input: {args.input}\n"
        f"rows: {len(df)}   columns: {len(df.columns)}\n"
        f"products: {df['product_name'].nunique() if 'product_name' in df else 'n/a'}   "
        f"categories: {df['product_category'].nunique() if 'product_category' in df else 'n/a'}",
    ]
    parts.append(describe(df))
    cost_text, shares = cost_structure(df)
    parts.append(cost_text)
    parts.append(margin_bands(df))
    parts.append(product_rollup(df))
    parts.append(correlation(df))
    parts.append(wastage(df))

    cat = category_rollup(df)
    parts.append(section("7. CATEGORY ROLLUP"))
    parts.append(cat.to_string())

    report = "\n".join(parts) + "\n"
    summary_path = OUTPUT_DIR / "eda_summary.txt"
    summary_path.write_text(report, encoding="utf-8")
    print(report)

    figures = make_figures(df, shares)
    print(section("ARTIFACTS WRITTEN"))
    print(f"  {summary_path.relative_to(ROOT)}")
    for p in figures:
        print(f"  {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
