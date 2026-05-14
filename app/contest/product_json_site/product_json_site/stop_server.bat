@echo off
setlocal

set "SITE_DIR=%~dp0"
set "PID_FILE=%SITE_DIR%server.pid"

if not exist "%PID_FILE%" (
  echo No PID file found. The server may already be stopped.
  pause
  exit /b 0
)

set /p SERVER_PID=<"%PID_FILE%"

if "%SERVER_PID%"=="" (
  echo PID file is empty.
  del "%PID_FILE%" >nul 2>nul
  pause
  exit /b 1
)

taskkill /PID %SERVER_PID% /F >nul 2>nul

if errorlevel 1 (
  echo Failed to stop PID %SERVER_PID%.
  echo It may already have exited.
) else (
  echo Server stopped. PID: %SERVER_PID%
)

del "%PID_FILE%" >nul 2>nul
pause
