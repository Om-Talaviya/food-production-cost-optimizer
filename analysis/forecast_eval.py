"""
Forecast Model Evaluation
=========================
Backtests the forecasting approaches used by the application against historical
monthly cost series, using a per-product single fixed-origin holdout (train on all
but the last `h` months, test on the last `h`), and reports accuracy metrics against
naive baselines.

Models evaluated
----------------
naive_last     : next value = last observed value
naive_mean     : next value = mean of training values
linear         : ordinary least squares linear trend
holt           : Holt's linear double exponential smoothing (alpha=0.3, beta=0.1)
hybrid (app)   : the app's model = mean of `holt` and `linear` projections
                 (mirrors server/utils/forecastEngine.js)

Metrics: MAE, RMSE, MAPE, and a skill score vs the best naive baseline.

Usage:
    python analysis/forecast_eval.py
    python analysis/forecast_eval.py --input analysis/data/sample_cost_series.csv --horizon 1

Outputs (analysis/outputs/):
    forecast_eval.txt               metric tables
    fig_forecast_actual_vs_pred.png  actual vs hybrid prediction per product
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "analysis" / "data" / "sample_cost_series.csv"
OUTPUT_DIR = ROOT / "analysis" / "outputs"

ALPHA = 0.3
BETA = 0.1


def section(title: str) -> str:
    return f"\n{'=' * 70}\n{title}\n{'=' * 70}\n"


# --------------------------------------------------------------------------
# Models - each takes the training 1-D array and a direct horizon h (1-based)
# and returns the projection for that step as a pure function.
# --------------------------------------------------------------------------
def _linreg(y: np.ndarray) -> tuple[float, float]:
    n = len(y)
    if n < 2:
        return 0.0, float(y[0]) if n else 0.0
    x = np.arange(n, dtype=float)
    sumx, sumy = x.sum(), y.sum()
    sumxy = (x * y).sum()
    sumxx = (x * x).sum()
    denom = n * sumxx - sumx * sumx
    slope = (n * sumxy - sumx * sumy) / denom if denom else 0.0
    intercept = (sumy - slope * sumx) / n
    return slope, intercept


def _holt_params(y: np.ndarray) -> tuple[float, float]:
    level = float(y[0])
    trend = float(y[1] - y[0]) if len(y) > 1 else 0.0
    for i in range(1, len(y)):
        prev = level
        level = ALPHA * y[i] + (1 - ALPHA) * (level + trend)
        trend = BETA * (level - prev) + (1 - BETA) * trend
    return level, trend


def predict_naive_last(y: np.ndarray, h: int) -> float:
    return float(y[-1])


def predict_naive_mean(y: np.ndarray, h: int) -> float:
    return float(y.mean())


def predict_linear(y: np.ndarray, h: int) -> float:
    slope, intercept = _linreg(y)
    return intercept + slope * (len(y) - 1 + h)


def predict_holt(y: np.ndarray, h: int) -> float:
    level, trend = _holt_params(y)
    return level + h * trend


def predict_hybrid(y: np.ndarray, h: int) -> float:
    return (predict_holt(y, h) + predict_linear(y, h)) / 2.0


MODELS = {
    "naive_last": predict_naive_last,
    "naive_mean": predict_naive_mean,
    "linear": predict_linear,
    "holt": predict_holt,
    "hybrid (app)": predict_hybrid,
}


def mape(actual: np.ndarray, pred: np.ndarray) -> float:
    denom = np.where(actual == 0, np.nan, actual)
    return float(np.nanmean(np.abs((actual - pred) / denom)) * 100)


def evaluate(df: pd.DataFrame, horizon: int, min_train: int) -> pd.DataFrame:
    rows = []
    for product, grp in df.groupby("product"):
        g = grp.sort_values("date")
        y = g["cost_per_unit"].to_numpy(dtype=float)
        months = g["date"].tolist()
        n = len(y)

        if n < min_train + horizon:
            continue

        # single holdout: train on all but the last `horizon`, test on last `horizon`
        train, test = y[:-horizon], y[-horizon:]
        for name, fn in MODELS.items():
            preds = np.array([fn(train, h) for h in range(1, horizon + 1)]) if horizon > 1 \
                else np.array([fn(train, 1)])
            preds = np.maximum(preds, 0.0)
            rows.append(
                {
                    "product": product,
                    "model": name,
                    "n_train": len(train),
                    "n_test": len(test),
                    "MAE": float(np.mean(np.abs(test - preds))),
                    "RMSE": float(np.sqrt(np.mean((test - preds) ** 2))),
                    "MAPE_pct": mape(test, preds),
                }
            )
    return pd.DataFrame(rows)


def summarize(metrics: pd.DataFrame) -> tuple[pd.DataFrame, str]:
    agg = (
        metrics.groupby("model")
        .agg(MAE=("MAE", "mean"), RMSE=("RMSE", "mean"), MAPE_pct=("MAPE_pct", "mean"))
        .sort_values("MAPE_pct")
        .round(3)
    )
    # skill score vs best naive baseline
    naive = agg.loc[[m for m in ["naive_last", "naive_mean"] if m in agg.index], "MAE"].min()
    agg["MAE_skill_vs_best_naive"] = (1 - agg["MAE"] / naive).round(4)
    return agg, f"best naive baseline MAE: {naive:.3f}"


def make_figure(df: pd.DataFrame, horizon: int, min_train: int) -> list[Path]:
    written = []
    n_products = df["product"].nunique()
    fig, axes = plt.subplots(n_products, 1, figsize=(8, 2.2 * n_products), squeeze=False)
    for ax, (product, grp) in zip(axes[:, 0], df.groupby("product")):
        g = grp.sort_values("date")
        y = g["cost_per_unit"].to_numpy(dtype=float)
        x = np.arange(len(y))
        if len(y) < min_train + horizon:
            ax.set_visible(False)
            continue
        train, test = y[:-horizon], y[-horizon:]
        preds = np.array([predict_hybrid(train, h) for h in range(1, horizon + 1)])
        ax.plot(x[:-horizon], train, marker="o", ms=3, color="#06b6d4", label="actual (train)")
        ax.plot(x[-horizon:], test, marker="o", ms=3, color="#f59e0b", label="actual (test)")
        ax.plot(x[-horizon:], preds, marker="x", ms=5, ls="--", color="#f43f5e", label="hybrid pred")
        ax.set_title(product, fontsize=9)
        ax.set_ylabel("cost/unit")
        ax.legend(fontsize=7)
    axes[0, 0].legend(fontsize=7)
    fig.suptitle(f"Hybrid forecast vs actual (holdout horizon={horizon})", fontsize=10)
    fig.tight_layout()
    p = OUTPUT_DIR / "fig_forecast_actual_vs_pred.png"
    fig.savefig(p)
    plt.close(fig)
    written.append(p)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Backtest cost forecast models.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--horizon", type=int, default=3, help="months held out per product")
    parser.add_argument("--min-train", type=int, default=6, help="minimum training months")
    args = parser.parse_args()

    if not args.input.exists():
        raise SystemExit(
            f"Series not found: {args.input}\n"
            "Generate it first with:  node analysis/generate_sample_data.mjs"
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(args.input)
    df["cost_per_unit"] = pd.to_numeric(df["cost_per_unit"], errors="coerce")
    df = df.dropna(subset=["cost_per_unit"])

    metrics = evaluate(df, args.horizon, args.min_train)
    if metrics.empty:
        raise SystemExit("No product had enough months for the requested horizon/min-train.")

    summary, note = summarize(metrics)

    report = [
        "Food Production Cost Analytics - Forecast model evaluation\n"
        f"input:   {args.input}\n"
        f"horizon: {args.horizon} month(s) held out   min-train: {args.min_train} months\n"
        f"products evaluated: {metrics['product'].nunique()}",
        section("1. AGGREGATE METRICS (mean across products, sorted by MAPE)"),
        summary.to_string(),
        note,
        section("2. PER-PRODUCT METRICS"),
        metrics.sort_values(["product", "MAPE_pct"]).round(3).to_string(index=False),
    ]
    report_text = "\n".join(report) + "\n"
    (OUTPUT_DIR / "forecast_eval.txt").write_text(report_text, encoding="utf-8")
    print(report_text)

    # Persist tidy metrics for reuse.
    csv_path = OUTPUT_DIR / "forecast_eval_metrics.csv"
    metrics.round(4).to_csv(csv_path, index=False)

    figures = make_figure(df, args.horizon, args.min_train)
    print(section("ARTIFACTS WRITTEN"))
    print(f"  {(OUTPUT_DIR / 'forecast_eval.txt').relative_to(ROOT)}")
    print(f"  {csv_path.relative_to(ROOT)}")
    for p in figures:
        print(f"  {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
