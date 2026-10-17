# Evaluation

**Project:** Food Production Cost Optimizer — Business Analytics layer
**Scope:** verification of acceptance criteria, recorded test/build results, and the
forecast-model evaluation.

---

## 1. Environment

| Tool | Version |
| --- | --- |
| Node.js | v24.17.0 |
| Python | 3.13.14 (`python`) / 3.14.6 (`py`) |
| pandas / numpy / matplotlib | 3.0.6 / 2.4.3 / 3.11.2 |

All results below were produced by running the recorded commands in this
environment on the current working tree.

## 2. Acceptance-criteria verification

| AC | Criterion | Evidence | Result |
| --- | --- | --- | --- |
| AC-1 | `Analytics` tab reachable and renders | `Navbar.jsx` nav item + `App.jsx` route; builds cleanly | Pass |
| AC-2 | All panels present (KPIs, cost structure, ranking, margin bands, wastage, insights) | `AnalyticsDashboard.jsx`; build transforms components | Pass |
| AC-3 | "Export Analysis CSV" with stable, documented, secret-free header | `toCsv`/`ANALYSIS_COLUMNS` (32 cols); test asserts header + no identity/secret leakage | Pass |
| AC-4 | Empty dataset / zero denominators safe | `analytics.test.js` empty-dataset + `safeDiv` tests | Pass |
| AC-5 | `npm test` passes | 24 tests, 24 pass, 0 fail (see §3) | Pass |
| AC-6 | `npm run build` succeeds | Vite build EXIT 0 (see §4) | Pass |
| AC-7 | Python EDA + forecast eval run on committed sample | both scripts EXIT 0 on `analysis/data/*.csv` (see §5) | Pass |
| AC-8 | Docs complete (PRD, architecture, methodology, data dict, EDA, evaluation, decisions) | `docs/*.md` | Pass |

## 3. Test results (AC-5)

Command: `npm test` (root → `node --test tests/**/*.test.js` in `server/`)

```
tests 24   pass 24   fail 0
duration_ms 141.7
```

The pass/fail counts are stable; the `duration_ms` figure is wall-clock and varies
between runs (`node --test` timing), so treat it as representative (runs of roughly
140–290 ms have been observed on the same working tree).

Composition: 11 existing `calculator.test.js` tests + 13 new `analytics.test.js`
tests. The analytics suite dynamically `import()`s the shipping engine
(`client/src/utils/analyticsEngine.js`) and builds fixtures with the real server
`calculateBatchEconomics`, so it exercises production code rather than a copy.

Coverage of the new suite: row mapping and missing-economics defaults, `safeDiv`,
empty-dataset behaviour, `computePortfolioKpis`, `computeCostStructure` (7
categories), `rankProducts`, `computeMarginBands`, `computeWastageAnalysis`,
`generateInsights` (`loss-making` critical, `high-wastage`), `toCsv` header and
RFC4180 escaping, `escapeCsvField`, and a no-identity/no-secret export assertion.

## 4. Build result (AC-6)

Command: `npm run build` (root → `npm run build --prefix client` → `vite build`)

```
vite v5.4.21 building for production...
✓ 1531 modules transformed.
dist/index.html                0.48 kB  │ gzip:  0.31 kB
dist/assets/index-*.css       32.69 kB  │ gzip:  6.77 kB
dist/assets/index-*.js       345.63 kB  │ gzip: 93.37 kB
✓ built in 4.77s
EXIT 0
```

The Phase 2 Analytics page and navigation wiring compile with no errors.

## 5. Python layer (AC-7)

Commands (from the repository root):

```bash
node analysis/generate_sample_data.mjs
python analysis/eda.py
python analysis/forecast_eval.py
```

All three complete with EXIT 0 and write `analysis/outputs/`. Descriptive results
are in `docs/EDA.md`. Forecast results are in §6 below.

## 6. Forecast-model evaluation

**Script:** `analysis/forecast_eval.py`
**Input:** `analysis/data/sample_cost_series.csv`
**Scheme:** per-product holdout — first `N − h` months train, last `h` test
(`h = 3`, `min-train = 6`, 5 products, `n_train = 9`, `n_test = 3` each).
**Metrics:** MAE, RMSE, MAPE (%), and MAE skill vs. the best naive baseline
(`1 − MAE_model / MAE_best_naive`).

### 6.1 Aggregate (mean across products, sorted by MAPE)

| Model | MAE | RMSE | MAPE % | MAE skill vs. best naive |
| --- | ---: | ---: | ---: | ---: |
| `naive_last` | **2.451** | **2.612** | **1.884** | 0.0000 |
| `linear` | 2.295 | 2.590 | 1.968 | 0.0636 |
| `naive_mean` | 4.167 | 4.297 | 3.126 | −0.7001 |
| `hybrid (app)` | 4.906 | 5.416 | 3.406 | −1.0016 |
| `holt` | 8.490 | 8.941 | 5.494 | −2.4639 |

