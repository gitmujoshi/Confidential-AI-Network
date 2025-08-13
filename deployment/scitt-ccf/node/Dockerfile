FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/ccf
EXPOSE 8000 8001

# Create a simple health check endpoint
COPY server.py /opt/ccf/server.py
CMD ["python3", "/opt/ccf/server.py"]
