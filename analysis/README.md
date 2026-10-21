# Analysis Layer — Food Production Cost Analytics

Reproducible Python analysis over the app's analysis-ready data export.

This layer is **independent of the Node.js application runtime**: it reads CSV
files and never imports any JavaScript/Node code, so the web app keeps working
even if Python is unavailable, and vice versa.

## Contents

| File | Purpose |
| --- | --- |
| `generate_sample_data.mjs` | Deterministic generator for the **synthetic demo dataset** (Node; reuses the app's own cost engine). |
| `eda.py` | Exploratory Data Analysis: descriptive stats, cost structure, margin bands, product/category rollups, correlations, wastage. |
| `forecast_eval.py` | Backtest of the forecasting models against naive baselines (MAE / RMSE / MAPE). |
| `requirements.txt` | Python dependencies. |
| `data/` | Generated CSV inputs (synthetic demo data). |
| `outputs/` | Generated summaries, metric tables and figures. |

## Prerequisites

- **Node.js** for `generate_sample_data.mjs` (delegates all cost math to the
  app: `client/src/utils/calculator.js` and `client/src/utils/analyticsEngine.js`).
- **Python 3.11+** with the packages in `requirements.txt`.

```bash
pip install -r analysis/requirements.txt
```

## Reproduce (from the repository root)

```bash
# 1. Generate the synthetic demo dataset (deterministic — same output every run)
node analysis/generate_sample_data.mjs

# 2. Exploratory data analysis
python analysis/eda.py

# 3. Forecast model evaluation
python analysis/forecast_eval.py
```

Optional: point the scripts at your own export instead of the demo data.

```bash
python analysis/eda.py --input analysis/data/sample_production_dataset.csv
python analysis/forecast_eval.py --input analysis/data/sample_cost_series.csv --horizon 3
```

## Generated artifacts (`analysis/outputs/`)

- `eda_summary.txt`, `fig_cost_structure.png`, `fig_margin_distribution.png`,
  `fig_unit_cost_trend.png`, `fig_category_profit.png`
- `forecast_eval.txt`, `forecast_eval_metrics.csv`, `fig_forecast_actual_vs_pred.png`

## Data dictionary (production dataset)

Exported by the app's **Analytics** tab (and reproduced here by the generator).
All 32 columns are `snake_case`; amounts are in the dataset's own currency unit.

| Column | Meaning |
| --- | --- |
| `batch_id`, `product_name`, `product_category`, `unit_of_measure` | Batch identity / metadata |
| `batch_quantity`, `sellable_quantity`, `wastage_quantity`, `wastage_percentage` | Volume and loss |
| `raw_material_cost`, `packaging_cost`, `labour_cost`, `energy_cost`, `water_utilities_cost`, `transport_logistics_cost`, `overhead_cost`, `wastage_cost` | Cost categories |
| `total_variable_cost`, `total_production_cost` | Cost totals |
| `cost_per_unit`, `selling_price_per_unit` | Unit economics |
| `total_revenue`, `gross_profit`, `profit_margin_percentage`, `roi_percentage` | Profitability |
| `contribution_margin_per_unit` | Contribution margin |
| `break_even_quantity`, `break_even_revenue` | Break-even |
| `ingredient_count`, `top_ingredient_name`, `top_ingredient_cost`, `top_ingredient_share_pct` | Ingredient concentration |
| `created_at` | Batch timestamp |

The forecast series (`data/sample_cost_series.csv`) uses the app's forecast
input shape: `date, product, cost_per_unit, raw_material_cost, production_quantity`.

## Data provenance and limitations

- **The bundled dataset is synthetic.** It is generated deterministically for
  demonstration, testing and portfolio purposes. It is **not** real production,
  financial or business data, and must not be used for financial decisions.
- The generator reuses the application's real `calculateBatchEconomics` engine,
  so inter-field relationships (cost build-up, break-even, margins) are
  internally consistent; only the *inputs* (quantities, prices, wastage) are
  synthetic.
- Seed and seasonality are fixed, so `node analysis/generate_sample_data.mjs`
  reproduces byte-identical CSVs on any machine with a compatible Node version.
- Forecast accuracy in `forecast_eval.py` reflects this low-noise synthetic
  series; it is an illustrative evaluation of the *method*, not a claim about
  real-world forecasting performance.
