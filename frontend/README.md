# AeroDispatch Frontend (React 19 + Vite)

A modern, responsive logistics dispatch interface configured to connect seamlessly to the local Python FastAPI backend (`http://localhost:8000`) or fall back gracefully to local state when offline.

## 🚀 Running on Windows

```powershell
# Navigate to frontend folder
cd C:\Users\micro\.gemini\antigravity-ide\scratch\aero-dispatch\frontend

# Ensure environment file exists
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Visit the application at: `http://localhost:5173`

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
* `VITE_API_BASE_URL`: Base URL of the backend (Default: `http://localhost:8000`)
* `VITE_WS_BASE_URL`: WebSocket URL for live telemetry (Default: `ws://localhost:8000`)

## 🛠️ Build & Lint

* `npm run lint` — Runs Oxlint checks across all JSX and JS files
* `npm run build` — Generates optimized production build in `dist/`
