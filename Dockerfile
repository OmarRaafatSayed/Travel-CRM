# Optimized Docker build for Travel Agency CRM Backend
# Uses Bright Data Cloud Browser (remote) - NO local browser installation

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY fastapi-backend/requirements.txt .

# Install Python packages WITHOUT Playwright browsers (remote connection only)
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime (Lightweight)
FROM python:3.11-slim

WORKDIR /app

# Install ONLY essential runtime dependencies (no Chrome/Chromium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY fastapi-backend/ .

# Create logs directory
RUN mkdir -p logs

# Set environment variables for remote browser connection
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV USE_REMOTE_BROWSER=true

# Expose port
EXPOSE 8000

# Lightweight health check (no requests library needed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
