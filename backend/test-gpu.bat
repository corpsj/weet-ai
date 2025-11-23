@echo off
REM Test GPU and CUDA availability

echo ================================================
echo GPU Test Script
echo ================================================
echo.

if not exist venv (
    echo [ERROR] Virtual environment not found!
    echo Please run setup-windows.bat first
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo Testing GPU...
echo.

python -c "import torch; print('=' * 50); print('PyTorch Version:', torch.__version__); print('CUDA Available:', torch.cuda.is_available()); print('CUDA Version:', torch.version.cuda); print('=' * 50); print(); print('GPU Information:'); print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A'); print('GPU Count:', torch.cuda.device_count()); print('Current Device:', torch.cuda.current_device() if torch.cuda.is_available() else 'N/A'); print(); mem = torch.cuda.get_device_properties(0).total_memory / (1024**3) if torch.cuda.is_available() else 0; print('Total VRAM: {:.1f}GB'.format(mem)); print('=' * 50)"

echo.
pause
