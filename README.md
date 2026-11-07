# AeroDispatch — Cloud-Native Logistics & Telemetry Engine

AeroDispatch is a high-performance logistics dispatch and air consignment tracking platform engineered with a React 19 + Vite frontend and a local Python FastAPI backend (emulating AWS Lambda, DynamoDB Single-Table Design, Cognito JWT RBAC, and S3 Proof-of-Delivery).

---

## 🚀 Quick Start on Windows (Separate Terminals)

Run the backend and frontend simultaneously in two separate PowerShell terminals.

### Terminal 1: Start Python Backend (FastAPI / Uvicorn)

```powershell
# 1. Navigate to the backend directory
cd C:\Users\micro\.gemini\antigravity-ide\scratch\aero-dispatch\backend

# 2. Run the FastAPI development server with live reload
uv run uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend URL: `http://127.0.0.1:8000`
* Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`
* Health Endpoint: `http://127.0.0.1:8000/health`

---

### Terminal 2: Start React Frontend (Vite)

```powershell
# 1. Navigate to the frontend directory
cd C:\Users\micro\.gemini\antigravity-ide\scratch\aero-dispatch\frontend

# 2. (First-time only) Create local environment file from example
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# 3. Start the Vite development server
npm run dev
```
* Frontend Web App: `http://localhost:5173`

---

## 🔑 Pre-Seeded Demo Role Credentials

| Role | Email | Password | Assigned ID / Tier |
| :--- | :--- | :--- | :--- |
| **Consignor / Customer** | `aditya.sharma@example.com` | `Customer@123` | Enterprise Merchant |
| **Delivery Driver** | `ramesh.kumar@aerodispatch.internal` | `Driver@123` | Driver ID: `DRV-504` |
| **Control Tower Admin** | `priya.nair@aerodispatch.internal` | `Admin@123` | National Operations Director |

> **Note:** The frontend also features **1-Click Instant Demo Profiles** on the Authentication Portal for rapid role switching.

---

## 🧪 Automated Testing & Quality Checks

### Run All Backend Unit, API, E2E, and Phase 6 Security Tests (57/57 Passing)
```powershell
cd C:\Users\micro\.gemini\antigravity-ide\scratch\aero-dispatch
uv run --directory backend pytest -v
```

To run individual phase test suites:
```powershell
# Phase 2: Lambda order creation & validation (11 tests)
uv run --directory backend pytest tests/test_create_order.py -v

# Phase 3: REST API, JWT RBAC, State Machine & Uploads (16 tests)
uv run --directory backend pytest tests/test_phase3_api.py -v

# Phase 5: End-to-End Application & Regression suite (18 tests)
uv run --directory backend pytest tests/test_phase5_e2e.py -v

# Phase 6: Security, IDOR/BOLA Authorization & Path Traversal (12 tests)
uv run --directory backend pytest tests/test_phase6_security.py -v
```

### Run Frontend Build & Lint Checks
```powershell
cd C:\Users\micro\.gemini\antigravity-ide\scratch\aero-dispatch\frontend
npm run lint
npm run build
```

---

## 🔒 Security Posture & Architecture Review (Phase 6)

