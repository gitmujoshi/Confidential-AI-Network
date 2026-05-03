FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy training script
COPY train.py .

# Create output directory
RUN mkdir -p /outputs

# Set environment variables
ENV JOB_ID=test-deploy-job
ENV TRAINING_EPOCHS=10
ENV BATCH_SIZE=32

# Run training
CMD ["python", "train.py"]
