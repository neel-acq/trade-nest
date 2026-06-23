#!/usr/bin/env bash
# ============================================================================
# TradeNest — Database Sync (Schema Changes)
# ============================================================================
# Run this after pulling new code that includes Prisma schema changes.
# It regenerates the Prisma client and pushes schema updates to the database.
#
# What it does:
#   1. Validates the Prisma schema
#   2. Generates the Prisma client (prisma generate)
#   3. Pushes schema changes to the database (prisma db push)
#   4. Optionally re-seeds if --seed flag is passed
#
# Usage:
#   chmod +x scripts/db-sync.sh
#   ./scripts/db-sync.sh           # sync schema only
#   ./scripts/db-sync.sh --seed    # sync schema + re-seed data
# ============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Resolve project root ────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

DB_USER="${POSTGRES_USER:-tradenest}"
DB_PASS="${POSTGRES_PASSWORD:-tradenest_secret}"
DB_NAME="${POSTGRES_DB:-tradenest}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# ── Parse flags ──────────────────────────────────────────────────────────────
RUN_SEED=false
for arg in "$@"; do
  case $arg in
    --seed) RUN_SEED=true ;;
  esac
done

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

# ── Pre-flight ──────────────────────────────────────────────────────────────
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
  print_error "PostgreSQL is not running on ${DB_HOST}:${DB_PORT}"
  exit 1
fi

cd "$PROJECT_DIR/backend"

# ── Step 1: Validate schema ────────────────────────────────────────────────
print_step "Step 1/3 — Validating Prisma schema"

npx prisma validate
print_success "Schema is valid"

# ── Step 2: Generate Prisma client ──────────────────────────────────────────
print_step "Step 2/3 — Generating Prisma client"

npx prisma generate
print_success "Prisma client generated"

# ── Step 3: Push schema to database ─────────────────────────────────────────
print_step "Step 3/3 — Pushing schema changes to database"

npx prisma db push
print_success "Database schema is up to date"

# ── Optional: Re-seed ──────────────────────────────────────────────────────
if [ "$RUN_SEED" = true ]; then
  print_step "Bonus — Re-seeding database"
  npx prisma db seed
  print_success "Database re-seeded"
fi

# ── Done ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Database sync complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Database:${NC}  $DATABASE_URL"
echo ""
