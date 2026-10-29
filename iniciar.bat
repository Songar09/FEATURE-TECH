@echo off
rem FEATURE TECH - Inicia backend y frontend en dos ventanas y abre el navegador.
rem Requiere haber hecho la instalacion inicial (README, seccion 2).
rem Para detener: cierre las dos ventanas "FEATURE TECH" o presione Ctrl+C en cada una.

cd /d "%~dp0"

if not exist "backend\.env" (
  echo Falta backend\.env. Copie backend\.env.example a backend\.env y complete DATABASE_URL.
  pause
  exit /b 1
)
if not exist "backend\node_modules" (
  echo Instalando dependencias del backend...
  pushd backend & call npm install & popd
)
if not exist "frontend\node_modules" (
  echo Instalando dependencias del frontend...
  pushd frontend & call npm install & popd
)

start "FEATURE TECH - Backend (4000)" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "FEATURE TECH - Frontend (5173)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Esperando a que el frontend arranque...
timeout /t 10 /nobreak >nul
start "" http://localhost:5173
