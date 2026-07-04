# Backend

FastAPI backend for AI Resume Analyzer & Career Advisor.

## Local Development

```powershell
cd backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r ..\\requirements.txt
uvicorn app.main:app --reload
```

Health check:

```text
GET /api/v1/health
```
