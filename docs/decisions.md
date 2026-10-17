# Decision Log

Architectural and methodology decisions for the Phase 2 Business Analytics layer.
Each entry records context, the decision, its consequences, and the alternatives
considered. Decisions DD-1…DD-6 were recorded up front in `TODO.md`; entries DD-7…
DD-10 were made during implementation.

---

## DD-1 — Single-source analytics logic

**Context.** The repository already duplicates batch-economics logic between the
Node server (`server/utils/calculator.js`) and the React client
(`client/src/utils/calculator.js`). Adding analytics risked a second duplication.

**Decision.** Put *all* aggregation, statistics, insight and CSV logic in one place:
`client/src/utils/analyticsEngine.js`, written as pure ESM functions with no React or
DOM imports.

**Consequences.**
- One implementation serves both the UI and the test suite.
- The module has no relative imports, so it can be loaded by the Node test runner via
  dynamic `import()` even though the client is `"type": "module"` and the server is
  CommonJS.
- The engine cannot use JSX or browser-only APIs; presentation stays in
  `AnalyticsDashboard.jsx`.

**Alternatives considered.** (a) Duplicate the engine in `server/utils/` — rejected
(second source of truth). (b) Put it in `server/` and import into the client —
rejected (client build would depend on server code).

---

## DD-2 — No new runtime dependencies

**Context.** Business dashboards commonly pull in a charting library (Recharts,
Chart.js, …). The project had zero charting dependencies.

**Decision.** Render all visualisations with the existing CSS-variable design system
and plain DOM (progress-style bars, tables, badges). Add no runtime dependency.

**Consequences.**
- No bundle-size or supply-chain cost; no `npm install` needed for the feature.
- Charts are simpler (no tooltips/zoom) — acceptable for an analytics overview.
- Visual language stays identical to the existing Dashboard.

**Alternatives considered.** Adding Recharts — rejected to keep the dependency
surface unchanged and preserve the existing visual system.

---

## DD-3 — No invented data fields

**Context.** The temptation in analytics is to synthesise fields (e.g. per-line
overhead splits) that the domain model does not actually produce.

**Decision.** The engine consumes only fields already produced by
`calculateBatchEconomics` plus batch metadata (`id`, `productName`,
`productCategory`, `createdAt`, `economics`). Missing fields degrade to `0`/`null`.

**Consequences.**
- Every exported column is traceable to a real source field.
- Batches with incomplete economics still export safely (defaulted, not dropped).

**Alternatives considered.** Recomputing economics inside the analytics layer —
rejected; it would diverge from the app's authoritative calculator.

---

## DD-4 — Safe division everywhere

**Context.** Ratios (shares, margins, unit costs) can divide by zero on empty
datasets, zero quantities, or zero revenue — a common source of `NaN`/`Infinity`
leaking into UI and CSV.

**Decision.** Route every ratio through `safeDiv(numerator, denominator)`, which
returns `0` for a zero, absent, or non-finite denominator.

**Consequences.**
- Empty dataset ⇒ zeroed KPIs + one explanatory insight rather than a crash.
- `NaN`/`Infinity` never reach the DOM or the CSV.

**Alternatives considered.** Guarding each call site inline — rejected (easy to
miss a site).

---

## DD-5 — Export safety

**Context.** Stored batches are held alongside user identity and a demo token in
`localStorage`.

**Decision.** The CSV contains only batch economics and product metadata. No user
id, name, email, company, token, or other secret is exported.

**Consequences.**
- Exported files are safe to share.
- A test asserts the header and the absence of identity/secret columns, so a future
  change cannot silently widen the export.

**Alternatives considered.** Exporting the raw batch object — rejected (would leak
identity and internal shape).

---

## DD-6 — Python independence

**Context.** The Node app and a Python analysis layer coexist. A hard coupling would
mean the app cannot run without Python, or vice versa.

**Decision.** `analysis/` is self-contained: a `requirements.txt` and CLI scripts.
It reads a CSV file (produced by the app or the committed sample) and never imports
Node code.

**Consequences.**
- The web app runs with or without Python installed.
- The analysis layer is reproducible from a CSV alone.

**Alternatives considered.** A shared JS/Python core — rejected (over-engineering;
the CSV is a clean contract).

---

## DD-7 — Deterministic synthetic sample data

**Context.** No real production dataset may be shipped, but the EDA and forecast
evaluation need data with known provenance.

**Decision.** Ship a generator (`analysis/generate_sample_data.mjs`) that reuses the
app's own engines to produce a deterministic 12-month, 5-product dataset
(`analysis/data/sample_production_dataset.csv`, 60 batches, 32 columns) and a per-month
cost series (`analysis/data/sample_cost_series.csv`).

**Consequences.**
- Data is reproducible byte-for-byte and clearly labelled as synthetic.
- Because it is low-noise by construction, it is a *demonstration* dataset, not a
  benchmark — documented as a limitation in `docs/EDA.md` and `docs/evaluation.md`.

**Alternatives considered.** Committing a real/derived dataset — rejected (privacy
and licensing).

---

## DD-8 — Treat analysis outputs as regenerable (git-ignored)

**Context.** EDA/forecast scripts emit text summaries and PNG figures.

**Decision.** Ignore `analysis/outputs/*` in Git but keep the directory via
`.gitkeep`; keep the *inputs* (`analysis/data/*.csv`) tracked.

**Consequences.**
- No binary churn in history; outputs regenerate from committed inputs + documented
  commands.
- Reviewers must run the scripts to see figures, which is the intended reproducible
  workflow.

**Alternatives considered.** Committing figures — rejected (diff noise, staleness).

---

## DD-9 — Baseline-relative forecast evaluation

**Context.** Reporting MAE/RMSE/MAPE in isolation does not say whether a model is
*good*; error magnitudes are scale-dependent.

**Decision.** Evaluate against naive baselines (`naive_last`, `naive_mean`) and report
**MAE skill** = `1 − MAE_model / MAE_best_naive`, plus per-product breakdowns.

**Consequences.**
- The evaluation surfaces that on this dataset the app's `hybrid`/`holt` forecasters
  *underperform* a naive baseline — reported honestly
  (`docs/evaluation.md` §6.3) rather than hidden.
- Model choice is shown to be product-dependent.

**Alternatives considered.** Reporting raw error only — rejected (uninformative).

---

## DD-10 — Preserve existing behaviour and the uncommitted README/LICENSE edits

**Context.** The working tree carries deliberate README (clone URL/badge) and LICENSE
(copyright holder) edits from Phase 1 that are **not** to be committed.

**Decision.** Phase 2 adds new files and makes only additive edits to wiring files
(`App.jsx`, `Navbar.jsx`, `.gitignore`). No existing feature is changed or removed, and
the README/LICENSE edits are left untouched and uncommitted.

**Consequences.**
- Existing tests keep passing unchanged (11 pre-existing tests still green).
- The diff is reviewable: additive feature work plus two small wiring edits.
