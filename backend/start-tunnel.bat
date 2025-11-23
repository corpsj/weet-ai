@echo off
REM Start Cloudflare Tunnel

echo ================================================
echo Starting Cloudflare Tunnel
echo ================================================
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [ERROR] cloudflared is not installed!
    echo Please run: cloudflare-tunnel-setup.bat
    pause
    exit /b 1
)

echo Enter your tunnel name:
echo (The name you created during setup)
echo.
set /p TUNNEL_NAME="Tunnel name: "

echo.
echo Starting tunnel: %TUNNEL_NAME%
echo Press Ctrl+C to stop
echo.

cloudflared tunnel run %TUNNEL_NAME%
