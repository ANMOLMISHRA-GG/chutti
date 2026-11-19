#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "Created .env from .env.example — add your GEMINI_API_KEY in .env for live AI planning."
fi

if [ -x ".venv/bin/python" ]; then
  exec .venv/bin/python server.py
else
  exec python3 server.py
fi

