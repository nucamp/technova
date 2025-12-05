FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Ensure the log directory exists (though the volume will mount over it)
RUN mkdir -p /var/log/shared

CMD ["python", "app.py"]
