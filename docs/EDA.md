# Exploratory Data Analysis (EDA)

**Script:** `analysis/eda.py` (pandas / numpy / matplotlib)
**Input:** `analysis/data/sample_production_dataset.csv`
**Output:** `analysis/outputs/eda_summary.txt` + 4 PNG figures
**Dataset:** synthetic demo data (see `analysis/README.md` provenance notes)

> Reproduce with: `pip install -r analysis/requirements.txt` then
> `python analysis/eda.py` (see `analysis/README.md`).

---

## 0. Shape and provenance

| Fact | Value |
| --- | --- |
| Rows (batches) | 60 |
| Columns (EDA view) | 33 = 32 exported columns + 1 derived `month` |
| Products | 5 |
| Categories | 5 |

`eda.py` derives `month` from `created_at` (`%Y-%m`) and reports it alongside the
exported columns, which is why the EDA view has one more column than the 32-column
export (`docs/data-dictionary.md`). No exported column is modified.

Each product contributes 12 monthly batches. Because the generator reuses the
application's own `calculateBatchEconomics`, all inter-field relationships
(cost build-up, break-even, margins) are internally consistent; only the inputs are
synthetic.

## 1. Descriptive statistics (key numeric fields)

| Field | mean | std | min | median | max | missing |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `batch_quantity` | 1905.27 | 1885.76 | 300.00 | 1082.50 | 5825.00 | 0 |
| `sellable_quantity` | 1827.85 | 1834.07 | 283.53 | 998.38 | 5591.88 | 0 |
| `wastage_quantity` | 77.42 | 61.92 | 14.51 | 69.83 | 287.17 | 0 |
| `wastage_percentage` | 4.82 | 1.79 | 2.22 | 5.05 | 9.55 | 0 |
| `total_production_cost` | 166988.60 | 89572.21 | 58652.96 | 139510.02 | 352762.57 | 0 |
| `cost_per_unit` | 144.99 | 64.48 | 59.51 | 136.49 | 239.33 | 0 |
| `selling_price_per_unit` | 175.10 | 80.03 | 67.65 | 167.54 | 307.80 | 0 |
| `total_revenue` | 197674.74 | 103085.38 | 78790.15 | 166536.72 | 415140.80 | 0 |
| `gross_profit` | 30686.14 | 21270.80 | −10001.66 | 30957.64 | 77772.14 | 0 |
| `profit_margin_percentage` | 16.01 | 11.12 | −9.55 | 15.84 | 35.78 | 0 |
| `roi_percentage` | 21.12 | 16.02 | −8.72 | 18.83 | 55.70 | 0 |
| `contribution_margin_per_unit` | 41.70 | 35.88 | −1.67 | 30.46 | 125.95 | 0 |

No missing values in any key field.

## 2. Cost structure (share of total production cost)

| Category | Total cost | Share |
| --- | ---: | ---: |
| Raw materials | 5,339,870.81 | 53.30% |
| Packaging | 1,383,154.68 | 13.80% |
| Labour | 934,207.09 | 9.32% |
| Energy | 616,895.51 | 6.16% |
| Water / utilities | 119,693.47 | 1.19% |
| Transport / logistics | 424,402.77 | 4.24% |
| Overheads | 813,849.55 | 8.12% |
| Wastage loss | 387,241.91 | 3.86% |

**Reading:** raw materials are the dominant driver (53.3%); the seven-category
structure matches the app Dashboard and `docs/methodology.md` §2.

This table lists Energy and Water / utilities as separate lines (8 cost lines) because
they are distinct columns in the exported CSV; the app's seven-category taxonomy merges
them into a single **Energy + water** category (`docs/methodology.md` §2). The
seven-category totals are identical either way.

## 3. Profit-margin distribution

| Band | Batches |
| --- | ---: |
| Loss (`<0%`) | 6 |
| Thin (`0–10%`) | 10 |
| Moderate (`10–20%`) | 23 |
| Healthy (`20–35%`) | 19 |
| Strong (`>35%`) | 2 |

Mean margin **16.01%**, median **15.84%**, std **11.12** — a right-leaning spread
with a loss-making tail of 6 batches.

## 4. Product rollup (sorted by total gross profit)