### 1. Implemented & Tested Protections
* **Authentication & RBAC**: JWT Bearer tokens signed with HS256 and 24-hour expiration. Strict role enforcement across `customer`, `driver`, and `admin` personas.
* **Privilege Escalation Prevention**: Anonymous self-registration restricts roles to `customer`. Registering `driver` or `admin` accounts requires an authenticated admin token (403 Forbidden).
* **IDOR / BOLA Prevention**: Once a consignment is assigned to a delivery associate (`driverId`), other drivers are prohibited from modifying delivery status or uploading proof of delivery (403 Forbidden).
* **Consignment Ownership & Privacy**: Customer orders are attributed to the authenticated customer account (`customerEmail`) and isolated in customer queries.
* **Path Traversal & Storage Sanitization**: Consignment IDs and file names are strictly validated against alphanumeric character rules. Destination paths are verified using `os.path.abspath` to stay within `.uploads/`.
* **Bounded File Uploads & Binary Inspection**: Package photo uploads stream in 64KB chunks up to 5MB, avoiding memory exhaustion DoS. Binary magic bytes (`\xff\xd8\xff` for JPEG, `\x89PNG` for PNG, `RIFF/WEBP` for WebP) prevent renamed executables or scripts.
* **State Machine Invariants**: Rejects illegal or out-of-order transitions. Terminal states (`DELIVERED`, `CANCELLED`) cannot be transitioned away from by drivers.
* **WebSocket Teardown & Validation**: AWB parameters are validated by regex (`^[A-Za-z0-9\-]{4,32}$`). Non-existent consignments receive an error snapshot and terminate immediately with WS policy violation code.
* **CORS Policy**: Configured with explicit browser origins (`http://localhost:5173`, etc.) compatible with credentialed requests (`Access-Control-Allow-Credentials: true`).

### 2. Remaining Risks & Pre-Deployment Production Requirements
* **Production Secret Management**: The local environment uses a development fallback secret (`JWT_SECRET`). Production deployment requires AWS Secrets Manager or Parameter Store integration.
* **Token Invalidation / Revocation**: Stateless JWTs cannot be revoked prior to expiration without a distributed token blacklist (e.g., Redis or DynamoDB TTL table).
* **Cloud Infrastructure (Phase 4)**: AWS Cognito User Pools, Amazon S3 Presigned URLs with KMS encryption, and Amazon EventBridge/SNS are emulated locally in Python services. They must be provisioned in AWS before production deployment.
* **Rate Limiting**: Local endpoints currently lack IP-level rate limiting or WAF throttling. In production, AWS WAF or API Gateway usage plans must throttle public order creation and tracking lookups.

---

## 🏗️ Architecture & Cloud-Emulated Local Services

* **REST API & Telemetry:** FastAPI on port `8000` providing endpoints for order creation, consignment tracking, state machine status transitions, proof-of-delivery uploads, and driver dispatch assignment.
* **WebSocket Streams:** `/ws/tracking/{awb}` broadcasting real-time milestone events directly to connected dispatchers and tracking screens.
* **Authentication:** JWT Bearer tokens with Role-Based Access Control (`customer`, `driver`, `admin`).
* **Storage & Persistence:** Local JSON persistence in `backend/.data/orders.json` and multi-part proof-of-delivery photo validation in `backend/.uploads/`.
* **Zero Cloud Cost:** Fully functional in local development mode without deploying AWS resources.

---

## 📋 Known Limitations & Local Mock Scope

1. **Gateway Sorting Facilities & Hub Health**: Sorter load percentages and package capacities for the 4 regional sorting gateways (Delhi, Mumbai, Bengaluru, Kolkata) are displayed as telemetry simulations (`MOCK_HUBS`).
2. **Driver Roster Directory**: The driver catalog (`MOCK_DRIVERS`) is pre-seeded locally in `backend/src/data_mock.py` and `frontend/src/data/mockShipments.js` for dispatch assignment.
3. **Outbound Notification Delivery**: EventBridge / SNS customer SMS and email dispatches are emulated by the internal event dispatcher without external telecom gateway integration.
4. **Cloud Infrastructure**: S3 direct presigned URLs, DynamoDB cloud tables, and AWS Cognito user pools are emulated locally in Python services to ensure zero cloud cost during local testing.

---

## 🛠️ Local Troubleshooting

* **Backend port conflict (8000 in use)**: Check active processes using `Get-NetTCPConnection -LocalPort 8000` in PowerShell and terminate the previous Uvicorn process.
* **Frontend cannot connect to backend**: Verify backend is running on `http://127.0.0.1:8000` and `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8000`. The frontend will automatically show a banner indicating local fallback mode if the backend is offline.

