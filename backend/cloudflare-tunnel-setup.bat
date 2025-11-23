@echo off
REM Cloudflare Tunnel Setup Script for Windows

echo ================================================
echo Cloudflare Tunnel Setup Guide
echo ================================================
echo.
echo This script will guide you through setting up
echo Cloudflare Tunnel to expose your local backend
echo to the internet securely.
echo.
echo Prerequisites:
echo - Cloudflare account (free)
echo - cloudflared installed
echo.
echo ================================================
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [ERROR] cloudflared is not installed!
    echo.
    echo Please download and install cloudflared:
    echo https://github.com/cloudflare/cloudflared/releases/latest
    echo.
    echo Or install using winget:
    echo   winget install Cloudflare.cloudflare-warp
    echo.
    pause
    exit /b 1
)

echo [OK] cloudflared is installed
cloudflared --version
echo.

echo ================================================
echo Step 1: Login to Cloudflare
echo ================================================
echo This will open your browser for authentication.
echo.
pause

cloudflared login

if errorlevel 1 (
    echo [ERROR] Login failed!
    pause
    exit /b 1
)

echo.
echo [OK] Login successful!
echo.

echo ================================================
echo Step 2: Create Tunnel
echo ================================================
echo.
set /p TUNNEL_NAME="Enter tunnel name (e.g., upscale-backend): "

cloudflared tunnel create %TUNNEL_NAME%

if errorlevel 1 (
    echo [ERROR] Tunnel creation failed!
    pause
    exit /b 1
)

echo.
echo [OK] Tunnel created successfully!
echo.
echo ================================================
echo Step 3: Configure DNS
echo ================================================
echo.
echo Please enter your domain/subdomain:
echo Example: backend.yourdomain.com
echo.
set /p DOMAIN="Domain: "

cloudflared tunnel route dns %TUNNEL_NAME% %DOMAIN%

echo.
echo [OK] DNS configured!
echo.

echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Your tunnel is ready!
echo.
echo To start the tunnel:
echo   cloudflared tunnel run %TUNNEL_NAME%
echo.
echo Your backend will be available at:
echo   https://%DOMAIN%
echo.
echo Next steps:
echo 1. Run: start-tunnel.bat
echo 2. Run: start-server.bat
echo 3. Update Vercel environment variable:
echo    UPSCALE_BACKEND_URL=https://%DOMAIN%
echo.
pause
