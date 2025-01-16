# Use a lightweight Python image
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y netcat-openbsd
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory in the container
WORKDIR /app

# Copy all files to the container's working directory
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Expose the port FastAPI will run on
EXPOSE 9001

# Run the application (update the port and reload flag as needed)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9001", "--reload"]

