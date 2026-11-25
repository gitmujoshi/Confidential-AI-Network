# syntax=docker/dockerfile:1
# Build from the repo with the inference scorer as a named context:
#   docker build -t contractmanagement/local-trainer:latest \
#     -f backend/local-training/Dockerfile \
#     --build-context inference=inference/backend \
#     backend/local-training
FROM python:3.11-slim

WORKDIR /app

RUN python -m pip install --no-cache-dir --upgrade pip \
  && python -m pip install --no-cache-dir \
    "numpy>=1.26.4,<2" \
  && python -m pip install --no-cache-dir \
    torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu \
  && python -m pip install --no-cache-dir \
    scikit-learn==1.5.2 \
    transformers==4.46.3 \
    datasets==3.1.0 \
    accelerate==1.0.1 \
    opacus==1.5.2 \
    cryptography==43.0.3

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OUTPUT_DIR=/outputs \
    MAX_EPOCHS=5 \
    EPOCH_SLEEP_SECONDS=0.6

COPY train.py /app/train.py
COPY guest_key.py /app/guest_key.py
COPY guest_entry.py /app/guest_entry.py
COPY --from=inference infer.py /app/infer.py

VOLUME ["/outputs"]

CMD ["python", "/app/guest_entry.py"]

