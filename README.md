# TradeNest

Simulated Indian stock trading platform. **Not real money** — uses a real order matching engine, portfolio tracking, wallet management, and realtime updates.

Built as a **Modular Monolith** (NestJS modules), designed to evolve into microservices with minimal business logic changes.

---

## Scripts

All automation scripts live in the `scripts/` folder:

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/setup.sh` | **First-time setup** — creates DB user & database, installs all deps, generates Prisma client, pushes schema, seeds data | `./scripts/setup.sh` |
| `scripts/db-sync.sh` | **Schema sync** — validates schema, regenerates Prisma client, pushes changes to DB | `./scripts/db-sync.sh` |
| `scripts/db-sync.sh --seed` | Same as above + re-seeds initial data | `./scripts/db-sync.sh --seed` |
| `scripts/start-dev.sh` | **Start dev servers** — launches backend & frontend in parallel | `./scripts/start-dev.sh` |

---

## Quick Start (One-Command Setup)

> **Prerequisites:** PostgreSQL installed & running, Node.js v18+, npm, Redis installed & running.

```bash
# 1. Clone the repo & enter the directory
cd TradeNest

# 2. Copy the example env file (adjust values if needed)
cp .env.example .env

# 3. Run the setup script — does everything automatically
./scripts/setup.sh

# 4. Start both servers
./scripts/start-dev.sh
```

The `setup.sh` script performs the following steps:

| Step | What it does |
|------|-------------|
| 1 | Creates the PostgreSQL user (`tradenest`) |
| 2 | Creates the PostgreSQL database (`tradenest`) and grants privileges |
| 3 | Installs backend npm dependencies (`npm install`) |
| 4 | Generates Prisma client & pushes schema to the database |
| 5 | Seeds initial data (users, stocks, wallets, orders, trades) |
| 6 | Installs frontend npm dependencies (`npm install`) |

**Login:** `admin_01` / `TradeNest@123` (or `trader_01`–`trader_60`)

---

## After Pulling Schema Changes

When someone changes `prisma/schema.prisma`, just run:

```bash
./scripts/db-sync.sh
```

This validates the schema, regenerates the Prisma client, and pushes changes to the database — all in one command.

---

## Manual Setup (Step-by-Step)

If you prefer to run each step manually:

```bash
# 1. Copy env file
cp .env.example .env

# 2. Create PostgreSQL user & database
sudo -u postgres psql -c "CREATE USER tradenest WITH PASSWORD 'tradenest_secret';"
sudo -u postgres psql -c "ALTER USER tradenest CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE tradenest OWNER tradenest;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tradenest TO tradenest;"

# 3. Update DATABASE_URL in .env for local (non-Docker) use
#    DATABASE_URL=postgresql://tradenest:tradenest_secret@localhost:5432/tradenest

# 4. Backend setup
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Frontend setup
cd ../frontend
npm install
```

---

## Docker Setup

To run everything in Docker containers (PostgreSQL + Redis + Backend + Frontend):

```bash
cp .env.example .env
docker compose up -d
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `tradenest` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `tradenest_secret` | PostgreSQL password |
| `POSTGRES_DB` | `tradenest` | PostgreSQL database name |
| `DATABASE_URL` | `postgresql://tradenest:tradenest_secret@localhost:5432/tradenest` | Prisma connection string (local) |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `BACKEND_PORT` | `3001` | Backend server port |
| `JWT_SECRET` | (change in production) | JWT signing secret |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Frontend → Backend API URL |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | Frontend → Backend WebSocket URL |

---

## Phase 14 — Notifications Module (Current)

Phase 14 adds **in-app notifications** with persistence, realtime delivery, toast popups, and a notification center.

### Notification types

| Type | Trigger examples |
|------|------------------|
| `ORDER` | Order placed, order cancelled |
| `TRADE` | Buy/sell trade executed |
| `WALLET` | Credit, debit, lock, unlock |
| `SYSTEM` | Reserved for future system messages |
| `SECURITY` | Reserved for security alerts |

### Storage

| Table | Module | Purpose |
|-------|--------|---------|
| `notifications` | Notification | Per-user inbox with read state |

### Notification APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications/status` | Public | Module status |
| GET | `/api/notifications` | Auth | Paginated inbox for current user |
| GET | `/api/notifications/unread-count` | Auth | Unread badge count |
| PATCH | `/api/notifications/:id/read` | Auth | Mark one notification read |
| POST | `/api/notifications/read-all` | Auth | Mark all notifications read |

**Query params:** `page`, `limit`, `isRead`, `type`, `sortBy`, `sortOrder`

### Realtime

| Socket event | When |
|--------------|------|
| `notification.created` | New notification saved for the user (delivered to `user:{id}` room) |

### Auto-generated from domain events

| Event | Notification |
|-------|--------------|
| Order created | Order placed |
| Order cancelled | Order cancelled (+ unfilled release) |
| Trade executed | Separate buy/sell messages for each party |
| Wallet credited/debited | Amount + new balance |
| Wallet locked/unlocked | Locked/released amount + available balance |

### Frontend

| Route / UI | Feature |
|------------|---------|
| Header bell | Unread badge, quick dropdown, mark read |
| Toast stack | Live popup on `notification.created` |
| `/notifications` | Full inbox with filters and pagination |

### Tests

```bash
cd backend && npm test -- notification.service.spec
```

### Development phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1–13 | Structure through logging | ✅ Complete |
| 14 | Notifications module | ✅ Current |

---

**Phase 14 complete — all 14 phases implemented. Awaiting your review.**
