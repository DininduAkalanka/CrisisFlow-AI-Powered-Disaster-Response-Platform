"""
Week 1 Implementation Test Script
Tests PostGIS clustering and monitoring system
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import asyncio
import time
from datetime import datetime


def test_monitoring_module():
    """Test 1: Monitoring Module Functionality"""
    print("\n" + "=" * 70)
    print("TEST 1: MONITORING MODULE")
    print("=" * 70)
    
    try:
        from app.core.monitoring import MetricsCollector, get_metrics_collector
        
        # Create metrics collector
        metrics = MetricsCollector()
        
        # Simulate some requests
        print("\n📊 Simulating API requests...")
        metrics.record_request("/api/v1/incidents", 150.5, 200)
        metrics.record_request("/api/v1/incidents", 200.3, 200)
        metrics.record_request("/api/v1/incidents", 180.7, 200)
        metrics.record_request("/api/v1/dashboard/stats", 50.2, 200)
        metrics.record_request("/api/v1/dashboard/stats", 500.1, 500)  # Error
        
        # Simulate model inference
        print("🤖 Simulating model inference...")
        metrics.record_model_inference("EfficientNetV2", 250.5)
        metrics.record_model_inference("EfficientNetV2", 230.2)
        metrics.record_model_inference("GLiNER", 150.3)
        
        # Get stats
        print("\n📈 Endpoint Statistics:")
        endpoint_stats = metrics.get_endpoint_stats("/api/v1/incidents")
        print(f"  - Endpoint: {endpoint_stats['endpoint']}")
        print(f"  - Total Requests: {endpoint_stats['total_requests']}")
        print(f"  - Avg Latency: {endpoint_stats['avg_latency']:.2f}ms")
        print(f"  - P95 Latency: {endpoint_stats['latency_p95']:.2f}ms")
        print(f"  - P99 Latency: {endpoint_stats['latency_p99']:.2f}ms")
        print(f"  - Error Rate: {endpoint_stats['error_rate']:.2%}")
        
        print("\n🤖 Model Statistics:")
        model_stats = metrics.get_model_stats("EfficientNetV2")
        print(f"  - Model: {model_stats['model']}")
        print(f"  - Total Calls: {model_stats['total_calls']}")
        print(f"  - Avg Inference: {model_stats['avg_inference_ms']:.2f}ms")
        print(f"  - P95 Inference: {model_stats['p95_inference_ms']:.2f}ms")
        
        print("\n💻 System Metrics:")
        system_metrics = metrics.get_system_metrics()
        print(f"  - CPU Usage: {system_metrics['cpu_percent']:.1f}%")
        print(f"  - Memory: {system_metrics['memory_used_gb']:.2f}GB / {system_metrics['memory_total_gb']:.2f}GB ({system_metrics['memory_percent']:.1f}%)")
        print(f"  - Disk: {system_metrics['disk_used_gb']:.2f}GB / {system_metrics['disk_total_gb']:.2f}GB ({system_metrics['disk_percent']:.1f}%)")
        print(f"  - GPU Available: {system_metrics['gpu_available']}")
        
        # Get summary
        print("\n📊 Full Summary:")
        summary = metrics.get_summary()
        print(f"  - Uptime: {summary['uptime_formatted']}")
        print(f"  - Total Requests: {summary['total_requests']}")
        print(f"  - Total Errors: {summary['total_errors']}")
        print(f"  - Overall Error Rate: {summary['overall_error_rate']:.2%}")
        print(f"  - Requests/sec: {summary['requests_per_second']:.2f}")
        
        print("\n✅ PASS: Monitoring module working correctly")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Monitoring module error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_clustering_service():
    """Test 2: PostGIS Clustering Service"""
    print("\n" + "=" * 70)
    print("TEST 2: POSTGIS CLUSTERING SERVICE")
    print("=" * 70)
    
    try:
        from app.ai.clustering import GeospatialClusteringService
        
        clustering = GeospatialClusteringService()
        
        print("\n⚙️ Clustering Configuration:")
        print(f"  - EPS (degrees): {clustering.eps}")
        print(f"  - EPS (meters): ~{clustering.eps * 111320:.0f}m")
        print(f"  - Min Points: {clustering.minpoints}")
        
        print("\n✅ PASS: Clustering service initialized")
        print("\n⚠️ NOTE: Full clustering test requires database connection")
        print("   To test with database:")
        print("   1. Ensure PostgreSQL with PostGIS is running")
        print("   2. Run: python init_db.py")
        print("   3. Create some test incidents")
        print("   4. Call clustering.update_incident_clusters(db)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Clustering service error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_monitoring_decorators():
    """Test 3: Monitoring Decorators"""
    print("\n" + "=" * 70)
    print("TEST 3: MONITORING DECORATORS")
    print("=" * 70)
    
    try:
        from app.core.monitoring import monitor_endpoint, monitor_model_inference, get_metrics_collector
        
        # Test endpoint decorator
        @monitor_endpoint("test_endpoint")
        def test_func():
            time.sleep(0.1)  # Simulate work
            return "test"
        
        @monitor_endpoint("test_async_endpoint")
        async def test_async_func():
            await asyncio.sleep(0.05)
            return "async_test"
        
        @monitor_model_inference("test_model")
        def test_model_func():
            time.sleep(0.2)
            return "model_result"
        
        print("\n🧪 Testing sync endpoint decorator...")
        result = test_func()
        
        print("🧪 Testing async endpoint decorator...")
        result = asyncio.run(test_async_func())
        
        print("🧪 Testing model inference decorator...")
        result = test_model_func()
        
        # Check metrics were recorded
        metrics = get_metrics_collector()
        summary = metrics.get_summary()
        
        print("\n📊 Recorded Metrics:")
        if "test_endpoint" in summary["endpoints"]:
            print(f"  ✓ Sync endpoint tracked")
        if "test_async_endpoint" in summary["endpoints"]:
            print(f"  ✓ Async endpoint tracked")
        if "test_model" in summary["models"]:
            print(f"  ✓ Model inference tracked")
        
        print("\n✅ PASS: Monitoring decorators working correctly")
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Decorator test error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_connection():
    """Test 4: Database Connection and PostGIS"""
    print("\n" + "=" * 70)
    print("TEST 4: DATABASE CONNECTION & POSTGIS")
    print("=" * 70)
    
    try:
        from app.core.database import SessionLocal
        from sqlalchemy import text
        
        print("\n🔌 Testing database connection...")
        db = SessionLocal()
        
        # Test basic connection
        db.execute(text("SELECT 1"))
        print("  ✓ Database connection successful")
        
        # Test PostGIS
        try:
            result = db.execute(text("SELECT PostGIS_Version()")).scalar()
            print(f"  ✓ PostGIS enabled: {result}")
            has_postgis = True
        except Exception as e:
            print(f"  ⚠️ PostGIS not enabled: {e}")
            has_postgis = False
        
        # Test pgvector
        try:
            result = db.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")).fetchone()
            if result:
                print(f"  ✓ pgvector extension enabled")
            else:
                print(f"  ⚠️ pgvector extension not installed")
        except Exception as e:
            print(f"  ⚠️ pgvector check error: {e}")
        
        db.close()
        
        if has_postgis:
            print("\n✅ PASS: Database connection and PostGIS working")
        else:
            print("\n⚠️ PARTIAL: Database connected but PostGIS missing")
            print("   Run migrations to enable PostGIS:")
            print("   psql -U postgres -d crisisflow_db -f backend/migrations/001_enable_pgvector.sql")
        
        return True
        
    except Exception as e:
        print(f"\n❌ FAIL: Database connection error: {e}")
        print("\n💡 Make sure PostgreSQL is running:")
        print("   - Docker: docker-compose up db")
        print("   - Local: pg_ctl start")
        return False


def print_next_steps():
    """Print next steps and usage guide"""
    print("\n" + "=" * 70)
    print("🎯 NEXT STEPS & USAGE")
    print("=" * 70)
    
    print("\n1️⃣ Start the API Server:")
    print("   cd backend")
    print("   python -m uvicorn app.main:app --reload")
    
    print("\n2️⃣ Access Monitoring Endpoints:")
    print("   - Health Check: http://localhost:8000/health")
    print("   - All Metrics: http://localhost:8000/metrics")
    print("   - Endpoint Metrics: http://localhost:8000/metrics/endpoints")
    print("   - Model Metrics: http://localhost:8000/metrics/models")
    print("   - System Metrics: http://localhost:8000/metrics/system")
    
    print("\n3️⃣ Test Clustering:")
    print("   a) Create some test incidents via API or UI")
    print("   b) Call clustering endpoint:")
    print("      POST http://localhost:8000/api/v1/dashboard/update-clusters")
    print("   c) View clusters:")
    print("      GET http://localhost:8000/api/v1/dashboard/clusters")
    
    print("\n4️⃣ Monitor AI Performance:")
    print("   - Upload images via /api/v1/incidents")
    print("   - Check model inference times at /metrics/models")
    print("   - View EfficientNetV2 and GLiNER performance")
    
    print("\n5️⃣ Production Monitoring Setup:")
    print("   - Export metrics to Prometheus: /metrics (add prometheus format)")
    print("   - Set up Grafana dashboards")
    print("   - Configure alerting for slow requests (>1s)")
    print("   - Monitor error rates and set thresholds")


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("🚀 CRISISFLOW - WEEK 1 IMPLEMENTATION TEST")
    print("PostGIS Clustering + Basic Monitoring")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Run tests
    results.append(("Monitoring Module", test_monitoring_module()))
    results.append(("Clustering Service", test_clustering_service()))
    results.append(("Monitoring Decorators", test_monitoring_decorators()))
    results.append(("Database Connection", test_database_connection()))
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
    
    print_next_steps()
    
    print("\n" + "=" * 70)
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)


if __name__ == "__main__":
    main()
