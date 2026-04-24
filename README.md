# Clinical_IQ

A clinical decision support tool for emergency medicine, built for paramedics, nurses, and clinicians who need fast, reliable answers at the bedside.

**[Live →](https://londopy.github.io/Clinical_IQ/)**

## Features

- **Drug Search** — browse and search 49 emergency drugs with full clinical detail: mechanism, routes, reversal agents, and controlled substance status
- **Dose Calculator** — weight-based dosing with patient-aware safety checks (allergies, conditions, renal impairment, drug interactions)
- **Drip Calculator** — IV pump rates in mL/hr with bag duration and concentration, for continuous infusions
- **Vitals Scorer** — simultaneous NEWS2 risk score, qSOFA sepsis alert, and GCS severity from a single set of vitals
- **Safety Checker** — full contraindication and drug interaction profile for any drug against a patient profile

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Radix UI + Tailwind CSS |
| State / data fetching | TanStack Query |
| Backend | Express + TypeScript |
| Clinical computation | Python (`drugdose`, `vitalscore`) |
| Inter-process | TypeScript → Python via stdin/stdout JSON |
| Hosting | GitHub Pages (frontend) + Railway (backend) |

## Python Libraries

Clinical computations are powered by two PyPI libraries by me, [Londopy](https://pypi.org/user/londopy/):

- [`drugdose`](https://pypi.org/project/drugdose/) — drug database, weight-based dosing, contraindication and interaction checking
- [`vitalscore`](https://pypi.org/project/vitalscore/) — NEWS2, qSOFA, and GCS scoring

## Project Structure

```
artifacts/
  api-server/          # Express backend
    src/
      routes/          # clinical.ts, drugs.ts
      lib/python.ts    # Python subprocess runner
    python/            # Python scripts (dose, drip, vitals, safety, drugs)
  clinical-tool/       # React Vite frontend
    src/
      pages/           # drug-search, dose-calculator, drip-calculator,
                       # vitals-scorer, safety-checker
      components/      # layout, shared UI
lib/
  api-spec/            # OpenAPI spec
  api-client-react/    # Generated TanStack Query hooks
  api-zod/             # Generated Zod schemas
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Install Python packages
pip install drugdose vitalscore

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (runs on http://localhost:5173)
pnpm --filter @workspace/clinical-tool run dev
```

## Deployment

The frontend deploys automatically to GitHub Pages on every push to `main` via GitHub Actions. The backend runs on Railway and is pointed to by `VITE_API_URL` at build time.

---

> **For educational use only. Verify all clinical calculations independently before use.**
