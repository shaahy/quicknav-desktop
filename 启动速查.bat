@echo off
setlocal

cd /d "%~dp0"
call npm run dev

if errorlevel 1 (
  echo.
  echo Failed to start the project.
  pause
)

endlocal
