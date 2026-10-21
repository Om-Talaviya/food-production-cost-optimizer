# Local MongoDB Integration & Offline-First Operation Guide

**Food Production Cost Optimizer**  
**Document Version:** 1.0.0  
**Target Architecture:** Local MongoDB Community Server (Windows / macOS / Linux)

---

## 1. Overview & Architecture

The application is engineered to operate **100% offline** without requiring internet access, external cloud services, or MongoDB Atlas accounts.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (Cost Calculator, What-If, Optimizer, Forecasting,   │
│    Analytics Dashboard, Suppliers, AI Advisor UI)      │
└───────────────────────────┬────────────────────────────┘
                            │ /api requests (local proxy)
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│               (server/utils/database.js)               │
└─────────────┬────────────────────────────┬─────────────┘
              │ Primary Engine             │ Safe Fallback
┌─────────────▼───────────────┐ ┌──────────▼───────────────┐
│       Local MongoDB         │ │      Local JSON Store     │
│   mongodb://127.0.0.1:27017 │ │   server/data/store.json  │
│  (Community Server Service) │ │  (Read/Write JSON Mirror) │
└─────────────────────────────┘ └───────────────────────────┘
```

---

## 2. Prerequisites & Verification

1. **MongoDB Community Server**: Installed locally on the host machine.
2. **Verify Windows Service**:
   ```powershell
   Get-Service -Name MongoDB
   ```
   *Expected output:* `Status: Running`

   To start if stopped:
   ```cmd
   net start MongoDB
   ```
   Or in PowerShell (Run as Administrator):
   ```powershell
   Start-Service MongoDB
   ```

3. **Verify TCP Port 27017 Listening**:
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
   ```
   *Expected output:* `TcpTestSucceeded: True`

---

## 3. Environment Configuration

Configuration is managed via environment variables in the project root `.env`:

```env
# Server Port
PORT=5000
NODE_ENV=development

# Authentication JWT Secret (min 32 chars in production)
JWT_SECRET=super_secret_jwt_key_replace_in_production_min32chars!

# Local MongoDB Connection String (Zero internet required)
MONGODB_URI=mongodb://127.0.0.1:27017/food_production_cost_optimizer

# Storage Engine Selection:
#   auto     - Connects to local MongoDB; safely falls back to store.json if MongoDB is down (Default)
#   mongodb  - Strictly enforces MongoDB persistence (startup fails if MongoDB is down)
#   json     - Operates strictly on local JSON file store (server/data/store.json)
STORAGE_BACKEND=auto

# Fallback Behavior:
#   true  - If local MongoDB is unreachable, activates local JSON store with clear diagnostic warning (Default)
#   false - Disables JSON fallback; throws error if MongoDB cannot be reached
ALLOW_STORE_FALLBACK=true
```

> **Security Note:** Real secrets must never be committed to source control. The `.gitignore` file excludes all `.env` files.

---

## 4. Safe Data Migration & Duplicate Prevention

Existing data in `server/data/store.json` represents user records. The migration tool:
- **Never deletes or modifies** the original `store.json`.
- **Prevents duplicate records**: Uses unique key checks (`id` and `email`) so running migration multiple times is completely idempotent.
- **Preserves existing MongoDB updates**: Won't overwrite newer MongoDB records with old JSON data unless explicitly forced with `--force`.

### Running Migration

To safely migrate records from `server/data/store.json` to MongoDB:

```bash
npm run migrate
```
Or directly via node:
```bash
node server/scripts/migrateToMongo.js
```

To force-overwrite MongoDB records with `store.json` content:
```bash
node server/scripts/migrateToMongo.js --force
```

---

## 5. Offline-First Verification

All core platform capabilities run strictly on local compute:
- **Batch Economics Calculation**: Local deterministic mathematics (`server/utils/calculator.js`).
- **What-If Simulation**: Local parametric sensitivity models.
- **Production Optimizer**: Local multi-variable rule engine (`server/utils/optimizerEngine.js`).
- **Statistical Forecasting**: Local Holt exponential smoothing and linear trend regressions over local batches.
- **Analytics Dashboard**: 100% client-side portfolio computations.
- **AI Production Cost Advisor**: Local deterministic heuristic rules engine (`DEMO_OFFLINE_AI`), zero external API keys needed.
- **Persistence**: Local MongoDB on loopback interface `127.0.0.1:27017`.

---

## 6. Troubleshooting Connection Failures

If MongoDB fails to connect:

1. **Check Service Status**:
   ```cmd
   net start MongoDB
   ```
2. **Inspect Error Logs**:
   Look at `server/server.js` startup logs. The system prints:
   ```
   ⚠️ LOCAL MONGODB CONNECTION NOTICE:
   Target URI: mongodb://127.0.0.1:27017/food_production_cost_optimizer
   Error: connect ECONNREFUSED 127.0.0.1:27017
   💡 To start local MongoDB Community Server on Windows:
      PowerShell: Start-Service MongoDB
      Command Prompt: net start MongoDB
   ```
3. **Safe Fallback**:
   When `STORAGE_BACKEND=auto` (default), the server automatically switches to `server/data/store.json` so you can continue working uninterrupted.
   Check `/health` to verify active storage mode:
   ```json
   {
     "status": "HEALTHY",
     "storage": {
       "backend": "json_fallback",
       "connected": true,
       "fallbackActive": true
     }
   }
   ```
4. **Reconnecting**:
   Once the MongoDB service is restarted, simply restart the backend server or run `npm run migrate` to sync any offline JSON changes into MongoDB.
