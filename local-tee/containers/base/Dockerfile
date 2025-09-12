FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    numpy==1.24.3 \
    pandas==2.0.3 \
    scikit-learn==1.3.0 \
    torch==2.0.1 \
    tensorflow==2.13.0 \
    matplotlib==3.7.2 \
    seaborn==0.12.2 \
    jupyter==1.0.0

# Create output directory
RUN mkdir -p /outputs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TEE_MODE=local

# Default command
CMD ["python", "--version"]
