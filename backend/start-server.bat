@echo off
REM Start Real-ESRGAN Backend Server

echo ================================================
echo Starting Real-ESRGAN Backend Server
echo ================================================
echo.

REM Check if venv exists
if not exist venv (
    echo [ERROR] Virtual environment not found!
    echo Please run setup-windows.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if server.py exists
if not exist server.py (
    echo [ERROR] server.py not found!
    pause
    exit /b 1
)

REM Start server
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python server.py
