"""
Production-Grade Monitoring System
Tracks API performance, model inference metrics, and system health
"""
import time
import psutil
import torch
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict, deque
from functools import wraps
import asyncio
from contextlib import asynccontextmanager


class MetricsCollector:
    """
    Lightweight metrics collector for tracking system performance
    
    Features:
    - API endpoint latency tracking (P50, P95, P99)
    - Model inference time monitoring
    - Error rate tracking
    - System resource monitoring (CPU, Memory, GPU)
    - Request throughput measurement
    """
    
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        
        # Latency tracking (rolling window)
        self.endpoint_latencies = defaultdict(lambda: deque(maxlen=window_size))
        self.model_inference_times = defaultdict(lambda: deque(maxlen=window_size))
        
        # Counters
        self.request_counts = defaultdict(int)
        self.error_counts = defaultdict(int)
        self.model_call_counts = defaultdict(int)
        
        # Timestamps
        self.start_time = datetime.now()
        self.last_reset = datetime.now()
        
        # System metrics cache (updated every 5 seconds)
        self._system_metrics_cache = {}
        self._last_system_check = 0
        
    def record_request(self, endpoint: str, latency_ms: float, status_code: int):
        """Record API request metrics"""
        self.endpoint_latencies[endpoint].append(latency_ms)
        self.request_counts[endpoint] += 1
        
        if status_code >= 400:
            self.error_counts[endpoint] += 1
    
    def record_model_inference(self, model_name: str, inference_time_ms: float):
        """Record model inference time"""
        self.model_inference_times[model_name].append(inference_time_ms)
        self.model_call_counts[model_name] += 1
    
    def get_endpoint_stats(self, endpoint: str) -> Dict:
        """Get statistics for a specific endpoint"""
        latencies = list(self.endpoint_latencies[endpoint])
        
        if not latencies:
            return {
                "endpoint": endpoint,
                "total_requests": 0,
                "error_count": 0,
                "error_rate": 0.0,
                "latency_p50": 0,
                "latency_p95": 0,
                "latency_p99": 0,
                "avg_latency": 0
            }
        
        sorted_latencies = sorted(latencies)
        count = len(sorted_latencies)
        
        return {
            "endpoint": endpoint,
            "total_requests": self.request_counts[endpoint],
            "error_count": self.error_counts[endpoint],
            "error_rate": self.error_counts[endpoint] / self.request_counts[endpoint] if self.request_counts[endpoint] > 0 else 0,
            "latency_p50": sorted_latencies[int(count * 0.5)] if count > 0 else 0,
            "latency_p95": sorted_latencies[int(count * 0.95)] if count > 0 else 0,
            "latency_p99": sorted_latencies[int(count * 0.99)] if count > 0 else 0,
            "avg_latency": sum(latencies) / count if count > 0 else 0
        }
    
    def get_model_stats(self, model_name: str) -> Dict:
        """Get statistics for a specific model"""
        inference_times = list(self.model_inference_times[model_name])
        
        if not inference_times:
            return {
                "model": model_name,
                "total_calls": 0,
                "avg_inference_ms": 0,
                "p95_inference_ms": 0,
                "p99_inference_ms": 0
            }
        
        sorted_times = sorted(inference_times)
        count = len(sorted_times)
        
        return {
            "model": model_name,
            "total_calls": self.model_call_counts[model_name],
            "avg_inference_ms": sum(inference_times) / count,
            "p95_inference_ms": sorted_times[int(count * 0.95)] if count > 0 else 0,
            "p99_inference_ms": sorted_times[int(count * 0.99)] if count > 0 else 0
        }
    
    def get_system_metrics(self) -> Dict:
        """Get current system resource metrics (cached for 5 seconds)"""
        current_time = time.time()
        
        # Use cache if recent
        if current_time - self._last_system_check < 5:
            return self._system_metrics_cache
        
        # Collect fresh metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            "cpu_percent": cpu_percent,
            "memory_total_gb": memory.total / (1024**3),
            "memory_used_gb": memory.used / (1024**3),
            "memory_percent": memory.percent,
            "disk_total_gb": disk.total / (1024**3),
            "disk_used_gb": disk.used / (1024**3),
            "disk_percent": disk.percent
        }
        
        # Add GPU metrics if available
        if torch.cuda.is_available():
            try:
                metrics["gpu_available"] = True
                metrics["gpu_memory_allocated_gb"] = torch.cuda.memory_allocated() / (1024**3)
                metrics["gpu_memory_reserved_gb"] = torch.cuda.memory_reserved() / (1024**3)
                metrics["gpu_name"] = torch.cuda.get_device_name(0)
            except Exception as e:
                metrics["gpu_error"] = str(e)
        else:
            metrics["gpu_available"] = False
        
        self._system_metrics_cache = metrics
        self._last_system_check = current_time
        
        return metrics
    
    def get_summary(self) -> Dict:
        """Get comprehensive monitoring summary"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        
        # Aggregate endpoint stats
        all_endpoints = {}
        for endpoint in self.endpoint_latencies.keys():
            all_endpoints[endpoint] = self.get_endpoint_stats(endpoint)
        
        # Aggregate model stats
        all_models = {}
        for model_name in self.model_inference_times.keys():
            all_models[model_name] = self.get_model_stats(model_name)
        
        # Total requests and errors
        total_requests = sum(self.request_counts.values())
        total_errors = sum(self.error_counts.values())
        
        return {
            "uptime_seconds": uptime,
            "uptime_formatted": self._format_uptime(uptime),
            "total_requests": total_requests,
            "total_errors": total_errors,
            "overall_error_rate": total_errors / total_requests if total_requests > 0 else 0,
            "requests_per_second": total_requests / uptime if uptime > 0 else 0,
            "endpoints": all_endpoints,
            "models": all_models,
            "system": self.get_system_metrics(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _format_uptime(self, seconds: float) -> str:
        """Format uptime in human-readable format"""
        days = int(seconds // 86400)
        hours = int((seconds % 86400) // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m {secs}s"
        else:
            return f"{minutes}m {secs}s"
    
    def reset_metrics(self):
        """Reset all metrics (useful for testing)"""
        self.endpoint_latencies.clear()
        self.model_inference_times.clear()
        self.request_counts.clear()
        self.error_counts.clear()
        self.model_call_counts.clear()
        self.last_reset = datetime.now()


# Global metrics collector instance
_metrics_collector = None


def get_metrics_collector() -> MetricsCollector:
    """Get singleton metrics collector instance"""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector


def monitor_endpoint(endpoint_name: str):
    """Decorator to monitor endpoint performance"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            status_code = 200
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = 500
                raise
            finally:
                latency_ms = (time.time() - start_time) * 1000
                metrics = get_metrics_collector()
                metrics.record_request(endpoint_name, latency_ms, status_code)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            status_code = 200
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = 500
                raise
            finally:
                latency_ms = (time.time() - start_time) * 1000
                metrics = get_metrics_collector()
                metrics.record_request(endpoint_name, latency_ms, status_code)
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def monitor_model_inference(model_name: str):
    """Decorator to monitor model inference time"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                inference_time_ms = (time.time() - start_time) * 1000
                metrics = get_metrics_collector()
                metrics.record_model_inference(model_name, inference_time_ms)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                inference_time_ms = (time.time() - start_time) * 1000
                metrics = get_metrics_collector()
                metrics.record_model_inference(model_name, inference_time_ms)
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


@asynccontextmanager
async def track_operation(operation_name: str):
    """Context manager for tracking arbitrary operations"""
    start_time = time.time()
    try:
        yield
    finally:
        duration_ms = (time.time() - start_time) * 1000
        print(f"[MONITOR] {operation_name} completed in {duration_ms:.2f}ms")
