# HealthAI - Real-Time IoT Health Monitoring App

## Overview

HealthAI is a real-time health monitoring application built with React Native (Expo) and an Express backend. It continuously retrieves patient physiological data from ThingSpeak IoT cloud platform and displays live health vitals including heart rate, SpO₂, blood glucose, body temperature, and ECG signals. The app intelligently detects abnormal health conditions and can send emergency alerts via WhatsApp to caretakers.

The project follows a monorepo structure with a mobile-first Expo frontend and a Node.js/Express API server, sharing schema definitions between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: expo-router with file-based routing and typed routes. The app uses a tab-based navigation layout with four tabs: Dashboard, History, Report, and Settings
- **State Management**: TanStack React Query for server state; React's `useState`/`useRef` for local state
- **Fonts**: Inter font family (400, 500, 600, 700 weights) loaded via `@expo-google-fonts/inter`
- **Animations**: `react-native-reanimated` for smooth animations (ECG chart scanning, pulse effects on abnormal readings, card entrance animations)
- **Charts**: Custom SVG-based ECG waveform chart using `react-native-svg` — no third-party charting library
- **Local Storage**: `@react-native-async-storage/async-storage` for persisting user settings (thresholds, caretaker info)
- **Platform Support**: Android, iOS, and Web. The app uses platform-specific adaptations (e.g., `expo-glass-effect` for iOS liquid glass tabs, `BlurView` for tab bars, haptic feedback only on native)

### Key Frontend Files
- `app/(tabs)/index.tsx` — Main dashboard with live vital cards, ECG chart, status banner, and risk alerts. Polls data every 5 seconds
- `app/(tabs)/history.tsx` — Historical readings list with filter (all/abnormal)
- `app/(tabs)/report.tsx` — Health report generation with WhatsApp sharing capability
- `app/(tabs)/settings.tsx` — Configure alert thresholds, patient/doctor names, caretaker phone number
- `lib/health-data.ts` — Core data layer: ThingSpeak API integration, health analysis logic, threshold management, WhatsApp URL generation
- `lib/query-client.ts` — API client setup with base URL resolution for Replit environments
- `constants/colors.ts` — Dark theme color palette (dark navy background with accent colors)

### Backend (Express)
- **Framework**: Express 5 with TypeScript, compiled via `tsx` in development and `esbuild` for production
- **Server file**: `server/index.ts` — Sets up CORS (supports Replit domains and localhost), serves static web build in production
- **Routes**: `server/routes.ts` — Currently minimal; ready for API route registration under `/api` prefix
- **Storage**: `server/storage.ts` — In-memory storage implementation (`MemStorage`) with a user CRUD interface. Uses an `IStorage` interface for easy swapping to database-backed storage

### Database Schema (Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema location**: `shared/schema.ts` — Shared between frontend and backend
- **Current tables**: `users` table with `id` (UUID, auto-generated), `username` (unique), and `password`
- **Validation**: `drizzle-zod` for generating Zod schemas from Drizzle table definitions
- **Migrations**: Output to `./migrations` directory via `drizzle-kit`
- **Note**: The database schema is minimal — the app currently stores health data readings from ThingSpeak rather than in the local database. The storage layer currently uses in-memory storage, not the Drizzle/Postgres schema

### IoT Data Flow
- Health data originates from IoT medical sensors uploaded to **ThingSpeak Cloud Platform**
- The app fetches data via ThingSpeak's REST API: `https://api.thingspeak.com/channels/{CHANNEL_ID}/feeds/last.json`
- Five data fields: field1 (Heart Rate), field2 (SpO₂), field3 (Blood Glucose), field4 (Body Temperature), field5 (ECG Signal)
- Data is polled every 5 seconds on the dashboard
- Health analysis runs client-side, evaluating readings against configurable thresholds to detect abnormal patterns

### Build & Deployment
- **Development**: Two processes — `expo:dev` for the Expo dev server and `server:dev` for the Express backend
- **Production**: Static web export via custom build script (`scripts/build.js`), Express serves the static files
- **Environment**: Designed for Replit with `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` environment variables for CORS and URL resolution

## External Dependencies

### Third-Party Services
- **ThingSpeak** — IoT cloud platform for receiving real-time health sensor data via REST API. Requires a Channel ID to be configured
- **WhatsApp** — Emergency alerts sent to caretakers via WhatsApp deep links (URL scheme-based, no API key needed)

### Database
- **PostgreSQL** — Configured via `DATABASE_URL` environment variable. Used with Drizzle ORM for schema management and migrations. Currently the app uses in-memory storage but is wired for Postgres

### Key NPM Packages
- `expo` (SDK 54) — Core mobile framework
- `expo-router` — File-based routing
- `@tanstack/react-query` — Async state management
- `drizzle-orm` + `drizzle-zod` — Database ORM and validation
- `express` — Backend API server
- `pg` — PostgreSQL client
- `react-native-reanimated` — Animations
- `react-native-svg` — SVG rendering for ECG charts
- `expo-haptics` — Haptic feedback for alerts
- `@react-native-async-storage/async-storage` — Local key-value storage
- `patch-package` — Applies patches to dependencies on install