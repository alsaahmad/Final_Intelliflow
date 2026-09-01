# IntelliFlow AI — FastAPI Backend Foundation (Phase 3A)

## Overview

This repository directory (`server-fastapi/`) implements **Phase 3A (Backend Foundation)** of the IntelliFlow AI platform.

FastAPI operates as a high-performance Python backend server running on **Port 8000**, coexisting alongside the existing Express.js backend on **Port 5000**.

---

## Architecture & Scope (Phase 3A Only)

```
                              React Frontend (Vite)
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
     Express Server (:5000)                             FastAPI Server (:8000)
   (MySQL / SQLite fallback)                          (PostgreSQL via SQLAlchemy 2.x)
            │                                                     │
            └──────────────── Standard Shared ────────────────────┘
                                JWT Secret
```

### Included in Phase 3A:
* **FastAPI Application**: Standard project layout with structured exception handlers & Pydantic v2 validation.
* **SQLAlchemy 2.0 Async**: AsyncEngine & AsyncSession with `asyncpg` driver.
* **Alembic Migrations**: Complete migration configuration for database schema tracking.
* **PostgreSQL Schema Foundation**:
  1. `users` — User identities compatible with Express payload fields.
  2. `user_roles` — Role assignments supporting multi-role access.
  3. `junctions` — Physical intersection metadata.
  4. `traffic_telemetry` — Observation table (*TimescaleDB hypertable evaluation deferred to Phase 3B*).
  5. `system_audit_logs` — Event and security audit logging.
* **Health Check Endpoints**:
  * `GET /api/v1/health` — Application health & timestamp.
  * `GET /api/v1/db-health` — Live `SELECT 1` PostgreSQL connectivity test.
* **JWT Compatibility**: PyJWT verification decoding shared Express JWT secret and payload formats.

---

## Prerequisites & Installation

### 1. Requirements
* Python 3.10+ (Recommended Python 3.11 / 3.12 / 3.13)
* PostgreSQL 14+ (Local installation or Docker)

### 2. Virtual Environment Setup

```bash
# Navigate to server-fastapi directory
cd server-fastapi

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate virtual environment (Linux / macOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Key Environment Variables:
| Variable | Description | Default |
|---|---|---|
| `PORT` | FastAPI server port | `8000` |
| `DATABASE_URL` | PostgreSQL connection string (`asyncpg`) | `postgresql+asyncpg://postgres:postgres@localhost:5432/intelliflow_db` |
| `JWT_SECRET` | Secret key matching Express backend | `intelliflow_ai_jwt_secret_key_2026_smart_city_platform` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `CORS_ORIGINS` | Allowed frontend origins (JSON array) | `["http://localhost:5173", "http://localhost:5000"]` |

---

## Database Migrations (Alembic)

```bash
# Run pending migrations to head
alembic upgrade head

# Rollback initial migration
alembic downgrade base
```

---

## Running FastAPI Server

```bash
# Run development server with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Interactive API Documentation:
* **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## Running Tests

```bash
# Run pytest test suite
pytest
```

---

## Available Endpoints (Phase 3A)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Returns service status, version, and server timestamp. |
| `GET` | `/api/v1/db-health` | Executes live `SELECT 1` query against PostgreSQL. |
