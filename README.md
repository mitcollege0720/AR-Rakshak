# AR Rakshak Safety System

AI-Powered Safety and Emergency Response for High-Risk Industries

## Features

### Worker Experience
- Interactive Safety Dashboard with real-time metrics
- Worker Profile Management with multi-worker switching
- Context-Aware Training Modules (Mining & Manufacturing)
- Real Camera & AR Safety View with graceful fallbacks
- Interactive Assessment with scoring and risk profiling
- Digital Certificate generation with print/PDF support
- Instant Hazard & Incident Reporting with offline queueing
- Full 11-Language Support (English, Hindi, Bengali, Urdu, Santali, Khortha, Sadan, Magahi, Ho, Kurukh, Mundari)

### New Features
- **Dark/Light Mode** with system preference detection
- **Offline-First GPS Tracker** with route recording and auto-sync
- **One-Tap SOS** with GPS capture, confirmation step, and offline storage
- **Rakshak AI Voice Assistant** with speech-to-text and text-to-speech
- **Digital Safety Passport** with certificates and expiry warnings
- **AR Safety Training Simulator** with 8 interactive scenarios
- **Pre-Shift Safety Checklist** with offline completion
- **Safety Analytics Dashboard** with charts and statistics
- **Secure Authentication** with Supabase Auth (email/password + Google OAuth)
- **Role-Based Access Control** (Worker, Supervisor, Admin)
- **Hash-based Routing** with deep links and browser back/forward

### Supervisor Capabilities
- Executive Safety Dashboard with KPI cards
- Workforce Risk Monitoring Table
- Incident Investigation & Resolution
- Safety Analytics with trends and charts

## Getting Started

```bash
npm install
npm start
```

Server starts at http://localhost:3000

## Testing

```bash
npm test
```

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- Google OAuth credentials configured in Supabase dashboard
