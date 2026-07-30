# Travel Agency CRM — FastAPI Backend
# Builds from repo root, sources code from fastapi-backend/fastapi-backend/

FROM python:3.11-slim

WORKDIR /app

# Runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY fastapi-backend/fastapi-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY fastapi-backend/fastapi-backend/ .

# No local browser — scraper uses remote Bright Data connection
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV USE_REMOTE_BROWSER=true

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
