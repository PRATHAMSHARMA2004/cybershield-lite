@echo off
echo.
echo  ============================================
echo   CyberShield Lite — Local Dev Startup
echo  ============================================
echo.

:: Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Download from https://nodejs.org
    pause & exit /b 1
)

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Download from https://python.org (3.11+)
    pause & exit /b 1
)

:: Check .env
if not exist "backend\.env" (
    echo [INFO] Creating backend\.env from example...
    copy "backend\.env.example" "backend\.env"
    echo.
    echo  !! IMPORTANT: Open backend\.env and set:
    echo     MONGO_URI=mongodb://localhost:27017/cybershield
    echo     JWT_SECRET=your_random_secret_here
    echo.
    pause
)

:: Install deps if needed
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
)
if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

:: Check scanner deps
if not exist "scanner\venv" (
    echo [INFO] Setting up Python scanner...
    cd scanner
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

echo.
echo  Starting all services...
echo  - Backend  → http://localhost:5000
echo  - Frontend → http://localhost:3000
echo  - Scanner  → http://localhost:8000
echo.

:: Start scanner in separate window
start "CyberShield Scanner" cmd /k "cd scanner && venv\Scripts\activate && python app.py"

:: Start backend in separate window
start "CyberShield Backend" cmd /k "cd backend && npm run dev"

:: Wait a moment then start frontend
timeout /t 3 /nobreak >nul
start "CyberShield Frontend" cmd /k "cd frontend && npm start"

echo  All services starting in separate windows.
echo  Press any key to exit this window.
pause
