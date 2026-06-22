# 1. Builderステージ (uv venv)
FROM python:3.14-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
RUN uv venv /opt/venv && uv pip install --python /opt/venv fastapi uvicorn sqlalchemy psycopg2-binary asyncpg alembic pydantic-settings ruff ty pytest httpx redis structlog

# 2. Runnerステージ (実行用軽量イメージ)
FROM python:3.14-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN useradd -m -s /bin/bash appuser && chown -R appuser:appuser /app
USER appuser
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
