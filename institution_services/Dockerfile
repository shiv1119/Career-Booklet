# Use a lightweight Python image
FROM python:3.12-slim

# Set working directory in the container
WORKDIR /app

# Copy all files to the container's working directory
COPY . .

# Install dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# Expose the port FastAPI will run on
EXPOSE 9003

# Run the application (update the port and reload flag as needed)
CMD ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "9003", "--reload"]
