@echo off
REM ==============================================================================
REM ResumeRank - Build Script for Windows (Unit 3 & Unit 4 C Algorithms)
REM Compiles knapsack.c and branch_bound.c using GCC / MinGW
REM ==============================================================================

echo [ResumeRank] Checking for C compiler (GCC/MinGW)...
where gcc >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] GCC is not found in PATH!
    echo Please install MinGW-w64 or GCC for Windows:
    echo   - Option 1: choco install mingw
    echo   - Option 2: winget install -e --id MSYS2.MSYS2
    echo   - Option 3: Download MinGW-w64 from winlibs.com
    exit /b 1
)

echo [ResumeRank] Compiling Unit 3: 0/1 Knapsack (knapsack.c)...
gcc -Wall -Wextra -O2 -std=c99 knapsack.c -o knapsack.exe -lm
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile knapsack.c!
    exit /b %errorlevel%
)
echo [ResumeRank] Compiled successfully: knapsack.exe

echo [ResumeRank] Compiling Unit 4: Branch and Bound (branch_bound.c)...
gcc -Wall -Wextra -O2 -std=c99 branch_bound.c -o branch_bound.exe -lm
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile branch_bound.c!
    exit /b %errorlevel%
)
echo [ResumeRank] Compiled successfully: branch_bound.exe

echo.
echo ==============================================================================
echo [SUCCESS] Both Unit 3 and Unit 4 C executables are compiled and ready.
echo To run standalone demos:
echo   .\knapsack.exe --demo
echo   .\branch_bound.exe --demo
echo ==============================================================================
