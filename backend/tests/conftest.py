"""Shared test fixtures."""

import sys
from pathlib import Path

# Add backend to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))
