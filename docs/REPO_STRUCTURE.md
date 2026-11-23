# Repository Structure

```
OGIM---Oil-Gas-Intelligent-Monitoring/
├── backend/                # Backend microservices (FastAPI)
├── frontend/               # Web dashboard (React/Vite)
├── infrastructure/         # Docker, Prometheus, logging configs
├── docs/                   # Documentation
├── data/                   # Sample datasets and generators
├── scripts/                # Utility scripts (deployment, tests)
├── html-demo/              # Lightweight HTML prototype
├── requirements.txt        # Shared dependencies for tooling
├── .github/workflows/      # CI/CD pipelines
└── README.md               # SRS and high-level overview
```

> Note: The duplicate folder `OGIM---Oil-Gas-Intelligent-Monitoring/OGIM---Oil-Gas-Intelligent-Monitoring/` is no longer used and has been kept for compatibility; it will be removed in future versions.

## Guidelines
- All backend services are in `backend/`; each service has its own independent folder and its own `requirements.txt` file.
- The official documentation is kept in `docs/` and linked from the main README.
- Infrastructure files (Prometheus, logging, docker-compose) are grouped in `infrastructure/`.
- Sample data and generators are inside `data/`; it contains CSV/JSON samples for development scenarios.
