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
    opacus==1.5.2

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OUTPUT_DIR=/outputs \
    MAX_EPOCHS=5 \
    EPOCH_SLEEP_SECONDS=0.6

COPY train.py /app/train.py

VOLUME ["/outputs"]

CMD ["python", "/app/train.py"]

