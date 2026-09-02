#!/bin/bash
# Run the OGIM/NISOC dashboard full-stack locally WITHOUT Docker:
# PostgreSQL + Redis + auth-service + operations-service + api-gateway
# + the frontend dev server. Idempotent - safe to re-run.
#
# For the full 14-microservice stack (Kafka, TimescaleDB, ML services, ...)
# use `docker-compose -f docker-compose.dev.yml up` instead; this script
# covers what the NISOC subsidiary/equipment/RBAC feature set needs.
#
# Usage:
#   scripts/run_local_dev.sh          # start everything
#   scripts/stop_local_dev.sh         # stop everything this script started

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend/web"
RUNTIME_DIR="$REPO_ROOT/.local-dev"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"
VENV_DIR="$BACKEND_DIR/.venv"

mkdir -p "$LOG_DIR" "$PID_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}!!${NC} $1"; }
fail()  { echo -e "${RED}xx${NC} $1"; }

# --- 1) PostgreSQL + Redis -----------------------------------------------

info "Starting PostgreSQL and Redis..."
if command -v pg_isready >/dev/null 2>&1 && pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  info "PostgreSQL already running"
else
  service postgresql start >/dev/null 2>&1 \
    || sudo service postgresql start >/dev/null 2>&1 \
    || warn "Could not start PostgreSQL automatically - start it yourself, then re-run."
  sleep 2
fi

if command -v redis-cli >/dev/null 2>&1 && redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
  info "Redis already running"
else
  service redis-server start >/dev/null 2>&1 \
    || sudo service redis-server start >/dev/null 2>&1 \
    || nohup redis-server --daemonize no --port 6379 >"$LOG_DIR/redis.log" 2>&1 &
  sleep 1
fi

if ! (command -v redis-cli >/dev/null 2>&1 && redis-cli -h localhost -p 6379 ping >/dev/null 2>&1); then
  warn "Redis does not seem to be reachable on localhost:6379 - auth-service login will fail without it."
fi

# --- 2) App database + role -----------------------------------------------

info "Ensuring ogim_user / ogim / ogim_tsdb exist..."
psql_admin() {
  if PGPASSWORD= psql -U postgres -h localhost -tc "select 1" >/dev/null 2>&1; then
    psql -U postgres -h localhost "$@"
  elif command -v sudo >/dev/null 2>&1 && sudo -n -u postgres true 2>/dev/null; then
    sudo -u postgres psql "$@"
  else
    su postgres -c "psql $*" 2>/dev/null
  fi
}

ROLE_EXISTS=$(psql_admin -tc "SELECT 1 FROM pg_roles WHERE rolname='ogim_user'" 2>/dev/null | tr -d '[:space:]')
if [ "$ROLE_EXISTS" != "1" ]; then
  psql_admin -c "CREATE USER ogim_user WITH PASSWORD 'ogim_password' SUPERUSER;" >/dev/null 2>&1 \
    && info "created role ogim_user" || warn "could not create role ogim_user (may already exist under a different setup)"
fi

for DB in ogim ogim_tsdb; do
  DB_EXISTS=$(psql_admin -tc "SELECT 1 FROM pg_database WHERE datname='$DB'" 2>/dev/null | tr -d '[:space:]')
  if [ "$DB_EXISTS" != "1" ]; then
    psql_admin -c "CREATE DATABASE $DB OWNER ogim_user;" >/dev/null 2>&1 \
      && info "created database $DB" || warn "could not create database $DB"
  fi
done

# --- 3) Python venv + deps -------------------------------------------------

if [ ! -d "$VENV_DIR" ]; then
  info "Creating Python venv at backend/.venv..."
  python3 -m venv "$VENV_DIR"
fi
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

info "Installing backend dependencies (cached after first run)..."
pip install -q --upgrade pip
pip install -q \
  -r "$BACKEND_DIR/shared/requirements.txt" \
  -r "$BACKEND_DIR/auth-service/requirements.txt" \
  -r "$BACKEND_DIR/operations-service/requirements.txt" \
  -r "$BACKEND_DIR/api-gateway/requirements.txt"

