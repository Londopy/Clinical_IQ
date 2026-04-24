# Clinical_IQ

Point-of-care decision support for emergency medicine. Built for paramedics, nurses, and clinicians who need fast, reliable answers at the bedside.

**[Live demo →](https://londopy.github.io/Clinical_IQ/)**

---

## Features

| Tool | What it does |
|---|---|
| **Drug Search** | Browse 49 emergency drugs — mechanism, routes, reversal agents, controlled substance status |
| **Dose Calculator** | Weight-based dosing with allergy screening, renal adjustment, and dose-fraction control |
| **Drip Calculator** | IV pump rates (mL/hr), bag duration, and max-rate warnings from ordered dose and concentration |
| **Vitals Scorer** | NEWS2, qSOFA, and GCS simultaneously from one set of vitals |
| **Safety Checker** | Contraindication and interaction profile for any drug against a full patient picture |
| **Interactions** | Pairwise drug-drug interaction check across an entire medication list at once |

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + Radix UI (shadcn) |
| Animations | Framer Motion |
| Data fetching | TanStack Query + orval-generated hooks |
| Backend | Express + TypeScript |
| Clinical logic | Python — `drugdose`, `vitalscore` |
| IPC | TypeScript → Python via stdin/stdout JSON |
| Hosting | GitHub Pages (frontend) · Railway (backend) |

## Python Libraries

Clinical computations are powered by two PyPI packages authored by [londopy](https://pypi.org/user/londopy/):

- [`drugdose`](https://pypi.org/project/drugdose/) — drug database, weight-based dosing, contraindication and interaction checking
- [`vitalscore`](https://pypi.org/project/vitalscore/) — NEWS2, qSOFA, and GCS scoring

## Project Structure

```
artifacts/
  api-server/            # Express backend
    src/
      routes/            # drugs.ts, clinical.ts
      lib/python.ts      # Python subprocess runner
    python/              # dose.py, drip.py, vitals.py, safety.py,
                         # interactions.py, drugs.py
  clinical-tool/         # React + Vite frontend
    src/
      pages/             # dashboard, drug-search, dose-calculator,
                         # drip-calculator, vitals-scorer,
                         # safety-checker, interactions-checker
      components/        # layout.tsx, shadcn UI primitives
lib/
  api-spec/              # OpenAPI spec (source of truth)
  api-client-react/      # Generated TanStack Query hooks
  api-zod/               # Generated Zod request/response schemas
```

## Local Development

```bash
# 1. Install JS dependencies
pnpm install

# 2. Install Python packages
pip install drugdose vitalscore

# 3. Start the API server  (http://localhost:3000)
pnpm --filter @workspace/api-server run dev

# 4. Start the frontend   (http://localhost:5173)
pnpm --filter @workspace/clinical-tool run dev
```

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that builds the frontend with `BASE_PATH=/Clinical_IQ/` and `VITE_API_URL` (set as a repo variable) baked in, then deploys to GitHub Pages. The backend runs on Railway and is wired up automatically via the same env variable.

---

> **For educational use only. Always verify calculations independently before clinical use.**
