"""
CrisisFlow Backend - Main FastAPI Application
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db
from app.core.monitoring import get_metrics_collector
from app.api.incidents import router as incidents_router
from app.api.dashboard import router as dashboard_router
from app.api.ai import router as ai_router

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Disaster Response & Resource Coordinator",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Monitoring middleware - tracks all requests
@app.middleware("http")
async def monitoring_middleware(request: Request, call_next):
    """Track request latency and errors for all endpoints"""
    start_time = time.time()
    status_code = 200
    
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception as e:
        status_code = 500
        raise
    finally:
        # Record metrics
        latency_ms = (time.time() - start_time) * 1000
        endpoint = f"{request.method} {request.url.path}"
        
        metrics = get_metrics_collector()
        metrics.record_request(endpoint, latency_ms, status_code)
        
        # Log slow requests (>1 second)
        if latency_ms > 1000:
            print(f"[SLOW REQUEST] {endpoint} took {latency_ms:.2f}ms")


# Mount static files (uploads)
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    """Initialize database connection and schema on application startup"""
    print("Initializing CrisisFlow Backend...")
    init_db()
    print("Database initialized")
    print(f"Server starting on: http://localhost:8000")
    print(f"API Documentation: http://localhost:8000/docs")


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "description": "AI-Powered Disaster Response & Resource Coordinator",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """
    Enhanced health check endpoint with system status
    Returns detailed health information for monitoring systems
    """
    from app.core.database import SessionLocal
    from sqlalchemy import text
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "database": "unknown",
        "postgis": "unknown"
    }
    
    # Check database connection
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        health_status["database"] = "connected"
        
        # Check PostGIS extension
        try:
            result = db.execute(text("SELECT PostGIS_Version()")).scalar()
            health_status["postgis"] = f"enabled ({result})"
        except:
            health_status["postgis"] = "disabled"
        
        db.close()
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"] = f"error: {str(e)}"
    
    return health_status


@app.get("/metrics")
def get_metrics():
    """
    Prometheus-style metrics endpoint
    Returns comprehensive system and application metrics
    """
    metrics = get_metrics_collector()
    return metrics.get_summary()


@app.get("/metrics/endpoints")
def get_endpoint_metrics():
    """Get detailed metrics for all API endpoints"""
    metrics = get_metrics_collector()
    summary = metrics.get_summary()
    return {
        "endpoints": summary.get("endpoints", {}),
        "total_requests": summary.get("total_requests", 0),
        "total_errors": summary.get("total_errors", 0),
        "overall_error_rate": summary.get("overall_error_rate", 0),
        "requests_per_second": summary.get("requests_per_second", 0)
    }


@app.get("/metrics/models")
def get_model_metrics():
    """Get detailed metrics for AI model inference"""
    metrics = get_metrics_collector()
    summary = metrics.get_summary()
    return {
        "models": summary.get("models", {}),
        "timestamp": summary.get("timestamp")
    }


@app.get("/metrics/system")
def get_system_metrics():
    """Get system resource metrics (CPU, Memory, GPU)"""
    metrics = get_metrics_collector()
    return {
        "system": metrics.get_system_metrics(),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/metrics/reset")
def reset_metrics():
    """Reset all collected metrics (admin endpoint)"""
    metrics = get_metrics_collector()
    metrics.reset_metrics()
    return {
        "status": "success",
        "message": "All metrics have been reset",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
