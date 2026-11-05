# SpatialForge

Turn a single product photo into an interactive 3D model.

Upload a clear image of one object. SpatialForge generates a visual 3D approximation that you can rotate, inspect, and download in the browser.

> **Screenshot placeholder:** Add a product screenshot here after Phase 2–5.

---

## Current status

**Phase 5 complete:** frontend talks to the mock API — health badge, upload, job polling, progress, model viewer, download, and generate-another.

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository setup | Done |
| 2 | Static frontend UI | Done |
| 3 | Model viewer + sample GLB | Done |
| 4 | Mock FastAPI generation API | Done |
| 5 | Frontend API integration | Done |
| 6 | Standalone TRELLIS test | Pending |
| 7 | TRELLIS service integration | Pending |
| 8 | Hardening + final README | Pending |

---

## Technology stack

- **Frontend:** React (JavaScript/JSX), Vite, standard CSS, `@google/model-viewer` (Phase 3)
- **Backend:** Python, FastAPI, Uvicorn, Pillow
- **Generation:** Microsoft TRELLIS.2-4B (Phases 6–7); mock mode for local UI work

Not used: TypeScript, Next.js, Tailwind, Bootstrap, Material UI, Redux, Blender, database, auth.

---

## Architecture

```
React frontend (localhost:5173)
        │ HTTP API
        ▼
FastAPI backend (localhost:8000)
        │ Python call
        ▼
TRELLIS GPU service (Linux GPU; mock mode on local machines)
```

---

## Folder structure

```
threplica/
├── README.md
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
└── backend/
    ├── requirements.txt
    ├── .env.example
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── schemas.py
    │   ├── routes/
    │   ├── services/
    │   └── workers/
    ├── storage/
    │   ├── uploads/
    │   ├── models/
    │   ├── posters/
    │   └── jobs/
    └── scripts/
        ├── test_trellis.py
        └── download_models.py
```

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ recommended (3.12–3.14 may work for mock-mode development)
- For real TRELLIS (later): Linux, NVIDIA GPU, CUDA, ~16 GB+ model download

---

## Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Windows (PowerShell)

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

---

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Windows (PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
Copy-Item .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Mock-mode setup

In `backend/.env`:

```env
TRELLIS_MOCK_MODE=true
```

Mock mode is the default. Jobs advance through fake stages over ~7 seconds and return a copy of the sample GLB. The API contracts match real mode, so the React app does not need to know which mode is enabled.

---

## Real TRELLIS setup

Documented in Phase 6–7. For a rented GPU, follow **[docs/RUNPOD.md](docs/RUNPOD.md)** (recommended path).

Requires cloning the official TRELLIS.2 repository on a Linux GPU machine and setting:

```env
TRELLIS_MOCK_MODE=false
TRELLIS_REPO_PATH=/workspace/TRELLIS.2
TRELLIS_MODEL_ID=microsoft/TRELLIS.2-4B
HF_TOKEN=your_token_if_needed
```

---

## Environment variables

### Frontend (`frontend/.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

### Backend (`backend/.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `APP_ENV` | `development` | Environment name |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `PUBLIC_BASE_URL` | `http://localhost:8000` | Public URL for model links |
| `STORAGE_ROOT` | `./storage` | Local storage root |
| `MAX_UPLOAD_MB` | `10` | Upload size limit |
| `TRELLIS_MOCK_MODE` | `true` | Skip GPU / use mock jobs |
| `TRELLIS_REPO_PATH` | `/workspace/TRELLIS.2` | Path to TRELLIS.2 clone |
| `TRELLIS_MODEL_ID` | `microsoft/TRELLIS.2-4B` | Hugging Face model id |
| `HF_TOKEN` | | Optional Hugging Face token |

Do not commit `.env` files.

---

## Local development commands

```bash
# Terminal 1 — frontend
cd frontend && npm run dev

# Terminal 2 — backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## API endpoints (Phase 1)

| Method | Path | Status |
|--------|------|--------|
| `GET` | `/` | Root info |
| `GET` | `/api/health` | Health / readiness |
| `POST` | `/api/generations` | Create generation job (202) |
| `GET` | `/api/jobs/{job_id}` | Poll job status |
| `GET` | `/api/jobs/{job_id}/download` | Download GLB |
| `GET` | `/models/{filename}` | Serve generated GLB |

### Example health response

```json
{
  "status": "ok",
  "gpu_available": false,
  "model_loaded": true,
  "active_job": false
}
```

In mock mode, `model_loaded` is `true` and `gpu_available` is `false`.

---

## Deployment notes

- **Frontend:** `npm run build` → deploy `frontend/dist` to static hosting.
- **Backend:** Deploy FastAPI + TRELLIS on a Linux NVIDIA GPU host. Do not run TRELLIS on static frontend hosts.
- **Phases:** A (local mock) → B (local React + GPU API) → C (public React + GPU API).

---

## Known limitations

- Version one is a personal proof of concept.
- Generated models are visual estimates, not dimensionally accurate.
- One user, one generation at a time.
- No auth, payments, or long-term model library.
- Real TRELLIS requires a large GPU download (~16 GB).

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Frontend cannot reach API | Confirm `VITE_API_BASE_URL` and that the backend is on port 8000 |
| CORS errors | Set `FRONTEND_ORIGIN` to your Vite origin (default `http://localhost:5173`) |
| Backend import errors | Run uvicorn from the `backend/` directory with the venv active |
| Port already in use | Change Vite/Uvicorn ports or stop the conflicting process |

---

## License / attribution

SpatialForge is a personal project. TRELLIS.2 is provided by Microsoft under its own license terms.
