# Travel Agency CRM — FastAPI Backend
# Playwright/Chromium included for live flight scraping

FROM python:3.11-slim

WORKDIR /app

# ── 1. System dependencies ────────────────────────────────────────────────────
# Chromium runtime libs + curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    # healthcheck
    curl \
    # Postgres client lib
    libpq5 \
    # Chromium shared libs
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 libxshmfence1 \
    libx11-6 libx11-xcb1 libxcb1 libxext6 \
    libxfont2 libxrender1 libxtst6 ca-certificates \
    fonts-liberation fonts-noto-cjk \
    wget xvfb \
    && rm -rf /var/lib/apt/lists/*

# ── 2. Python dependencies ────────────────────────────────────────────────────
COPY fastapi-backend/fastapi-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── 3. Playwright + Chromium ──────────────────────────────────────────────────
# System deps already installed above — skip --with-deps to avoid conflicts
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN playwright install chromium

# ── 4. Application source ─────────────────────────────────────────────────────
COPY fastapi-backend/fastapi-backend/ .

# Chromium IS installed — use local scraping
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
ENV USE_REMOTE_BROWSER=false

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
