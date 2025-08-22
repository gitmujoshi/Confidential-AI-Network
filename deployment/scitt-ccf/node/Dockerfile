FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/ccf
EXPOSE 8000 8001
CMD ["python3", "-m", "http.server", "8000"]
