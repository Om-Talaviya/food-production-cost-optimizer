# Food Production Cost Optimizer 🍲📊

<p align="left">
  <a href="https://github.com/Om-Talaviya"><img src="https://img.shields.io/badge/Architect-Om%20Talaviya-38bdf8?style=flat-square&logo=github&logoColor=white" alt="Author" /></a>
  <img src="https://img.shields.io/badge/Stack-React%20%26%20Node.js-61dafb?style=flat-square&logo=react&logoColor=white" alt="React & Node" />
  <a href="https://food-production-cost-optimizer.onrender.com/"><img src="https://img.shields.io/badge/Live%20Demo-Online-success?style=flat-square&logo=render&logoColor=white" alt="Live Demo" /></a>
</p>

A full-stack decision-support and analytics platform designed for food manufacturers, production managers, and food technology professionals to calculate, simulate, forecast, and optimize food production costs.

---

## 🚀 Live Demo & Interactive Walkthrough

The platform is deployed and publicly accessible online:

🔗 **Live Application URL:** **[https://food-production-cost-optimizer.onrender.com](https://food-production-cost-optimizer.onrender.com/)**

### ⚡ Instant Evaluation (Zero Registration Required)
You can evaluate all platform features without setting up an account:

1. **1-Click Guest DEMO Mode**: Click **"Enter Guest DEMO Mode"** on the Sign In modal to start an isolated sample session immediately.
2. **Pre-Seeded Manufacturing Businesses**: Click any business card on the Sign In modal to autofill credentials:
   - 🥐 **Sunrise Artisan Bakery**: `sunrise.bakery@example.com` / `Bakery@Demo2026`
   - 🥒 **GreenJar Foods**: `greenjar.foods@example.com` / `GreenJar@Demo2026`
   - 🍿 **CrunchCraft Snacks**: `crunchcraft.snacks@example.com` / `Snacks@Demo2026`
   - 🥛 **Cream & Culture**: `cream.culture@example.com` / `Dairy@Demo2026`

> [!TIP]
> Each demo profile features realistic Indian food processing batches, authentic commodity costs in ₹, supply chain pricing, and 8 months of historical batch data powering the 6-month statistical cost forecast and portfolio analytics.

---

## 🎯 Problem Statement & Executive Overview

In industrial food processing, determining unit profitability is complex due to:
1. **Unpredictable Raw Material Price Volatility**: Commodity price fluctuations (e.g. fruit pulp, vegetable oils, sugar).
2. **Process Loss & Yield Giveaway**: Thermal evaporation, kettle residue, spilling, and packaging overfill.
3. **High Overhead & Energy Costs**: Steam heating, flash pasteurization, cold storage, and plant depreciation.
4. **Complexity in Scenario Testing**: Lack of immediate feedback when testing "What-If" scenarios before committing to multi-ton production batches.

The **Food Production Cost Optimizer** solves these challenges by combining a **deterministic mathematical calculation engine**, a **dual-scenario What-If sandbox**, an **algorithmic cost-reduction optimizer**, a **statistical cost forecasting engine**, and a **context-aware AI advisor**.

---

## ✨ Key Features

### 1. 🧮 Production Cost Calculator
- Multi-ingredient formulation table with live unit price line-item summation.
- Categorized cost inputs: Packaging, Direct Labour, Electricity/Energy, Water Utilities, Transportation/Logistics, Fixed Plant Overheads, and Expected Wastage Loss (%).
- Instant precision output: Total Production Cost, Cost per Batch, Cost per Sellable Unit (kg/L/pack), Gross Profit, Gross Margin %, ROI %, and Contribution Margin.

### 2. ⚡ What-If Scenario Simulator
- Dual-column comparison: **Current Baseline Batch** vs **Simulated Scenario**.
- Interactive sliders for:
  - Ingredient price variance (-30% to +50%)
  - Process wastage rate shift (-5% to +10%)
  - Production batch scale multiplier (-50% to +200%)
  - Packaging, labour, energy adjustments
  - Target selling price repositioning
- Dynamic delta metrics displaying exact cash impact, unit cost shift, net profit change, and margin point variance.

### 3. 💡 Production Optimization Engine
- Algorithmic evaluation of batch composition.
- Detects high single-ingredient concentration risks (>20% total cost share), excessive wastage loss (>5%), packaging over-expenditure (>18%), and sub-optimal profit margins (<15%).
- Generates data-backed cost-saving recommendations with estimated minimum and maximum savings ranges.

### 4. 🤖 AI Production Cost Advisor
- Natural language query interface allowing users to ask operational questions ("How can I reduce unit cost?", "Why is my cost high?", "How to achieve 25% margin?").
- Context-aware: Automatically feeds structured active batch parameters to Google Gemini / OpenAI LLM APIs.
- Includes a **deterministic rule-based offline fallback engine** so the app keeps working when API keys are omitted.

### 5. 📈 Time-Series Cost Forecasting
- Forecasts future production unit costs using **Holt's Double Exponential Smoothing** and **Linear Trend Regression**.
- Computes 95% confidence intervals and standard errors.
- Visual time-series bar plot comparing historical actuals against 6-month predictive projections.
- CSV export functionality.
- Without a real batch history the app shows a clearly labeled **Sample Demo Dataset** (12 months of believable monthly history for **Premium Mango Jam**); it is marked as DEMO/sample data in the UI and is not real production records.

### 6. 🚚 Supplier Landed Cost Analysis
- Multi-supplier quote comparison matrix.
- Calculates **Net Effective Landed Unit Cost** = Base Unit Price + Transport Logistics Cost per Unit.
- Evaluates Lead Time (days), Minimum Order Quantity (MOQ), Quality Rating (1-5 stars), and Reliability Score (%).

### 7. 📦 Batch Management & Comparison
- Complete CRUD operations for production batches.
- Batch cloning/duplication for fast scenario creation.
- Pre-loaded industry recipe presets: *Premium Mango Jam, Classic Tomato Ketchup, Crispy Butter Biscuits, Tropical Multi-Fruit Juice, Spicy Raw Mango Pickle*.
- Side-by-side **Batch A vs Batch B** comparative audit tool.

### 8. 🔒 Security & Authentication
- JWT token-based authentication with secure password hashing (`bcryptjs`).
- **DEMO access** mode ("Enter DEMO Mode") for instant evaluation without registration — creates an isolated guest user with its own demo batch data; does not access or modify real user data.
- Secrets are loaded from environment variables via `.env` (see `.env.example`). Note: `server/middleware/authMiddleware.js` ships with a development-only fallback JWT secret — set a strong `JWT_SECRET` in production. In production, the app will fail to start if `JWT_SECRET` is not set.
- Request validation via Joi schemas on all mutating endpoints.
- CORS is restricted to a specific origin in production (configured via `CORS_ORIGIN` env var).
- Error responses are sanitized in production (no stack traces or internal details leaked).

---

## 📐 Mathematical Formulas & Calculation Engine

The business calculation engine (`server/utils/calculator.js` & `client/src/utils/calculator.js`) follows standardized industrial food engineering formulas:

1. **Raw Material Cost**:
   $$\text{Raw Material Cost} = \sum_{i=1}^{n} (\text{Quantity}_i \times \text{Unit Price}_i)$$

2. **Direct Production Cost**:
   $$\text{Direct Cost} = \text{Raw Materials} + \text{Packaging} + \text{Labour} + \text{Energy} + \text{Water} + \text{Logistics}$$

3. **Wastage Cost**:
   $$\text{Wastage Cost} = \text{Direct Cost} \times \left( \frac{\text{Wastage \%}}{100} \right)$$

4. **Total Production Cost**:
   $$\text{Total Cost} = \text{Direct Cost} + \text{Wastage Cost} + \text{Fixed Overhead}$$

5. **Sellable Net Quantity**:
   $$\text{Sellable Quantity} = \text{Batch Quantity} \times \left( 1 - \frac{\text{Wastage \%}}{100} \right)$$

6. **Unit Production Cost**:
   $$\text{Cost Per Unit} = \frac{\text{Total Production Cost}}{\text{Sellable Quantity}}$$

7. **Gross Profit & Margin**:
   $$\text{Gross Profit} = \text{Total Revenue} - \text{Total Production Cost}$$
   $$\text{Profit Margin \%} = \left( \frac{\text{Gross Profit}}{\text{Total Revenue}} \right) \times 100$$

8. **Break-Even Volume & Price**:
   $$\text{Contribution Margin / Unit} = \text{Selling Price} - \text{Variable Cost / Unit}$$
   $$\text{Break-Even Quantity} = \left\lceil \frac{\text{Fixed Overhead}}{\text{Contribution Margin / Unit}} \right\rceil$$
   $$\text{Break-Even Selling Price} = \frac{\text{Total Production Cost}}{\text{Sellable Quantity}}$$

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | Local MongoDB Community Server (offline-first) with automatic deterministic JSON fallback (`server/data/store.json`) |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js |
| **Validation** | Joi schema validation on all mutating endpoints |
| **AI Integration** | Google Gemini 1.5 Flash API / OpenAI GPT-4o-mini / Offline Rule Engine (deterministic fallback) |
| **Testing** | Node.js Native Test Runner (`node --test`) |

---

## 📂 Project Structure

```
Food Production Cost Optimizer/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, AuthModal, CostForecastChart, MarkdownRenderer
│   │   ├── pages/              # LandingPage, Dashboard, Calculator, WhatIfSimulator, Optimizer,
│   │   │                       # AIAdvisor, Forecasting, SupplierAnalysis, BatchManager, AnalyticsDashboard
│   │   ├── utils/              # Calculator, Optimizer Engine, Forecast Engine, Analytics Engine
│   │   ├── App.jsx             # Main Routing & Application Engine
│   │   ├── main.jsx
│   │   └── index.css           # Styling System & Glassmorphism Design Tokens
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                     # Node.js + Express Backend
│   ├── data/                   # Canonical Demo Data (demoBusinessesData.js) & Local JSON Store
│   ├── middleware/             # Auth Middleware, Validation (Joi schemas)
│   ├── routes/                 # Express API Endpoint Routes (apiRoutes.js)
│   ├── scripts/                # Seeder (seedDemoBusinesses.js), Migration (migrateToMongo.js)
│   ├── tests/                  # Test Suites (calculator, analytics, database, demoBusinesses, runAllTests)
│   ├── utils/                  # Database Coordinator, MongoStore, Calculator, AI Engine, Forecast Engine
│   ├── server.js               # Express Server Entrypoint
│   └── package.json
├── docs/                       # ARCHITECTURE.md, DEMO_BUSINESSES.md, OFFLINE_MONGODB_GUIDE.md, PRD, EDA
├── analysis/                   # Independent Python EDA & Forecast Evaluation Layer (eda.py, forecast_eval.py)
├── package.json                # Root Scripts (npm start, npm run dev, npm test, npm run build)
├── .env.example                # Sample Environment Variables
├── .gitignore                  # Git Exclusions
├── LICENSE                     # MIT License
└── README.md
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

### Quick Start (Zero-Config)
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Om-Talaviya/food-production-cost-optimizer.git
   cd "Food Production Cost Optimizer"
   ```

2. **Install Dependencies**:
   A single `npm install` at the root installs the root, server, and client packages (via a `postinstall` script):
   ```bash
   npm install
   ```
   Alternatively, install each package explicitly:
   ```bash
   npm install && npm install --prefix server && npm install --prefix client
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run Unit Tests**:
   ```bash
   npm test
   ```

5. **Start the Application**:
   - **Development**: run the API server and the Vite client in two terminals.
     ```bash
     npm run server      # API at http://localhost:5000
     npm run client      # Vite dev UI at http://localhost:3000
     ```
   - **Production (single service)**: build the client, then start the Express server which serves both the frontend and `/api` from the same origin.
     ```bash
     npm run build
     npm start           # App + API at http://localhost:5000
     ```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Fetch current authenticated user (JWT required) |
| `POST` | `/api/calculate` | Calculate complete batch economics |
| `POST` | `/api/whatif/simulate` | Execute side-by-side What-If simulation |
| `POST` | `/api/optimizer/analyze` | Run algorithmic cost optimization audit |
| `POST` | `/api/ai/advisor` | Query AI Advisor with structured batch context |
| `GET` | `/api/batches` | Retrieve saved production batches (JWT required) |
| `POST` | `/api/batches` | Save a new production batch (JWT required) |
| `GET` | `/api/batches/:id` | Retrieve a single batch (JWT required) |
| `PUT` | `/api/batches/:id` | Update a batch (JWT required) |
| `DELETE` | `/api/batches/:id` | Delete a batch (JWT required) |
| `POST` | `/api/batches/:id/duplicate` | Clone an existing batch (JWT required) |
| `GET` | `/api/forecast` | Retrieve time-series cost forecast |
| `GET` | `/api/suppliers` | Retrieve multi-supplier landed cost comparison |
| `POST` | `/api/suppliers` | Save a supplier record (JWT required) |
| `GET` | `/health` | Health check |

---

## 🌐 Deployment Guide

### Single-Service Production Deployment (Recommended)
This project runs as a **single service**: the Express backend serves the production React build from `client/dist`, and the `/api` endpoints are served from the **same origin**. No separate frontend host, reverse proxy, or CORS setup is required.

1. **Install all dependencies** (at the repository root — installs the root, server, and client packages):
   ```bash
   npm install && npm install --prefix server && npm install --prefix client && npm run build
   ```
2. **Start the production server**:
   ```bash
   npm start
   ```
3. The application is available at `http://localhost:5000`. Any non-API route returns the built frontend (`client/dist`), while `/api/*` requests are handled by the Express backend. If `client/dist` has not been built, the server runs API-only and logs a warning.

### Offline-First MongoDB & Dual-Engine Persistence
The platform features an **offline-first persistence coordinator** (`server/utils/database.js`):
1. **Primary Database**: Local MongoDB Community Server (`mongodb://127.0.0.1:27017/food_production_cost_optimizer`). Runs completely locally with zero internet dependency, indexed collections (`users`, `batches`, `suppliers`), and multi-tenant user scoping.
2. **Deterministic Fallback**: If the local MongoDB service is stopped or unreachable, the application automatically activates the local JSON file store (`server/data/store.json`) with zero downtime.
3. **Database Health Diagnostic**: Query `GET /health` to inspect the active storage engine, connection state, and live record counts.

### Demo Businesses & Academic Demonstration
The platform is pre-seeded with 4 realistic, distinct food manufacturing businesses (accessible via 1-click autofill in the Sign In modal):
- **🥐 Sunrise Artisan Bakery** (`sunrise.bakery@example.com` / `Bakery@Demo2026`): 10 artisan bakery batches (sourdough, brioche, croissants) measured in `kg`.
- **🥒 GreenJar Foods** (`greenjar.foods@example.com` / `GreenJar@Demo2026`): 10 traditional pickle & condiment batches with seasonality and mustard oil volatility.
- **🍿 CrunchCraft Snacks** (`crunchcraft.snacks@example.com` / `Snacks@Demo2026`): 10 snack production batches (namkeen, chips, extruded snacks) with high volume scaling.
- **🥛 Cream & Culture** (`cream.culture@example.com` / `Dairy@Demo2026`): 10 artisanal dairy batches with multi-unit measurement (`kg` and `L`), triggering intelligent portfolio mixed-units warnings.
- **Guest DEMO Mode**: An isolated in-memory sample session for quick non-registered walkthroughs.

### Offline AI vs Live AI Integrations
- **Live AI Mode**: Set `GEMINI_API_KEY` or `OPENAI_API_KEY` in `.env` to enable live LLM evaluation through Google Gemini 1.5 Flash or OpenAI GPT-4o-mini.
- **Offline Heuristic Mode**: When API keys are omitted or offline, the platform automatically activates its **deterministic rule-based offline AI advisor engine** (`DEMO_OFFLINE_AI`). Responses are calculated directly from active batch parameters, structured in formatted Markdown, and clearly designated with the offline heuristic badge.
- **Academic Dataset Disclaimers**: In Portfolio Analytics and Cost Forecasting, synthetic demo datasets are prominently marked with amber disclaimer banners (`🧪 Synthetic Academic Dataset Notice`) to distinguish illustrative samples from authentic user batches.

### Environment Variables
Set `JWT_SECRET` (required in production), and optionally `MONGODB_URI` (defaults to `mongodb://127.0.0.1:27017/food_production_cost_optimizer`), `GEMINI_API_KEY` or `OPENAI_API_KEY`. Optionally set `CORS_ORIGIN` to restrict the allowed frontend origin in production.

---

## 📜 License
MIT License

Developed as a personal portfolio project.
