# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project type: TypeScript Node API using Hono, Drizzle ORM (PostgreSQL), typedi DI, and tsx for dev scripts.

Common commands
- Install deps: npm install
- Run in dev (reload): npm run dev
- Build: npm run build
- Start built server: npm start
- Lint: npm run lint
- Type-check: npm run typecheck

Database and migrations
- Drizzle config: uses drizzle-kit with schema in src/db/schema.ts
- Generate SQL (from schema): npm run drizzle:generate
- Apply migrations: npm run drizzle:migrate
- Seed database (individual scripts run with tsx):
  - Seed all core data: npm run seed:all
  - Reset and seed: npm run db:reset-and-seed
  - Truncate all data: npm run db:truncate-all
  - Other focused seeds (optional):
    - npm run seed:users
    - npm run seed:user-location
    - npm run seed:user-states
    - npm run seed:catalog-activities
    - npm run seed:catalog-traits
    - npm run seed:catalog-actors
    - npm run seed:catalog-actresses
    - npm run seed:currencies
    - npm run seed:block-and-report
    - npm run seed:app-settings
    - npm run seed:bookmarks
    - npm run seed:demo-users

Running a single script
- Use tsx to execute any TS script directly, e.g.:
  - npx tsx src/scripts/seeds/seed-all.ts
  - npx tsx src/scripts/fixes/fixAppSettingsTimestamps.ts

API docs
- OpenAPI spec is served from /openapi.yaml
- Swagger UI is served from /docs (static HTML using swagger-ui-dist CDN)

Environment
- Required/validated via src/utils/env.ts (zod). Key variables:
  - DATABASE_URL (Postgres), NODE_ENV, PORT (optional)
  - JWT_SECRET, AUTH_CALLBACK_URL
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIECT_URL
  - Optional integrations: KRAKEN_* (image optimization), AWS_* + S3_BUCKET, LOCATIONIQ_API_KEY
- Local dev: create a .env file with the above. Values are parsed at process start.

Runtime architecture (big picture)
- Entrypoint: src/index.ts
  - Creates Hono app, sets logger middleware, mounts route modules, and serves /health, /openapi.yaml, and /docs.
  - Initializes dependency injection: Container.set("db", db) where db is Drizzle bound to Postgres.
- Data layer: src/db/
  - schema.ts defines all tables (users, content, chats, meetups, catalog tables, etc.). This is the single source of truth for Drizzle and migrations.
  - index.ts sets up Drizzle (postgres-js) with the schema and exports db used by routes/repos.
  - infra/db.ts provides an alternative Node pg Pool + drizzle factory (not used by default; DI passes db from src/db/index.ts).
- HTTP layer: src/routes/* group endpoints by domain (auth, users, people, meetups, chats, airports, bookmarks, requests, storage).
  - Each router uses zod validation (via @hono/zod-validator) and pulls services via typedi.
  - Authorization: src/middleware/auth.ts provides authorize/authorizeOptional. JWT is verified with JWT_SECRET; profile is fetched from DB; onboarding checks can be bypassed per route.
- Domain services: src/services/* hold business logic and orchestrate repositories. They are typedi @Service classes, fetched via Container.get.
- Persistence: src/repositories/* encapsulate Drizzle queries and simple transactions. They receive the db via DI (Container.get("db")). Replace/"upsert" patterns are common for many-to-many relations.
- Third-party integrations: src/third-party-services/*
  - firebase.helper.ts initializes Firebase Admin from FIREBASE_SERVICE_ACCOUNT (raw JSON or base64) and optional FIREBASE_DATABASE_URL, and exposes helpers to create chat rooms and push messages to RTDB.
  - s3.helper.ts and kraken helpers for media.
- Scripts: src/scripts/* contain seeds, fixes, and utilities. Most are idempotent and can be run with tsx. seed-all orchestrates core seeds and optional imports (actors from JSON, airports from CSV).

Conventions and notes
- Requests commonly rely on x-user-id header set by upstream auth; JWT middleware (authorize) will enforce onboarding completion unless bypassOnboardingCheck is true.
- Pagination is typically page=1 with pageSize=20; some routes accept filters (e.g., /people and /meetups).
- Meetups and chats create related side effects (e.g., chat rooms) via services and third-party helpers.

Quick verification
- Start: npm run dev
- Check health: curl http://localhost:8787/health
- Explore docs: open http://localhost:8787/docs

