# Architecture

**Project:** Food Production Cost Optimizer (Phase 2: Business Analytics)

---

## 1. System overview

Two runtimes share one repository and communicate over a small CSV boundary:

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser SPA (React 19 + Vite + Tailwind, ESM)                   │
│                                                                  │
│  pages/            Dashboard, Calculator, WhatIf, Optimizer,     │
│                    AIAdvisor, Forecasting, Suppliers, Batches,   │
│                    AnalyticsDashboard  ← Phase 2                 │
│  utils/            calculator.js  (single-batch economics)       │
│                    analyticsEngine.js (pure portfolio analytics) │
│                    sampleData.js   (demo batch presets)          │
│  state             localStorage['foodcost_batches']              │
└───────────────┬──────────────────────────────────────────────────┘
                │  /api  (Vite dev proxy → localhost:5000)
┌───────────────▼──────────────────────────────────────────────────┐
│  Express API (Node, CommonJS)  server/server.js                  │
│  routes/apiRoutes.js → utils/{calculator,optimizerEngine,        │
│  forecastEngine, aiEngine, database, mongoStore, dbFallback}.js   │
│  persistence: local MongoDB (mongodb://127.0.0.1:27017)           │
│  with safe JSON fallback (server/data/store.json)                │
└───────────────┬──────────────────────────────────────────────────┘
                │  CSV files (analysis/data/*.csv)
┌───────────────▼──────────────────────────────────────────────────┐
│  Python analysis layer (independent)                             │
│  generate_sample_data.mjs (Node) → CSV                           │
│  eda.py, forecast_eval.py (pandas / numpy / matplotlib)          │
│  outputs: analysis/outputs/                                      │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Frontend

- **SPA shell** (`App.jsx`): owns `activeTab`, `batches`, `activeBatchId`, `user`,
  `token`; loads batches from `localStorage['foodcost_batches']` or demo presets.
- **Navigation** (`components/Navbar.jsx`): tab list; Phase 2 adds `analytics`.
- **Pages** (`pages/*.jsx`): each screen is a self-contained component receiving
  data + callbacks via props.
- **Styling**: a single CSS-variable design system in `index.css` (dark theme,
  glassmorphism header, `.card` / `.btn` / `.badge` / `.custom-table` primitives).
  Phase 2 reuses these classes; no charting library is introduced.

## 3. Analytics data flow

```
localStorage batches
      │  (each batch = preset + economics + createdAt)
      ▼
analyticsEngine.buildAnalysisRow(batch)   → one flat snake_case row
      ▼
analyticsEngine.buildDataset(batches)     → rows[]
      ├── computePortfolioKpis(rows)      → headline KPIs
      ├── computeCostStructure(rows)      → 7-category shares
      ├── rankProducts(rows)              → profitability ranking
      ├── computeMarginBands(rows)        → Loss/Thin/Moderate/Healthy/Strong
      ├── computeWastageAnalysis(rows)    → wastage cost + hotspots
      ├── generateInsights(rows, …)       → rule-based, evidence-carrying insights
      └── toCsv(rows, columns)            → RFC4180-style export
```

All of the above are **pure functions** with no React/DOM/network access, so they
are unit-testable directly from Node (see §5).

## 4. Single-source principle (DD-1)

Batch economics are **never recomputed** on the client. The row builder reads the
financial figures already produced by `calculateBatchEconomics` (via
`batch.economics`) plus batch metadata. This guarantees the analytics view and the
rest of the app agree by construction, and avoids the duplication that already
exists between the client/server copies of `calculator.js`.

## 5. Testing strategy

- The engine lives in **client ESM** (`client/src/utils/analyticsEngine.js`) with
  **no relative imports**, so Node's ESM loader can import it directly using an
  explicit `.js` specifier.
- `server/tests/analytics.test.js` (CommonJS, run by `node --test`) dynamically
  `import()`s the engine via `pathToFileURL`, using the *real* server
  `calculateBatchEconomics` to build fixtures. This tests the shipping code, not a
  copy of it.
- `server/tests/calculator.test.js` continues to assert known batch values.

## 6. Python independence (DD-6)

The `analysis/` layer reads CSV files only. It imports no Node code and shares no
state with the app. The Node app runs with or without Python; the Python scripts
run with or without the app (using committed sample data). The boundary is a plain
CSV file, so either side can be replaced independently.

## 7. Data & persistence boundaries

| Data | Location | In Git? |
| --- | --- | --- |
| App runtime store | `server/data/store.json` | No (ignored) |
| Client build | `client/dist/` | No (ignored) |
| Dependencies | `node_modules/` | No (ignored) |
| Synthetic analysis CSVs | `analysis/data/*.csv` | Yes (small, deterministic) |
| Generated analysis outputs | `analysis/outputs/*` | No (regenerable; `.gitkeep` only) |

## 8. Extension points

- **New insight rules**: add a pure predicate to `generateInsights` returning
  `{ id, severity, title, detail, evidence }`.
- **New cost categories**: extend `COST_CATEGORIES` and the matching column list.
- **BI export**: `toCsv` is generic; any column subset can be exported by passing a
  different `ANALYSIS_COLUMNS` selection.
- **Real data**: replace `analysis/data/*.csv` with an app export; the scripts accept
  `--input`.
