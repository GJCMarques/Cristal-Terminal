#!/bin/bash
# CRISTAL CAPITAL TERMINAL — Start Python Quantum Backend
# Usage: bash python_backend/start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_DIR/venv"

echo "╔══════════════════════════════════════════════╗"
echo "║  CRISTAL QUANTUM BACKEND — FastAPI Server    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Activate venv
if [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
    echo "[OK] Virtual environment activated: $VENV_DIR"
else
    echo "[WARN] No venv found at $VENV_DIR, using system Python"
fi

# Check dependencies
echo ""
echo "Checking dependencies..."
python3 -c "import fastapi; print(f'  FastAPI: {fastapi.__version__}')" 2>/dev/null || echo "  [MISS] FastAPI"
python3 -c "import numpy; print(f'  NumPy: {numpy.__version__}')" 2>/dev/null || echo "  [MISS] NumPy"
python3 -c "import scipy; print(f'  SciPy: {scipy.__version__}')" 2>/dev/null || echo "  [MISS] SciPy"
python3 -c "import qiskit; print(f'  Qiskit: {qiskit.__version__}')" 2>/dev/null || echo "  [MISS] Qiskit (optional)"
python3 -c "import pennylane; print(f'  PennyLane: {pennylane.__version__}')" 2>/dev/null || echo "  [MISS] PennyLane (optional)"
python3 -c "import QuantLib; print('  QuantLib: OK')" 2>/dev/null || echo "  [MISS] QuantLib (optional)"

echo ""
echo "Starting server on http://0.0.0.0:8001 ..."
echo "Press Ctrl+C to stop"
echo ""

cd "$SCRIPT_DIR"
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload --log-level info
