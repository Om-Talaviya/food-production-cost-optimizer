# Data Dictionary

**Dataset:** analysis-ready flat export of production batches
**Granularity:** one row per batch
**Encoding:** UTF-8, comma-separated, header row, RFC4180-style quoting
**Producer:** `client/src/utils/analyticsEngine.js` (`ANALYSIS_COLUMNS`, `toCsv`)

---

## 1. Identity and metadata

| Column | Type | Unit | Description |
| --- | --- | --- | --- |
| `batch_id` | string | — | Stable batch identifier |
| `product_name` | string | — | Product name |
| `product_category` | string | — | Product category |
| `unit_of_measure` | string | — | Quantity unit (e.g. `kg`, `L`) |
| `created_at` | string (ISO) | — | Batch creation timestamp |

## 2. Quantity

| Column | Type | Unit | Description |
| --- | --- | --- | --- |
| `batch_quantity` | number | unit_of_measure | Total produced quantity |
| `sellable_quantity` | number | unit_of_measure | Quantity after wastage |
| `wastage_quantity` | number | unit_of_measure | `batch_quantity − sellable_quantity` |
| `wastage_percentage` | number | % | Wastage rate used by the engine |

## 3. Cost build-up

| Column | Type | Unit | Description |
| --- | --- | --- | --- |
| `raw_material_cost` | number | currency | Ingredient cost |
| `packaging_cost` | number | currency | Packaging cost |
| `labour_cost` | number | currency | Direct labour |
| `energy_cost` | number | currency | Energy |
| `water_utilities_cost` | number | currency | Water / utilities |
| `transport_logistics_cost` | number | currency | Transport / logistics |
| `overhead_cost` | number | currency | Allocated overheads |
| `wastage_cost` | number | currency | Cost of wastage loss |
| `total_variable_cost` | number | currency | Σ variable components |
| `total_production_cost` | number | currency | Total batch cost |

## 4. Pricing and profitability

| Column | Type | Unit | Description |
| --- | --- | --- | --- |
| `cost_per_unit` | number | currency | `total_production_cost / sellable_quantity` |
| `selling_price_per_unit` | number | currency | Planned selling price |
| `total_revenue` | number | currency | Revenue at planned price |
| `gross_profit` | number | currency | `total_revenue − total_production_cost` |
| `profit_margin_percentage` | number | % | `gross_profit / total_revenue × 100` |
| `roi_percentage` | number | % | Return on investment (engine) |
| `contribution_margin_per_unit` | number | currency | Unit contribution margin |
| `break_even_quantity` | number | unit_of_measure | Break-even volume |
| `break_even_revenue` | number | currency | Break-even revenue |

## 5. Ingredient-derived features

| Column | Type | Unit | Description |
| --- | --- | --- | --- |
| `ingredient_count` | integer | — | Number of ingredients |
| `top_ingredient_name` | string | — | Ingredient with the largest `totalCost` |
| `top_ingredient_cost` | number | currency | Its total cost |
| `top_ingredient_share_pct` | number | % | `top_ingredient_cost / raw_material_cost × 100` |

## 6. Column order (stable export header)

The export always writes columns in this order, defined by `ANALYSIS_COLUMNS`:

```
batch_id, product_name, product_category, unit_of_measure, batch_quantity,
sellable_quantity, wastage_quantity, wastage_percentage, raw_material_cost,
packaging_cost, labour_cost, energy_cost, water_utilities_cost,
transport_logistics_cost, overhead_cost, wastage_cost, total_variable_cost,
total_production_cost, cost_per_unit, selling_price_per_unit, total_revenue,
gross_profit, profit_margin_percentage, roi_percentage,
contribution_margin_per_unit, break_even_quantity, break_even_revenue,
ingredient_count, top_ingredient_name, top_ingredient_cost,
top_ingredient_share_pct, created_at
```

## 7. Missing / degraded values (DD-3)

- If a batch has no `economics`, all numeric columns become `0` and string columns
  become `null`/empty; the row is still emitted (never dropped silently).
- `top_ingredient_share_pct` is `0` when `raw_material_cost` is `0` (safe division).

## 8. Cost-series file (forecast input)

`analysis/data/sample_cost_series.csv` — one row per product-month:

| Column | Type | Description |
| --- | --- | --- |
| `date` | date (`YYYY-MM-DD`) | Period start |
| `product` | string | Product name |
| `cost_per_unit` | number | Unit cost that month |
| `raw_material_cost` | number | Raw-material component |
| `production_quantity` | number | Quantity produced |

## 9. Privacy / safety (DD-5)

The export contains **no** user identity, email, password, JWT, or API key. Only
batch economics and product metadata are written.
