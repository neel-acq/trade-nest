#!/usr/bin/env bash
# ============================================================================
# TradeNest — Full Project Setup
# ============================================================================
# Creates PostgreSQL user & database, installs all dependencies,
# generates Prisma client, pushes schema, and seeds initial data.
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# ============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Resolve project root (one level up from scripts/) ───────────────────────
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  echo -e "${CYAN}📄 Loading .env file...${NC}"
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

DB_USER="${POSTGRES_USER:-tradenest}"
DB_PASS="${POSTGRES_PASSWORD:-tradenest_secret}"
DB_NAME="${POSTGRES_DB:-tradenest}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

# Build local DATABASE_URL (overrides Docker-style one from .env)
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# ── Helpers ──────────────────────────────────────────────────────────────────
print_step() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}▶ $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() { echo -e "${GREEN}  ✔ $1${NC}"; }
print_warn()    { echo -e "${YELLOW}  ⚠ $1${NC}"; }
print_error()   { echo -e "${RED}  ✖ $1${NC}"; }

# ── Pre-flight checks ──────────────────────────────────────────────────────
print_step "Pre-flight checks"

if ! command -v psql &> /dev/null; then
  print_error "psql not found. Please install PostgreSQL client tools."
  exit 1
fi
print_success "psql found"

if ! command -v node &> /dev/null; then
  print_error "node not found. Please install Node.js (v18+)."
  exit 1
fi
print_success "Node.js $(node -v) found"

if ! command -v npm &> /dev/null; then
  print_error "npm not found. Please install npm."
  exit 1
fi
print_success "npm found"

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
  print_error "PostgreSQL server is not running on ${DB_HOST}:${DB_PORT}"
  exit 1
fi
print_success "PostgreSQL server is running on ${DB_HOST}:${DB_PORT}"

# ── Step 1: Create PostgreSQL user ─────────────────────────────────────────
print_step "Step 1/6 — Creating PostgreSQL user '${DB_USER}'"

USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null || echo "")

if [ "$USER_EXISTS" = "1" ]; then
  print_warn "User '${DB_USER}' already exists — skipping"
else
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null
  sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;" 2>/dev/null
  print_success "User '${DB_USER}' created with CREATEDB privilege"
fi

# ── Step 2: Create PostgreSQL database ─────────────────────────────────────
print_step "Step 2/6 — Creating PostgreSQL database '${DB_NAME}'"

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
  print_warn "Database '${DB_NAME}' already exists — skipping"
else
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null
  print_success "Database '${DB_NAME}' created (owner: ${DB_USER})"
fi

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null
print_success "Privileges granted on '${DB_NAME}' to '${DB_USER}'"

# ── Step 3: Install backend dependencies ──────────────────────────────────
print_step "Step 3/6 — Installing backend npm dependencies"

cd "$PROJECT_DIR/backend"
npm install
print_success "Backend dependencies installed"

# ── Step 4: Prisma generate + db push ─────────────────────────────────────
print_step "Step 4/6 — Generating Prisma client & pushing schema"

npx prisma generate
print_success "Prisma client generated"

npx prisma db push
print_success "Database schema pushed"

# ── Step 5: Seed the database ─────────────────────────────────────────────
print_step "Step 5/6 — Seeding initial data"

npx prisma db seed
print_success "Database seeded"

# ── Step 6: Install frontend dependencies ────────────────────────────────
print_step "Step 6/6 — Installing frontend npm dependencies"

cd "$PROJECT_DIR/frontend"
npm install
print_success "Frontend dependencies installed"

# ── Done ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 TradeNest setup complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Database URL:${NC}  $DATABASE_URL"
echo ""
echo -e "  ${CYAN}To start both servers:${NC}"
echo -e "    ./scripts/start-dev.sh"
echo ""
echo -e "  ${CYAN}Login credentials:${NC}"
echo -e "    Admin:   admin_01  /  TradeNest@123"
echo -e "    Traders: trader_01 – trader_60  /  TradeNest@123"
echo ""