# --- 4) Shared env for every backend process -------------------------------

export DATABASE_URL="postgresql://ogim_user:ogim_password@localhost:5432/ogim"
export TIMESCALE_URL="postgresql://ogim_user:ogim_password@localhost:5432/ogim_tsdb"
export ENVIRONMENT=development
export CORS_ORIGINS='["http://localhost:3000"]'
export AUTH_SERVICE_URL="http://localhost:8001"
export OPERATIONS_SERVICE_URL="http://localhost:8016"
export REDIS_URL="redis://localhost:6379/0"

# --- 5) Schema + seed data --------------------------------------------------

info "Creating tables and seeding demo users/subsidiaries..."
python "$BACKEND_DIR/scripts/seed_local_dev.py"

# --- 6) Backend services -----------------------------------------------------

start_service() {
  local name="$1" app_dir="$2" module="$3" port="$4"
  local pid_file="$PID_DIR/$name.pid"

  if curl -sf "http://localhost:$port/health" >/dev/null 2>&1; then
    info "$name already responding on :$port"
    return
  fi

  info "Starting $name on :$port..."
  # `exec` inside the subshell replaces it with nohup/python in place (no
  # extra fork), so $! below is the actual server PID, not a wrapper's -
  # otherwise `kill "$pid"` in stop_local_dev.sh would leave the real
  # listener running as an orphan.
  (
    cd "$BACKEND_DIR" || exit 1
    exec nohup python -m uvicorn "$module" --app-dir "$app_dir" \
      --host 0.0.0.0 --port "$port" >"$LOG_DIR/$name.log" 2>&1
  ) &
  echo $! >"$pid_file"

  if ! timeout 30 bash -c "until curl -sf http://localhost:$port/health >/dev/null 2>&1; do sleep 1; done"; then
    fail "$name did not become healthy - check $LOG_DIR/$name.log"
  fi
}

start_service "auth-service"       "."                  "auth-service.main:app" 8001
start_service "operations-service" "operations-service" "main:app"              8016
start_service "api-gateway"        "api-gateway"         "main:app"             18000

# --- 7) Frontend --------------------------------------------------------------

FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
if curl -sf "http://localhost:3000" >/dev/null 2>&1; then
  info "frontend already responding on :3000"
else
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    info "Installing frontend dependencies (first run only)..."
    (cd "$FRONTEND_DIR" && npm install)
  fi
  info "Starting frontend dev server on :3000..."
  # npm forks vite as a child of its own process even under `exec`, so the
  # saved pid here is best-effort only - stop_local_dev.sh kills by port,
  # which is what actually frees :3000.
  (
    cd "$FRONTEND_DIR" || exit 1
    exec nohup npm run dev -- --host 0.0.0.0 >"$LOG_DIR/frontend.log" 2>&1
  ) &
  echo $! >"$FRONTEND_PID_FILE"
  timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null 2>&1; do sleep 1; done' \
    || fail "frontend did not come up - check $LOG_DIR/frontend.log"
fi

# --- 8) Summary ----------------------------------------------------------------

echo
info "Full stack is up:"
echo "  Dashboard (frontend) ......... http://localhost:3000"
echo "  API Gateway ................... http://localhost:18000"
echo "  Auth Service ................... http://localhost:8001"
echo "  Operations Service ............. http://localhost:8016"
echo "  PostgreSQL ...................... localhost:5432 (db: ogim)"
echo "  Redis ............................ localhost:6379"
echo
echo "  Demo logins (username / password / role):"
echo "    admin           / Admin@123      / system_admin"
echo "    hq_chief        / HqChief@123    / hq_operations_chief"
echo "    subsidiary_mgr  / Subsidiary@123 / subsidiary_ops_manager"
echo "    field_super     / FieldSuper@123 / field_supervisor"
echo "    data_entry1     / DataEntry@123  / data_entry_operator"
echo
echo "  Logs: $LOG_DIR/  |  Stop everything: scripts/stop_local_dev.sh"
