#!/bin/bash
set -e

echo ""
echo "============================================"
echo " CyberShield Lite — Local Dev Startup"
echo "============================================"
echo ""

# Check Node
if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js not found. Install from https://nodejs.org"; exit 1
fi

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] Python 3 not found. Install from https://python.org (3.11+)"; exit 1
fi

# Create .env if missing
if [ ! -f "backend/.env" ]; then
  echo "[INFO] Creating backend/.env from example..."
  cp backend/.env.example backend/.env
  echo ""
  echo "!! IMPORTANT: Edit backend/.env and set MONGO_URI and JWT_SECRET"
  echo "   Then run this script again."
  echo ""
  exit 1
fi

# Install root deps
[ ! -d "node_modules" ] && npm install

# Install backend deps
[ ! -d "backend/node_modules" ] && (cd backend && npm install)

# Install frontend deps
[ ! -d "frontend/node_modules" ] && (cd frontend && npm install)

# Set up Python venv
if [ ! -d "scanner/venv" ]; then
  echo "[INFO] Setting up Python scanner..."
  cd scanner && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
fi

echo ""
echo " Starting all services..."
echo " - Backend  → http://localhost:5000"
echo " - Frontend → http://localhost:3000"
echo " - Scanner  → http://localhost:8000"
echo ""

# Start scanner
(cd scanner && source venv/bin/activate && python app.py &)

# Start backend
(cd backend && npm run dev &)

# Start frontend
(cd frontend && npm start &)

echo " All services started. Press Ctrl+C to stop all."
wait
