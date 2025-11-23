@echo off
REM Real-ESRGAN Backend Setup for Windows
REM RTX 3080 Ti (12GB VRAM) Optimized

echo ================================================
echo Real-ESRGAN Backend Setup (Windows)
echo ================================================
echo.
echo System Requirements:
echo - Python 3.8+
echo - NVIDIA GPU (RTX 3080 Ti)
echo - CUDA 11.8+
echo - 12GB+ VRAM
echo.
echo ================================================

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Python found
python --version

REM Create virtual environment
echo.
echo [1/4] Creating virtual environment...
if exist venv (
    echo Virtual environment already exists. Skipping...
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)

REM Activate virtual environment
echo.
echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated

REM Upgrade pip
echo.
echo [3/4] Upgrading pip...
python -m pip install --upgrade pip

REM Install PyTorch with CUDA 11.8
echo.
echo [4/4] Installing PyTorch with CUDA 11.8...
echo This may take a few minutes...
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

if errorlevel 1 (
    echo [ERROR] Failed to install PyTorch
    pause
    exit /b 1
)
echo [OK] PyTorch installed

REM Install other dependencies
echo.
echo [5/5] Installing other dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] All dependencies installed

REM Test GPU
echo.
echo ================================================
echo Testing GPU availability...
echo ================================================
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A'); print('GPU Count:', torch.cuda.device_count())"

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo To start the backend server:
echo   1. Run: start-server.bat
echo   or
echo   2. Run: venv\Scripts\activate.bat
echo   3. Run: python server.py
echo.
pause
