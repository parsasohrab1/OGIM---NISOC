#!/bin/bash
# Stop the processes started by scripts/run_local_dev.sh.
#
# Kills by the port each service listens on rather than trusting saved
# PIDs alone: npm forks vite as a child of its own process, so the PID
# `run_local_dev.sh` captures for the frontend is only the npm wrapper -
# killing just that leaves the real server running and the port held.
#
# PostgreSQL and Redis are left running by default since they're shared
# system services with disk-backed data - pass --all to stop those too.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$REPO_ROOT/.local-dev/pids"

kill_port() {
  local name="$1" port="$2"
  local pids
  pids="$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "$pids" | xargs -r kill
    echo "stopped $name (:$port, pid(s) $pids)"
  fi
  rm -f "$PID_DIR/$name.pid"
}

kill_port "frontend"           3000
kill_port "api-gateway"        18000
kill_port "operations-service" 8016
kill_port "auth-service"       8001

if [ "${1:-}" = "--all" ]; then
  service redis-server stop >/dev/null 2>&1 || sudo service redis-server stop >/dev/null 2>&1 || true
  service postgresql stop >/dev/null 2>&1 || sudo service postgresql stop >/dev/null 2>&1 || true
  echo "stopped PostgreSQL and Redis"
fi

echo "done"
