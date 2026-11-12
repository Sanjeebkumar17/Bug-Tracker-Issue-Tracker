@echo off
echo ========================================================
echo   Starting Bug Tracker React + Vite Frontend Server
echo ========================================================
cd frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)

echo Starting Vite on http://localhost:5173 ...
npm run dev
