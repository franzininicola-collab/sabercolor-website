@echo off
title SaberBot API Server (Node.js)
color 0A

echo.
echo  ============================================
echo       SABERBOT API SERVER - Node.js Express
echo  ============================================
echo.

cd /d "%~dp0"

:: Verifica Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato!
    echo Scaricalo da: https://nodejs.org
    pause
    exit /b 1
)

:: Verifica dipendenze
if not exist "node_modules" (
    echo [INFO] Installazione dipendenze in corso...
    npm install
    echo.
)

:: Verifica file .env
if not exist ".env" (
    echo [ERRORE] File .env non trovato!
    echo Copia .env.example in .env e inserisci la tua API Key.
    pause
    exit /b 1
)

echo [OK] Avvio server...
echo.
npm start

pause
