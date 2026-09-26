# AR-RAKSHAK — SIH 2026 Production-Hardened Safety Training Platform

AR-RAKSHAK is an industrial safety training and compliance platform designed for mining and manufacturing work environments.

This version has been comprehensively audited, refactored, secured, and hardened with a layered architecture, offline-first IndexedDB synchronization, real browser camera stream management with graceful fallbacks, CSP and security headers, input validation, DoS rate limiting, and an automated test suite.

---

## Key Features

### Worker Experience
- **Interactive Safety Dashboard**: Real-time safety scores, module completion tracking, and offline status indicators.
- **Worker Profile Management**: Multi-worker switching and on-the-fly registration.
- **Context-Aware Training Modules**: Sector-specific modules (Mining & Manufacturing) detailing hazards, PPE requirements, and procedural steps.
- **Real Camera & AR Safety View**: Live browser video streaming with dynamic AR boundary overlays, safe path indicators, and hazard warning boxes.
- **Camera Fallback**: Seamless fallback to visual AR simulation when camera hardware is absent or permissions are denied.
- **Interactive Assessment**: Single-choice question flow with real-time scoring, pass/fail thresholds, and risk profiling.
- **Official Digital Certificate**: Verified completion certificates with cryptographic IDs, compliant formatting, and print/save-as-PDF layout.
- **Instant Hazard & Incident Reporting**: One-touch reporting with severity categorization, offline queueing, and idempotency protection against duplicate submissions.
- **Full Bilingual Support**: Complete UI localization in English and Hindi (हिन्दी).

### Supervisor Capabilities
- **Executive Safety Dashboard**: Real-time KPI cards for workforce compliance, completions, open hazard alerts, and high-risk flags.
- **Workforce Risk Monitoring Table**: Live worker audit table tracking individual scores, module completions, and risk tiers (Low, Medium, High).
- **Incident Investigation & Resolution**: Hazard log with status controls (Open → Resolved).

### Engineering & Reliability Hardening
- **Offline-First Resilience**: IndexedDB storage with an automated background sync queue and Service Worker PWA shell caching.
- **Defensive API Architecture**: Clean separation of routes, controllers, services, repositories, and middleware.
- **Security & Headers**: Helmet-equivalent security headers (Strict CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy).
- **Rate Limiting**: Sliding-window rate limiters protecting write-heavy endpoints against abuse.
- **Safe Persistence**: Concurrency mutex and atomic file writes preventing race conditions and database corruption.
- **Zero XSS**: Context-aware escaping and DOM sanitization on all user-controlled inputs.
- **Automated Test Coverage**: 24 tests across unit, integration, security, and full end-to-end user journeys.

---

## Directory Architecture

```text
AR-Rakshak-SIH2026/
├── data/
│   └── db.json               # Seed & active state persistence
├── public/                   # Client-side SPA
│   ├── css/
│   │   └── style.css         # Accessible, high-contrast, mobile-first CSS
│   ├── js/
│   │   ├── api.js            # Resilient API client with timeouts & retry
│   │   ├── app.js            # Application router & background sync manager
│   │   ├── camera.js         # Real getUserMedia camera & AR overlay controller
│   │   ├── certificate.js    # Verified printable certificate renderer
│   │   ├── dashboard.js      # Supervisor metrics & incident resolver
│   │   ├── i18n.js           # Bilingual localization engine (English / Hindi)
│   │   ├── incident.js       # Hazard reporting with offline queue & lock
│   │   ├── storage.js        # IndexedDB + localStorage sync queue
│   │   ├── training.js       # Modules, PPE checklist & quiz engine
│   │   ├── ui.js             # HTML escaping, accessible toasts & loaders
│   │   └── worker.js         # Worker profile switching & registration
│   ├── index.html            # Semantic, accessible HTML5 shell
│   └── sw.js                 # PWA Service Worker for offline shell caching
├── src/                      # Backend Express Architecture
│   ├── config/               # Environment & runtime configuration
│   ├── controllers/          # Request handlers with standardized envelope
│   ├── middleware/           # Security headers, rate limiting, error handling, request ID
│   ├── routes/               # API router mapping
│   ├── services/             # Business logic (scoring, risk, deduplication, certs)
│   ├── utils/                # Atomic file storage, structured logger, sanitizers
│   ├── validators/           # Strict input validation schemas
│   └── app.js                # Express application factory
├── tests/                    # Automated Test Suite
│   ├── api.test.js           # API endpoints, security headers, validation tests
│   ├── validation.test.js    # Sanitizer and boundary utility tests
│   └── e2e/
│       └── worker-flow.spec.js # Full worker training to certificate journey
├── package.json
└── server.js                 # Server entrypoint with graceful shutdown
```

---

## Getting Started

### Prerequisites
- Node.js LTS (v18+ or v20+)
- npm

### Installation
```bash
npm install
```

### Running Tests
Execute the 24 automated tests covering validation, security, API endpoints, and the full end-to-end user flow:
```bash
npm test
```

### Starting the Server
```bash
npm start
```
The server will start at:
```text
http://localhost:3000
```

---

## Demonstration Workflow

1. **Worker Safety Journey**:
   - Navigate to `Home` → Click **Start Training** (`Training`).
   - Select **Mine Entrance Safety** (`M001`).
   - Review mandatory PPE items in the checklist.
   - Click **Start Camera Guidance** to stream live video behind the AR safety boundary overlay (or allow visual simulation fallback).
   - Click **Begin Safety Steps** and review step-by-step procedures.
   - Click **Start Assessment** and answer the interactive questions.
   - Submit assessment: score is calculated accurately without biasing or halving.
   - Click **View Certificate** to view and print the official certificate.

2. **Incident & Hazard Reporting**:
   - Click **Report** (`⚠ Report`).
   - Fill in observed hazard details and submit.
   - If offline, the report is securely stored in IndexedDB and automatically synchronized when reconnected.

3. **Supervisor Compliance Inspection**:
   - Click **Supervisor** (`▤ Supervisor`).
   - View live KPI metrics (Workers, Module Completions, High Risk Flags, Open Incidents).
   - Review worker risk table and click **Resolve** on open safety incidents.

---

## Technical Specifications & Standards
- **Standardized API Envelope**: All responses return `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message", "requestId" } }`.
- **Accessibility**: Minimum 48px touch targets, WCAG AA contrast ratio (≥ 4.5:1), screen-reader labels, and keyboard navigation.
- **Traceability**: Every request receives a unique `X-Request-Id` traced through access logs and structured error messages.
