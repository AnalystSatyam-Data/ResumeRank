@echo off
echo ===================================================
echo   ResumeRank - Resume Indexing & Candidate Ranking
echo   College PBL Demonstration Launcher
echo ===================================================
echo.

:: Check python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo [1/3] Starting Flask Backend Server (Port 5001)...
start "ResumeRank Backend (Flask)" cmd /k "python backend/app.py"

echo [2/3] Starting React Frontend Server (Port 5173)...
start "ResumeRank Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 >nul

echo.
echo ===================================================
echo   ResumeRank is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5001/api/health
echo ===================================================
echo.
echo Opening browser...
start http://localhost:5173
pause
