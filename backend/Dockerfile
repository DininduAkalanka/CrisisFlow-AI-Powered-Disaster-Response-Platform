# Use Python 3.11 (PyTorch compatibility)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download AI models at build time (optional - comment out if you want to download at runtime)
# RUN python -c "import timm; timm.create_model('tf_efficientnetv2_s', pretrained=True)" && \
#     python -c "import clip; clip.load('ViT-B/32', device='cpu')" && \
#     python -c "from gliner import GLiNER; GLiNER.from_pretrained('urchade/gliner_base')"

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads models

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
