FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including LUKS tools
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    wget \
    git \
    cryptsetup \
    e2fsprogs \
    mount \
    umount \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir numpy==1.24.3
RUN pip install --no-cache-dir pandas==2.0.3
RUN pip install --no-cache-dir scikit-learn==1.3.0
RUN pip install --no-cache-dir torch==2.0.1
RUN pip install --no-cache-dir tensorflow==2.13.0
RUN pip install --no-cache-dir matplotlib==3.7.2
RUN pip install --no-cache-dir seaborn==0.12.2
RUN pip install --no-cache-dir jupyter==1.0.0
RUN pip install --no-cache-dir requests==2.31.0

# Copy application files
COPY . .

# Create directories
RUN mkdir -p /data /outputs /logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TEE_MODE=cloud
ENV CONTAINER_ID=test-container-1
ENV JOB_ID=test-job-1

# Set permissions
RUN chmod +x entrypoint.sh

# Expose port for monitoring
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run entrypoint
CMD ["./entrypoint.sh"]
