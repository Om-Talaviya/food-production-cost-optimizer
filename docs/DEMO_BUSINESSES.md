# Demo Businesses Guide & Credentials

**Food Production Cost Optimizer** comes preloaded with **4 realistic small food-production demo businesses**. Each account is configured with internally consistent economic metrics, distinct product categories, realistic raw material pricing in Indian Rupees (₹), and 8–10 historical production batches spanning 8 months to support time-series analytics and 6-month statistical forecasting.

> [!CAUTION]
> **Local Demonstration Only**: The credentials documented below are strictly intended for offline demonstration, academic review, and local evaluation. Never use demo passwords in production environments.

---

## 1. Demo Business Accounts & Credentials

| Business Name | Category | Contact Person | Email Address | Demo Password | Core Products |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sunrise Artisan Bakery** | Bakery & Confectionery | Aditi Sharma | `sunrise.bakery@example.com` | `Bakery@Demo2026` | Sourdough Loaves, Croissants, Chocolate Fudge Cake, Brioche Buns |
| **GreenJar Foods** | Pickles & Spices | Rajesh Patel | `greenjar.foods@example.com` | `GreenJar@Demo2026` | Mango Pickle, Lemon Pickle, Tomato Chutney, Amla Pickle |
| **CrunchCraft Snacks** | Snacks & Namkeen | Vikram Singhania | `crunchcraft.snacks@example.com` | `Snacks@Demo2026` | Ratlami Sev, Spiced Chana, Potato Wafers, Royal Mixture, Aloo Bhujia |
| **Cream & Culture** | Dairy & Desserts | Neha Kulkarni | `cream.culture@example.com` | `Dairy@Demo2026` | Malai Paneer, Greek Set Yogurt, Kesar Badam Milk, Gulab Jamun, Shrikhand |

### Existing Default Guest Account (Unauthenticated Sample Mode)
- **Email:** `guest@demo.com`
- **Password:** `guest123` (or click *"Enter Guest DEMO Mode"* on the sign-in modal)
- **Company:** Demo Foods Corp (Sample Data)

---

## 2. Business Profiles & Economic Characteristics

### User A: Sunrise Artisan Bakery
- **Focus:** Small-batch artisanal baked goods with premium butter, chocolate, and organic flour.
- **Key Ingredients:** Organic Maida (₹38–40/kg), Unsalted Butter (₹420–440/kg), Dark Chocolate 55% (₹650–660/kg), Farm Eggs (₹7–8/ea), Whole Milk (₹45–47/L).
- **Business Characteristics:** Moderate raw material costs with winter butter spikes; frequent small batch runs (150–600 units); occasional crust/baking defects (wastage 3.5% up to 8.2%); healthy profit margins averaging 18%–30%, with one promotional discounted batch (6.5% margin).
- **Key Goal:** Gross margin protection during dairy/cocoa ingredient inflation and bake defect reduction.

### User B: GreenJar Foods
- **Focus:** Traditional Indian pickles, seasonal fruit preserves, and savoury chutneys.
- **Key Ingredients:** Rajapuri Raw Mangoes (₹44–55/kg seasonal), Cold Pressed Mustard Oil (₹165–170/kg), Lemons (₹52–58/kg), Whole Spices, Glass Jars (₹14/unit).
- **Business Characteristics:** Highly seasonal mango and lemon procurement costs; substantial packaging expense (food-grade glass jars and induction-sealed caps); yield sensitivity during seeding and peeling (5.2%–8.5% wastage); average margins 22%–34%.
- **Key Goal:** Optimize bulk seasonal procurement timing when harvest market prices drop.

### User C: CrunchCraft Snacks
- **Focus:** High-volume traditional namkeen, fried chips, and roasted pulse snacks.
- **Key Ingredients:** Premium Besan (₹72–74/kg), Refined Cottonseed Frying Oil (₹120–142/kg), Processing Potatoes (₹22–25/kg), Whole Chickpeas (₹66–68/kg), Nitrogen Pouches (₹2.8/unit).
- **Business Characteristics:** High batch volume (1,000–2,000 kg); high sensitivity to vegetable oil price volatility (oil price shock batch included demonstrating margin squeeze to 4.8%); frying moisture loss and screening fines; average margins 12%–22%.
- **Key Goal:** Mitigate edible oil price fluctuation and maximize throughput per machine hour.

