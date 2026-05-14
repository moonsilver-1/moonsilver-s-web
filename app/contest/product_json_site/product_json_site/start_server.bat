@echo off
setlocal

set "SITE_DIR=%~dp0"
set "PYTHON_EXE=D:\anaconda\python.exe"
set "PORT=8000"
set "PID_FILE=%SITE_DIR%server.pid"

if not exist "%PYTHON_EXE%" (
  echo Python not found: %PYTHON_EXE%
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  echo Port %PORT% is already in use by PID %%a
  echo If this is your old service, run stop_server.bat first.
  pause
  exit /b 1
)

cd /d "%SITE_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Start-Process -FilePath '%PYTHON_EXE%' -ArgumentList 'server.py' -WorkingDirectory '%SITE_DIR%' -PassThru; $p.Id | Set-Content -Path '%PID_FILE%'"

if not exist "%PID_FILE%" (
  echo Failed to start the server.
  pause
  exit /b 1
)

set /p SERVER_PID=<"%PID_FILE%"
echo Server started.
echo PID: %SERVER_PID%
echo.
echo Open on this computer:
echo http://127.0.0.1:%PORT%/
echo.
echo API now returns one random sub-category per request.
echo Run show_urls.bat to see LAN URLs for your current IP.
pause
