@echo off
echo ==========================================
echo   Starting Ba7ath Microsite Environment
echo ==========================================

REM 1. Start Backend Server
echo [1/3] Launching Backend API (Port 8000)...
start "Ba7ath Backend API" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

REM Wait 3 seconds for backend to initialize
timeout /t 3 >nul

REM 2. Start Frontend Dev Server
echo [2/3] Launching Frontend (Vite)...
start "Ba7ath Frontend" cmd /k "npm run dev"

REM Wait 3 seconds for frontend to be ready
timeout /t 3 >nul

REM 3. Open Browser
echo [3/3] Opening Web Browser...
start http://localhost:5173/enriched

echo.
echo All services started successfully!
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
pause
