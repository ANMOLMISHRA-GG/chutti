"""Vercel Serverless ASGI entrypoint for Chutti.com FastAPI backend."""
import sys
from pathlib import Path

# Add project root directory to sys.path so server.py and its sibling modules are discoverable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from server import app  # noqa: E402
