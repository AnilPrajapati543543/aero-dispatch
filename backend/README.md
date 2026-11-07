# AeroDispatch — Local Backend & API Documentation

AeroDispatch provides an enterprise logistics backend engineered with **clean architecture and pluggable interfaces**. It can run 100% offline locally using FastAPI, WebSockets, and file-backed persistence without creating or requiring any AWS resources. In later phases, it can be deployed seamlessly to AWS Lambda, DynamoDB, S3, Cognito, and API Gateway without rewriting the core business logic.

---

## 1. Quick Start Guide (Windows PowerShell)

### Step 1: Install Dependencies
From the repository root (`aero-dispatch/`):
```powershell
# Using uv (recommended)
uv pip install --directory backend -r backend/requirements-dev.txt

# Or using standard Python 3.12 venv:
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
cd ..
```

### Step 2: Run the Local Backend Server
Start the local FastAPI development server on port **8000**:
```powershell
uv run --directory backend uvicorn src.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Live WebSocket Telemetry: `ws://localhost:8000/ws/tracking/{awbNumber}`

### Step 3: Run the Frontend
In a separate PowerShell terminal:
```powershell
cd frontend
npm run dev
```
- Frontend UI: `http://localhost:5173/`

### Step 4: Run Automated Tests
Execute the complete test suite (Phase 2 Lambda unit tests, Phase 3 REST/WebSocket tests, Phase 5 E2E integration, and Phase 6 Security & IDOR/BOLA tests — 57/57 passing):
```powershell
uv run --directory backend pytest -v
```

---

## 2. Pre-Seeded Test Accounts (Role-Based Access Control)

Use these credentials to authenticate via `POST /api/v1/auth/login` or test protected endpoints:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Customer** | `aditya.sharma@example.com` | `Customer@123` | Manifest consignments, view tracking, list own shipments |
| **Driver** | `ramesh.kumar@aerodispatch.internal` | `Driver@123` | View assigned route, update milestone status, upload proof photos |
| **Admin** | `priya.nair@aerodispatch.internal` | `Admin@123` | Central command tower, assign drivers, manual state override |

---

## 3. Core REST & WebSocket Endpoints

### Consignment Tracking & Ingestion
* `POST /api/v1/orders` — Ingest new consignment. Generates `AD-XXXX-XXXX` tracking ID, validates input, checks idempotency.
* `GET /api/v1/orders/{orderId}` — Public tracking query. Returns complete event history and current status.
* `GET /api/v1/customer/orders` — List consignments for authenticated customer (Bearer token required).

### Driver Dispatch & Proof of Delivery
* `GET /api/v1/driver/orders` — List deliveries assigned to authenticated driver (Bearer token required).
* `PATCH /api/v1/driver/orders/{orderId}/status` — Advance delivery status. Enforces valid state machine transitions (`BOOKED` $\to$ `IN_TRANSIT` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`).
* `POST /api/v1/orders/{orderId}/proof` — Upload package proof-of-delivery photo (multipart/form-data). Enforces max 5MB size and JPEG/PNG/WebP magic-byte validation.

### Central Operations Control Tower (Admin)
* `GET /api/v1/admin/orders` — View all nationwide consignments with optional `?status=` filter.
* `GET /api/v1/admin/drivers` — List active fleet drivers directory.
* `POST /api/v1/admin/orders/{orderId}/assign` — Assign fleet driver associate to consignment.
* `PATCH /api/v1/admin/orders/{orderId}/override` — Emergency administrative status override.

### Live Telemetry Streaming
* `WebSocket /ws/tracking/{awbNumber}` — Pushes instant real-time JSON milestone updates when consignment status advances.

---

## 4. Architecture & AWS Pluggability

All cloud integrations are isolated behind abstract interfaces in `src/interfaces/`:
* **Database**: `OrderRepositoryInterface` $\to$ Implemented by `LocalOrderRepository` (local dev) and `DynamoDBOrderRepository` (AWS Lambda).
* **Storage**: `StorageServiceInterface` $\to$ Implemented by `LocalStorageService` (`backend/.uploads/`) and `S3StorageService` (AWS S3).
* **Messaging & Events**: `EventDispatcherInterface` $\to$ Implemented by `LocalEventDispatcher` (WebSockets) and `EventBridgeSnsService` (AWS EventBridge/SNS).
* **Authentication**: `AuthServiceInterface` $\to$ Implemented by `LocalAuthService` (local JWT) and `CognitoAuthService` (AWS Cognito).
