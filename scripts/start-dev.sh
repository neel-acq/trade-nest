#!/usr/bin/env bash
# ============================================================================
# TradeNest — Start Development Servers
# ============================================================================
# Starts both backend (NestJS) and frontend (Next.js) dev servers
# in parallel. Press Ctrl+C to stop both.
#
# Usage:
#   chmod +x scripts/start-dev.sh
#   ./scripts/start-dev.sh
# ============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ── Resolve project root ────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Override DATABASE_URL for local use
DB_USER="${POSTGRES_USER:-tradenest}"
DB_PASS="${POSTGRES_PASSWORD:-tradenest_secret}"
DB_NAME="${POSTGRES_DB:-tradenest}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="3000"

# ── Trap to kill both processes on exit ─────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}⏹  Shutting down dev servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}✔ All servers stopped${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Pre-flight checks ──────────────────────────────────────────────────────
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 TradeNest — Starting Development Servers${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check node_modules exist
if [ ! -d "$PROJECT_DIR/backend/node_modules" ]; then
  echo -e "${RED}  ✖ Backend node_modules not found. Run ./scripts/setup.sh first.${NC}"
  exit 1
fi

if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo -e "${RED}  ✖ Frontend node_modules not found. Run ./scripts/setup.sh first.${NC}"
  exit 1
fi

# Check PostgreSQL
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
  echo -e "${RED}  ✖ PostgreSQL is not running on ${DB_HOST}:${DB_PORT}${NC}"
  exit 1
fi
echo -e "${GREEN}  ✔ PostgreSQL is running${NC}"

# Check Redis
if command -v redis-cli &> /dev/null; then
  if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping &> /dev/null; then
    echo -e "${GREEN}  ✔ Redis is running${NC}"
  else
    echo -e "${YELLOW}  ⚠ Redis is not responding — backend may fail to start${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ redis-cli not found — cannot verify Redis status${NC}"
fi

echo ""

# ── Start Backend ───────────────────────────────────────────────────────────
echo -e "${BLUE}[Backend]${NC}  Starting NestJS on port ${BACKEND_PORT}..."
cd "$PROJECT_DIR/backend"
npm run start:dev 2>&1 | sed "s/^/$(echo -e "${BLUE}[Backend]${NC}")  /" &
BACKEND_PID=$!

# ── Start Frontend ──────────────────────────────────────────────────────────
echo -e "${MAGENTA}[Frontend]${NC} Starting Next.js on port ${FRONTEND_PORT}..."
cd "$PROJECT_DIR/frontend"
npm run dev 2>&1 | sed "s/^/$(echo -e "${MAGENTA}[Frontend]${NC}") /" &
FRONTEND_PID=$!

# ── Wait ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:${BACKEND_PORT}"
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:${FRONTEND_PORT}"
echo -e "  ${CYAN}API docs:${NC}  http://localhost:${BACKEND_PORT}/api"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

wait $BACKEND_PID $FRONTEND_PID
