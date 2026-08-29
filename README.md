# IntelliFlow AI — Authentication & RBAC Foundation

> **Smart City Digital Twin Platform** — Production-grade OAuth 2.0 / OpenID Connect (OIDC) authentication and Role-Based Access Control (RBAC) architecture.

---

## 🏛️ System Architecture

IntelliFlow AI connects three primary user experiences (Citizens, Police Command Center, and Municipal Engineers) backed by a central platform governance layer:

```
                               ┌────────────────────────────────┐
                               │   IntelliFlow Identity Gateway  │
                               │     (OAuth 2.0 / OIDC + PKCE)   │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       ▼                       ▼                       ▼
            ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
            │   CITIZEN PORTAL    │ │   COMMAND CENTER    │ │ MUNICIPAL ENGINEER  │
            │      (/citizen)     │ │  (/command-center)  │ │    (/municipal)     │
            ├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
            │ • City Map          │ │ • Traffic Prediction│ │ • Digital Twin      │
            │ • Smart Parking     │ │ • CCTV Vision AI    │ │ • Scenario Builder  │
            │ • Civic Reporting   │ │ • Green Corridor    │ │ • Urban Planning    │
            │ • Emergency SOS     │ │ • Incident Triage   │ │ • Infra Capital     │
            └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                                               ▲
                                               │
                                    ┌─────────────────────┐
                                    │    SYSTEM ADMIN     │
                                    │      (/admin)       │
                                    ├─────────────────────┤
                                    │ • User Directory    │
                                    │ • Role Governance   │
                                    │ • Audit Trail Logs  │
                                    └─────────────────────┘
```

---

## 🔒 Security & Authentication Model

1. **OAuth 2.0 / OpenID Connect (OIDC)**
   - Authorization Code Flow with **PKCE (Proof Key for Code Exchange)** (`S256`).
   - Cryptographic `state` and `nonce` verification mitigating CSRF and replay attacks.
   - Provider identity abstraction supporting **Google OAuth 2.0**, **Microsoft Entra ID**, and standard OIDC discovery (`.well-known/openid-configuration`).

2. **Persistent User Representation**
   - Users are permanently keyed on provider's stable subject ID (`oauth_subject_id` + `oauth_provider`), never on email alone.
   - Profile image, full name, timestamps, and active account status tracked in database migrations.

3. **Secure Session Management**
   - Signed `HttpOnly`, `SameSite=Lax` (or `None` in production cross-site HTTPS) session cookies.
   - Server-side session storage invalidation on `/auth/logout`.
   - Zero raw secrets or sensitive tokens exposed to the frontend browser.

4. **Dual-Layer RBAC Enforcement**
   - **Frontend Route Protection**: `<ProtectedRoute requiredRoles={[...]}>` guarding routes with fallback to `/login` or `/unauthorized` (403).
   - **Backend API Middleware**: `requireAuth`, `requireRole(...)`, and `requirePermission(...)` strictly validating identity from database session on every API call. Role tampering via headers or body is impossible.

---

## 📋 Role & Permission Matrix

| Role | Core Permissions | Allowed Portals | Allowed Backend APIs |
| :--- | :--- | :--- | :--- |
| **CITIZEN** | `city.read`, `parking.read`, `parking.reserve`, `incident.create`, `sos.create`, `profile.read` | `/citizen`, `/profile` | `/api/citizen/*` |
| **COMMAND_CENTER** | `city.read`, `traffic.read`, `traffic.analyze`, `incident.read`, `incident.dispatch`, `emergency.read`, `emergency.coordinate`, `cctv.read`, `digital_twin.read`, `digital_twin.simulate`, `profile.read` | `/command-center`, `/profile` | `/api/command/*` |
| **MUNICIPAL_ENGINEER** | `city.read`, `digital_twin.read`, `digital_twin.simulate`, `planning.read`, `planning.create_scenario`, `parking.analytics`, `infrastructure.read`, `profile.read` | `/municipal`, `/profile` | `/api/municipal/*` |
| **ADMIN** | `users.manage`, `roles.manage`, `system.manage`, `city.read`, `profile.read`, all portal previews | `/admin`, `/citizen`, `/command-center`, `/municipal`, `/profile` | `/api/admin/*`, all endpoints |

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation
Install dependencies across the workspace:
```bash
# In the root repository
npm install

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Key environment configurations:
```env
# Server & Client
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Session Security
SESSION_SECRET=your_32_character_super_secret_session_key
SESSION_SECURE=false
SESSION_MAX_AGE_MS=86400000

# Database
DATABASE_PATH=./data/intelliflow.db

# OAuth 2.0 / OIDC Configuration
OAUTH_PROVIDER=google
OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_ISSUER=https://accounts.google.com
OAUTH_REDIRECT_URI=http://localhost:5000/auth/callback
OAUTH_SCOPE=openid email profile

# Role Configuration
DEFAULT_DEMO_ROLE=CITIZEN

# Sandbox Development Mode (set false in production!)
ENABLE_DEV_MOCK_AUTH=true
```

### 4. Database Migrations
Database tables are automatically created on server startup, or can be run manually:
```bash
cd server
npm run migrate
```

### 5. Running the Application
To run both backend API server and frontend React client concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🧪 Testing the Authentication & RBAC System

### Run Automated Tests
Run the comprehensive Vitest test suite covering all 10 security and access scenarios:
```bash
cd server
npm test
```

### Manual Testing with Sandbox Personas
When `ENABLE_DEV_MOCK_AUTH=true` is enabled:
1. Navigate to `http://localhost:5173/login`.
2. Click any of the pre-configured sandbox personas:
   - **Alex Rivera** (`CITIZEN`) → Redirects to `/citizen`.
   - **Capt. Marcus Chen** (`COMMAND_CENTER`) → Redirects to `/command-center`.
   - **Dr. Elena Rostova** (`MUNICIPAL_ENGINEER`) → Redirects to `/municipal`.
   - **Sarah Vance** (`ADMIN`) → Redirects to `/admin`.
3. Try navigating directly to `/command-center` while logged in as Citizen to verify the **403 Forbidden Unauthorized** protection.
4. Use the floating **DEV ROLE SWITCHER** in the bottom-right corner to dynamically switch roles and observe instant RBAC enforcement.
5. Click **Logout** or **Revoke Session** to verify session teardown.

---

## 🌐 Configuring Live Google OAuth 2.0

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Set **Authorized JavaScript Origins**: `http://localhost:5173` and `http://localhost:5000`.
5. Set **Authorized Redirect URIs**: `http://localhost:5000/auth/callback`.
6. Add `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` into `.env`.
7. Set `ENABLE_DEV_MOCK_AUTH=false` for live-only OAuth mode.
