# Developer Guide

## 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Docker / Docker Compose (for running the services)

## 2. Quick Backend setup
```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install -r backend/shared/requirements.txt
uvicorn backend/auth-service.main:app --reload --port 8001
```

## 3. Frontend setup
```bash
cd frontend/web
npm install
npm run dev
```

## 4. Configuration environments
- Sample files in `config/*.env.example`
- Set the `OGIM_ENV_FILE` or `ENVIRONMENT` variable so that the appropriate file is loaded (details in `docs/CONFIGURATION.md`).

## 5. Testing and quality
- Run `pytest` in `backend/`
- Lint: `black --check backend`, `flake8 backend`
- CI/CD: GitHub Actions (`backend-ci.yml`) runs on push/PR to main.

## 6. Code structure
- FastAPI services in `backend/<service>/`
- Shared code in `backend/shared/`
- Documentation in `docs/`

## 7. Development workflow
1. Create a feature branch
2. Make changes and run lint/test locally
3. Open a Pull Request => CI must be green
4. After review and merge, migrations and deployment follow `docs/MIGRATIONS.md`
