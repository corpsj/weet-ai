@echo off
REM Start both Cloudflare Tunnel and Backend Server

echo ================================================
echo Starting Weet AI Backend Services
echo ================================================
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [WARNING] cloudflared not found!
    echo Skipping tunnel... (only local mode will work)
    echo.
    goto start_backend
)

echo Enter your Cloudflare tunnel name:
set /p TUNNEL_NAME="Tunnel name (press Enter to skip): "

if "%TUNNEL_NAME%"=="" (
    echo Skipping Cloudflare Tunnel...
    goto start_backend
)

echo.
echo Starting Cloudflare Tunnel in new window...
start "Cloudflare Tunnel" cloudflared tunnel run %TUNNEL_NAME%

timeout /t 3 >nul

:start_backend
echo.
echo Starting Backend Server...
echo.

call start-server.bat
