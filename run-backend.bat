@echo off
echo ========================================================
echo   Starting Bug Tracker FastAPI Backend Server
echo ========================================================
cd backend
if not exist ".venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    python seed_data.py
) else (
    call .venv\Scripts\activate.bat
)

echo Starting Uvicorn on http://127.0.0.1:8000 ...
echo Swagger UI documentation: http://127.0.0.1:8000/docs
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
