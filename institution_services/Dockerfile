FROM python:3.12-slim

WORKDIR /app

COPY . .

# RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 9003

CMD ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "9003", "--reload"]
