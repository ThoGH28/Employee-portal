# Multi-stage build for production-ready Django app
FROM python:3.12-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Create application user
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=appuser:appuser . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/vector_db /app/media /app/staticfiles && \
    chmod -R 777 /app/logs /app/vector_db /app/media /app/staticfiles && \
    chown -R appuser:appuser /app

# Add entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Use entrypoint script to handle startup
ENTRYPOINT ["/app/entrypoint.sh"]
