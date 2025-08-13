FROM python:3.9-slim
RUN pip install requests psutil
WORKDIR /app
COPY monitor.py .
CMD ["python", "monitor.py"]
