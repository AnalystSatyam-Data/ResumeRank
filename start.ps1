# ResumeRank Launcher Script for PowerShell
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  ResumeRank - Resume Indexing & Candidate Ranking" -ForegroundColor Cyan
Write-Host "  College PBL Demonstration Launcher" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "[1/2] Starting Flask Backend on Port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python backend/app.py"

# Start Frontend
Write-Host "[2/2] Starting Vite Frontend on Port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "ResumeRank running successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5001/api/health" -ForegroundColor Green
Start-Process "http://localhost:5173"