| Product | Batches | Total revenue | Total cost | Total profit | Mean margin | Mean unit cost | Mean wastage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Tropical Multi-Fruit Juice | 12 | 4,480,058.89 | 3,889,965.81 | 590,093.09 | 12.91% | 61.77 | 2.96% |
| Classic Tomato Ketchup | 12 | 2,837,451.72 | 2,277,651.62 | 559,800.08 | 19.35% | 92.66 | 5.27% |
| Premium Mango Jam | 12 | 2,018,549.25 | 1,656,909.49 | 361,639.77 | 17.68% | 137.42 | 7.10% |
| Spicy Raw Mango Pickle | 12 | 1,081,598.15 | 744,428.12 | 337,170.02 | 30.96% | 201.98 | 5.41% |
| Crispy Butter Biscuits | 12 | 1,442,826.41 | 1,450,360.69 | −7,534.28 | −0.85% | 231.10 | 3.35% |

**Reading:** Biscuits is the only loss-making product (negative aggregate profit);
Pickle is the most margin-efficient per unit despite the highest unit cost.

## 5. Category rollup

| Category | Batches | Total revenue | Total profit | Mean margin |
| --- | ---: | ---: | ---: | ---: |
| Beverages | 12 | 4,480,058.89 | 590,093.09 | 12.91% |
| Sauces & Condiments | 12 | 2,837,451.72 | 559,800.08 | 19.35% |
| Preserves & Jams | 12 | 2,018,549.25 | 361,639.77 | 17.68% |
| Pickles & Spices | 12 | 1,081,598.15 | 337,170.02 | 30.96% |
| Bakery & Confectionery | 12 | 1,442,826.41 | −7,534.28 | −0.85% |

## 6. Correlation matrix (Pearson) — selected drivers

| | raw_material_cost | batch_quantity | cost_per_unit | profit_margin_% | gross_profit |
| --- | ---: | ---: | ---: | ---: | ---: |
| raw_material_cost | 1.00 | 0.97 | −0.83 | −0.26 | 0.55 |
| batch_quantity | 0.97 | 1.00 | −0.85 | −0.10 | 0.62 |
| cost_per_unit | −0.83 | −0.85 | 1.00 | −0.16 | −0.79 |
| profit_margin_percentage | −0.26 | −0.10 | −0.16 | 1.00 | 0.59 |
| gross_profit | 0.55 | 0.62 | −0.79 | 0.59 | 1.00 |

**Reading:** `cost_per_unit` is strongly **negatively** correlated with batch size
(−0.85) — economies of scale. `gross_profit` correlates negatively with unit cost
(−0.79) and positively with volume (0.62). These are associations in synthetic data,
not causal claims.

## 7. Wastage analysis

| Statistic | Value |
| --- | --- |
| Mean wastage | 4.82% |
| Min / max | 2.22% / 9.55% |
| Total wastage cost | 387,241.91 (3.86% of total production cost) |

Top 5 batches by wastage %:

| Product | Month | Wastage % | Wastage cost |
| --- | --- | ---: | ---: |
| Premium Mango Jam | 2026-05 | 9.55 | 11,288.84 |
| Premium Mango Jam | 2026-07 | 9.27 | 11,188.64 |
| Premium Mango Jam | 2026-11 | 8.97 | 11,337.95 |
| Spicy Raw Mango Pickle | 2026-08 | 7.82 | 4,282.29 |
| Classic Tomato Ketchup | 2026-01 | 7.07 | 10,865.39 |

**Reading:** Mango Jam repeatedly shows the highest wastage rate; the hotspot is
concentrated in one product rather than spread evenly.

## 8. Figures

| File | Shows |
| --- | --- |
| `fig_cost_structure.png` | Cost-category shares |
| `fig_margin_distribution.png` | Batches per margin band |
| `fig_unit_cost_trend.png` | Mean unit cost by month |
| `fig_category_profit.png` | Total profit by category |
| `fig_forecast_actual_vs_pred.png` | Forecast vs. actual (from `forecast_eval.py`) |

## 9. Limitations

- Data is **synthetic** and low-noise relative to real production; magnitudes are
  illustrative, not a benchmark.
- Correlations describe this generated sample only.
- The EDA assumes the 32-column export schema; unknown columns are ignored, not
  inferred (`analysis/eda.py` selects known columns by name).
