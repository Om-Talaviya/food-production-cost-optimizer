# Methodology

**Project:** Food Production Cost Optimizer — Business Analytics layer
**Scope:** how metrics are defined, aggregated, analysed, and evaluated.

---

## 1. Unit of analysis

The base unit is a **production batch**: a product, a quantity, a unit of measure,
a selling price, and a full cost build-up computed by `calculateBatchEconomics`.
Batches are the row granularity of the analytics dataset and of the CSV export.

## 2. Cost taxonomy (7 fixed categories)

Every batch cost is decomposed into seven mutually exclusive categories that mirror
the existing Dashboard breakdown:

| # | Category | Source field |
| --- | --- | --- |
| 1 | Raw materials | `rawMaterialCost` |
| 2 | Packaging | `packagingCost` |
| 3 | Labour | `labourCost` |
| 4 | Energy + water | `energyCost` + `waterUtilitiesCost` |
| 5 | Logistics | `transportLogisticsCost` |
| 6 | Overheads | `overheadCost` |
| 7 | Wastage loss | `wastageCost` |

Category share is `safeDiv(categoryCost, Σ all categories) × 100`.

## 3. Derived measures

| Measure | Definition |
| --- | --- |
| `wastageQuantity` | `batchQuantity − sellableQuantity` |
| `topIngredientName` / `topIngredientCost` | ingredient with max `totalCost` |
| `topIngredientSharePct` | `safeDiv(topIngredientCost, rawMaterialCost) × 100` |
| `costPerUnit`, `grossProfit`, `profitMarginPercentage`, `roiPercentage`, `breakEvenQuantity` | taken verbatim from `batch.economics` (not recomputed) |

## 4. Portfolio aggregation (KPIs)

Given rows \(i = 1 \dots n\):

- \(\text{totalProductionCost} = \sum_i \text{totalProductionCost}_i\)
- \(\text{totalRevenue} = \sum_i \text{totalRevenue}_i\)
- \(\text{totalProfit} = \sum_i \text{grossProfit}_i\)
- \(\text{avgUnitCost} = \dfrac{\text{totalProductionCost}}{\sum_i \text{sellableQuantity}_i}\)
- \(\text{portfolioMarginPct} = \dfrac{\text{totalProfit}}{\text{totalRevenue}} \times 100\)
- \(\text{wastageSharePct} = \dfrac{\sum_i \text{wastageCost}_i}{\text{totalProductionCost}} \times 100\)

All divisions use `safeDiv` (DD-4): a zero, absent, or non-finite denominator yields
`0`, so empty datasets and zero-quantity batches are safe.

## 5. Product ranking

Products are aggregated to `totalRevenue`, `totalProfit`, `avgMarginPct` and sorted
by profit descending. Ranking is deterministic (ties broken by revenue, then name).

## 6. Margin bands

Each row is classified by `profitMarginPercentage` into fixed bands:

| Band | Range |
| --- | --- |
| Loss | `< 0%` |
| Thin | `0 – 10%` |
| Moderate | `10 – 20%` |
| Healthy | `20 – 35%` |
| Strong | `> 35%` |

Bands are a presentation aid for distribution, not a business recommendation.

## 7. Wastage analysis

Wastage cost is summed per product and as a portfolio share; the product with the
largest wastage cost is reported as the hotspot. Wastage is treated as **cost**, not
as lost revenue, to stay within the engine's existing `wastageCost` field.

## 8. Insight generation (deterministic rules)

Insights are produced by explicit predicates over the aggregates; each carries its
numeric evidence so a reader can verify it. Rules include (non-exhaustive):

- `no-data` (info): dataset is empty.
- `loss-making` (critical): one or more products with negative profit.
- `high-wastage` (warning): `wastageSharePct` above a fixed threshold.
- Concentration, margin-band and category rules over the computed aggregates.

Rules are pure and order-stable; there is no randomness or heuristics-on-heuristics.

## 9. Descriptive analysis (Python EDA)

`analysis/eda.py` computes, from the exported CSV: descriptive statistics, cost
structure shares, margin bands, product and category rollups, a correlation matrix
over numeric columns, and wastage analysis; it renders four figures. It uses only
pandas/numpy/matplotlib and writes to `analysis/outputs/`.

## 10. Forecast evaluation methodology

`analysis/forecast_eval.py` mirrors the app's forecast model (a hybrid of linear
regression and Holt's double exponential smoothing, α = 0.3, β = 0.1) and backtests
it against naive baselines using a **holdout** scheme: for each product, the first
`N − h` months train and the last `h` months test (default `h = 3`, `min-train = 6`).

Metrics (per product and aggregated):

- \(\text{MAE} = \frac{1}{h}\sum |y_t - \hat{y}_t|\)
- \(\text{RMSE} = \sqrt{\frac{1}{h}\sum (y_t - \hat{y}_t)^2}\)
- \(\text{MAPE} = \frac{100}{h}\sum \left|\frac{y_t - \hat{y}_t}{y_t}\right|\) — **note:** the
  denominator is the actual value \(y_t\); zero actuals are excluded (a guard against
  division by zero), matching `analysis/forecast_eval.py` (`mape()`). See
  `docs/evaluation.md` for the observed results.
- **Skill score** = \(1 - \frac{\text{MAE}_{\text{model}}}{\text{MAE}_{\text{best naive}}}\).
  Positive ⇒ beats the best naive baseline.

Models compared: `naive_last`, `naive_mean`, `linear`, `holt`, `hybrid (app)`.

## 11. Reproducibility

Every number in `docs/EDA.md` and `docs/evaluation.md` comes from running the CLI
scripts on the committed sample data. No manual editing of outputs; commands are in
`analysis/README.md`.

## 12. Limitations

- The bundled dataset is **synthetic**, generated deterministically from the app's
  own engines plus seeded monthly variation.
- Cost categories are a fixed taxonomy; unknown/new fields are not invented (DD-3).
- MAPE is unstable when actuals are near zero; the guard avoids division errors but
  does not make near-zero MAPE meaningful.
- Forecast evaluation reflects one holdout configuration, not a full rolling-origin
  backtest.