### User D: Cream & Culture
- **Focus:** Artisanal fresh paneer, cultured Greek yogurt, chilled dairy drinks, and traditional milk sweets.
- **Key Ingredients:** Raw Buffalo Milk 6.5% Fat (₹58–60/L), Cow Milk (₹44–46/L), Dairy Cream 40% (₹280–285/kg), Almonds & Kesar (₹850–880/kg), Starter Cultures.
- **Key Goal:** Perishable short-shelf-life inventory control, cold-chain energy cost management, and paneer whey yield optimization.

---

## 3. How to Seed Demo Businesses

Seeding is completely automated, idempotent, and non-destructive.

```powershell
# Run seeder into active local MongoDB database
npm run seed:demo-businesses

# Or dry-run to validate calculations and counts without database writes:
node server/scripts/seedDemoBusinesses.js --dry-run

# Or seed the offline JSON fallback store (server/data/store.json):
node server/scripts/seedDemoBusinesses.js --json
```

### Idempotency Guarantee
The seeder checks deterministic unique IDs (`user_demo_*`, `batch_*`, `sup_*`) and emails before writing:
- **First run:** Inserts 4 users, 40 batches, and 16 suppliers.
- **Subsequent runs:** Skips all existing documents with zero duplicates inserted.
- **Pre-existing data:** Preserves existing demo accounts, user records, and `store.json`.

---

## 4. How to Inspect & Verify in MongoDB Compass

1. Open **MongoDB Compass**.
2. Connect to local URI: `mongodb://127.0.0.1:27017`
3. Select database: **`food_production_cost_optimizer`**
4. Inspect collections:
   - **`users`** (Expected count: **6** — 2 preexisting + 4 demo businesses):
     - Filter query: `{ id: /^user_demo_/ }`
     - Verify `passwordHash` starts with `$2a$10$` (bcrypt hashed).
   - **`batches`** (Expected count: **54** — 14 preexisting + 40 demo business batches):
     - Filter by business: `{ userId: "user_demo_sunrise_bakery" }` (10 batches)
     - Filter by business: `{ userId: "user_demo_greenjar_foods" }` (10 batches)
     - Filter by business: `{ userId: "user_demo_crunchcraft_snacks" }` (10 batches)
     - Filter by business: `{ userId: "user_demo_cream_culture" }` (10 batches)
     - Note the calculated `economics` object embedded inside each batch document.
   - **`suppliers`** (Expected count: **19** — 3 preexisting + 16 demo suppliers):
     - View materials, landed costs, MOQs, lead times, and reliability percentages.

---

## 5. End-to-End Application Workflow Verification

After starting the application:

```powershell
# Terminal 1: Start Backend (Port 5000)
npm run server

# Terminal 2: Start Frontend (Port 5173)
npm run client
```

1. Open `http://localhost:5173` in your browser.
2. Click **Sign In** in the top navigation.
3. Click any **Demo Business (1-Click Fill)** button:
   - **🥐 Sunrise Bakery**
   - **🥒 GreenJar Foods**
   - **🍿 CrunchCraft Snacks**
   - **🥛 Cream & Culture**
4. Click **Sign In**:
   - The navigation header displays the logged-in business name and contact person.
   - **Dashboard**: Displays that business's active production batches, profit margins, and cost summary cards.
   - **Portfolio Analytics**: Automatically aggregates that specific company's 10 batches, cost structure breakdown, product rankings, margin distribution, and RFC 4180 CSV export.
   - **Forecasting**: Evaluates the 8-month historical unit costs and computes a real 6-month statistical forecast using Holt's Linear Trend Exponential Smoothing.
   - **Batch Manager**: View, filter by category, duplicate, edit, or delete any of that company's batches. Cross-tenant isolation guarantees other users cannot view or delete these records.
   - **Supplier Analysis**: Compare raw materials, lead times, MOQ thresholds, and landed costs across all verified suppliers.
   - **AI Advisor**: Ask cost optimization and what-if questions grounded in that business's active batch economics.
