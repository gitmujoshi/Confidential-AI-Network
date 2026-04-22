FROM python:3.11-slim

WORKDIR /app

COPY train.py /app/train.py

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OUTPUT_DIR=/outputs \
    MAX_EPOCHS=5 \
    EPOCH_SLEEP_SECONDS=0.6

VOLUME ["/outputs"]

CMD ["python", "/app/train.py"]