Best naive baseline MAE: **2.451** (`naive_last`).

### 6.2 Per-product metrics

| Product | Model | n_train | n_test | MAE | RMSE | MAPE % |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Classic Tomato Ketchup | naive_last | 9 | 3 | 0.187 | 0.204 | 0.209 |
| Classic Tomato Ketchup | linear | 9 | 3 | 0.505 | 0.530 | 0.565 |
| Classic Tomato Ketchup | hybrid (app) | 9 | 3 | 2.250 | 2.410 | 2.514 |
| Classic Tomato Ketchup | naive_mean | 9 | 3 | 4.204 | 4.209 | 4.698 |
| Classic Tomato Ketchup | holt | 9 | 3 | 4.454 | 4.615 | 4.977 |
| Crispy Butter Biscuits | linear | 9 | 3 | 1.125 | 1.333 | 0.496 |
| Crispy Butter Biscuits | naive_last | 9 | 3 | 3.527 | 3.653 | 1.555 |
| Crispy Butter Biscuits | naive_mean | 9 | 3 | 5.348 | 5.432 | 2.357 |
| Crispy Butter Biscuits | hybrid (app) | 9 | 3 | 11.984 | 12.130 | 5.280 |
| Crispy Butter Biscuits | holt | 9 | 3 | 22.927 | 23.205 | 10.101 |
| Premium Mango Jam | naive_last | 9 | 3 | 4.603 | 4.604 | 3.407 |
| Premium Mango Jam | linear | 9 | 3 | 4.847 | 4.900 | 3.603 |
| Premium Mango Jam | naive_mean | 9 | 3 | 5.027 | 5.175 | 3.748 |
| Premium Mango Jam | hybrid (app) | 9 | 3 | 6.576 | 7.903 | 4.966 |
| Premium Mango Jam | holt | 9 | 3 | 10.858 | 11.773 | 8.134 |
| Spicy Raw Mango Pickle | hybrid (app) | 9 | 3 | 1.523 | 1.815 | 0.772 |
| Spicy Raw Mango Pickle | naive_last | 9 | 3 | 1.867 | 2.039 | 0.939 |
| Spicy Raw Mango Pickle | holt | 9 | 3 | 2.244 | 2.494 | 1.127 |
| Spicy Raw Mango Pickle | linear | 9 | 3 | 2.577 | 3.164 | 1.308 |
| Spicy Raw Mango Pickle | naive_mean | 9 | 3 | 4.766 | 5.146 | 2.412 |
| Tropical Multi-Fruit Juice | naive_mean | 9 | 3 | 1.492 | 1.525 | 2.415 |
| Tropical Multi-Fruit Juice | holt | 9 | 3 | 1.968 | 2.620 | 3.130 |
| Tropical Multi-Fruit Juice | naive_last | 9 | 3 | 2.073 | 2.562 | 3.310 |
| Tropical Multi-Fruit Juice | hybrid (app) | 9 | 3 | 2.196 | 2.820 | 3.499 |
| Tropical Multi-Fruit Juice | linear | 9 | 3 | 2.424 | 3.026 | 3.868 |

### 6.3 Interpretation (honest, evidence-bound)

- On **this synthetic, low-noise series**, the simplest baseline (`naive_last`) is
  the strongest model on aggregate MAPE; `linear` edges it on MAE (skill 0.0636) but
  is worse on MAPE.
- The app's `hybrid` and `holt` models **underperform** the naive baseline here
  (negative skill). This is an *evaluation result*, not a defect claim: the series is
  near-stationary with small monthly noise, so smoothing-based models add variance
  rather than signal.
- On individual products the ranking differs: `linear` is best for Biscuits, and
  `hybrid` is best for Pickle — so model choice is product-dependent.
- **Do not generalise** these numbers to real production data; they describe a
  demonstration dataset. The value of the evaluation is the *method* (holdout,
  baseline-relative skill) and the honest reporting that the app's forecaster is not
  automatically the best.

## 7. Reproducibility

Every number above is reproducible from:

```bash
npm test
npm run build
node analysis/generate_sample_data.mjs
python analysis/eda.py
python analysis/forecast_eval.py
```

Scripts write only to `analysis/outputs/` (git-ignored, regenerable) and never
overwrite `analysis/data/*.csv` unless the generator is explicitly re-run.

## 8. Limitations

- Synthetic demo data (see `analysis/README.md` and `docs/EDA.md` §9).
- One holdout configuration (`h = 3`); not a rolling-origin backtest.
- MAPE is unstable near zero actuals; the guard prevents errors but does not make
  near-zero MAPE meaningful.
