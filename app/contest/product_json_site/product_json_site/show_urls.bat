@echo off
setlocal

set "PORT=8000"

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set "IP=%%a"
  setlocal enabledelayedexpansion
  set "IP=!IP: =!"
  if not "!IP!"=="127.0.0.1" (
    echo Available LAN URLs:
    echo http://!IP!:%PORT%/
    echo http://!IP!:%PORT%/api/food.json
    echo http://!IP!:%PORT%/api/daily.json
    echo http://!IP!:%PORT%/api/electronics.json
    echo.
  )
  endlocal
)

pause
