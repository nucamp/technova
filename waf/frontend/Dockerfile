FROM python:3.9-slim

WORKDIR /app

RUN pip install flask

COPY app.py .

RUN mkdir -p /var/log/shared

CMD ["python", "app.py"]
