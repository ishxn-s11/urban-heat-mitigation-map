#!/usr/bin/env bash
# AERIS / UrbanFlux — one-command dev setup
# Usage: ./scripts/dev-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> [1/4] Python venv + backend deps"
if [ ! -d backend/.venv ]; then
  python -m venv backend/.venv
fi
# shellcheck disable=SC1091
source backend/.venv/Scripts/activate 2>/dev/null || source backend/.venv/bin/activate
python -m pip install --upgrade pip --quiet
pip install --quiet -r backend/requirements.txt

echo "==> [2/4] Frontend deps"
(cd frontend && npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund)

echo "==> [3/4] Environment file"
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "    Created .env from .env.example (demo mode works out of the box)"
fi

echo "==> [4/4] Verify install"
(cd backend && python -m pytest -q)
(cd frontend && npm run test)

echo ""
echo "Setup complete. Start the stack with:"
echo "  backend:  (cd backend && ../backend/.venv/Scripts/python -m uvicorn app.main:app --reload || ../backend/.venv/bin/python -m uvicorn app.main:app --reload)"
echo "  frontend: (cd frontend && npm run dev)"
