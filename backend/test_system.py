"""
Test script to verify CrisisFlow installation and functionality
"""
import requests
import json
import sys
from datetime import datetime


BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"


def print_status(test_name, success, message=""):
    """Print test result with formatting"""
    status = "PASS" if success else "FAIL"
    color = "\033[92m" if success else "\033[91m"
    reset = "\033[0m"
    print(f"{color}{status}{reset} {test_name}")
    if message:
        print(f"  {message}")


def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        success = response.status_code == 200
        print_status("Backend Health Check", success)
        return success
    except Exception as e:
        print_status("Backend Health Check", False, str(e))
        return False


def test_api_docs():
    """Test if API docs are accessible"""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        success = response.status_code == 200
        print_status("API Documentation Access", success)
        return success
    except Exception as e:
        print_status("API Documentation Access", False, str(e))
        return False


def test_dashboard_stats():
    """Test dashboard statistics endpoint"""
    try:
        response = requests.get(f"{API_URL}/dashboard/stats", timeout=5)
        success = response.status_code == 200
        if success:
            data = response.json()
            print_status("Dashboard Stats", True, 
                        f"Total incidents: {data.get('total_incidents', 0)}")
        else:
            print_status("Dashboard Stats", False, f"Status: {response.status_code}")
        return success
    except Exception as e:
        print_status("Dashboard Stats", False, str(e))
        return False


def test_incident_list():
    """Test incident listing endpoint"""
    try:
        response = requests.get(f"{API_URL}/incidents/", timeout=5)
        success = response.status_code == 200
        if success:
            data = response.json()
            print_status("Incident List", True, 
                        f"Found {data.get('total', 0)} incidents")
        else:
            print_status("Incident List", False, f"Status: {response.status_code}")
        return success
    except Exception as e:
        print_status("Incident List", False, str(e))
        return False


def test_ai_models_status():
    """Test AI models status"""
    try:
        response = requests.get(f"{API_URL}/ai/models/status", timeout=5)
        success = response.status_code == 200
        if success:
            data = response.json()
            img_loaded = data.get('image_verification', {}).get('loaded', False)
            nlp_loaded = data.get('nlp_parser', {}).get('spacy_loaded', False)
            print_status("AI Models Status", True, 
                        f"Image: {img_loaded}, NLP: {nlp_loaded}")
        else:
            print_status("AI Models Status", False, f"Status: {response.status_code}")
        return success
    except Exception as e:
        print_status("AI Models Status", False, str(e))
        return False


def test_create_sample_incident():
    """Test creating a sample incident"""
    try:
        # Sample incident data
        data = {
            'latitude': 37.7749,
            'longitude': -122.4194,
            'title': 'Test Incident - Automated Test',
            'description': 'This is a test incident created by the automated test script. Need emergency medical assistance.',
            'incident_type': 'medical',
            'reporter_name': 'Test Script',
            'reporter_contact': 'test@example.com'
        }
        
        response = requests.post(f"{API_URL}/incidents/", data=data, timeout=10)
        success = response.status_code == 200
        
        if success:
            incident_data = response.json()
            incident_id = incident_data.get('id')
            print_status("Create Sample Incident", True, 
                        f"Created incident #{incident_id}")
            return True, incident_id
        else:
            print_status("Create Sample Incident", False, 
                        f"Status: {response.status_code}")
            return False, None
            
    except Exception as e:
        print_status("Create Sample Incident", False, str(e))
        return False, None


def test_nlp_analysis():
    """Test NLP text analysis"""
    try:
        text = "Emergency! Building on fire at 5th street. Need fire trucks and ambulance immediately. Multiple people trapped inside."
        
        response = requests.post(
            f"{API_URL}/ai/analyze-text",
            params={'text': text},
            timeout=10
        )
        
        success = response.status_code == 200
        if success:
            data = response.json()
            analysis = data.get('analysis', {})
            urgency = analysis.get('urgency_level', 'unknown')
            resources = analysis.get('resources_needed', [])
            print_status("NLP Text Analysis", True, 
                        f"Urgency: {urgency}, Resources: {', '.join(resources[:3])}")
        else:
            print_status("NLP Text Analysis", False, f"Status: {response.status_code}")
        return success
    except Exception as e:
        print_status("NLP Text Analysis", False, str(e))
        return False


def test_clustering():
    """Test incident clustering"""
    try:
        response = requests.get(f"{API_URL}/dashboard/clusters", timeout=10)
        success = response.status_code == 200
        if success:
            data = response.json()
            cluster_count = data.get('total_clusters', 0)
            print_status("Incident Clustering", True, 
                        f"{cluster_count} active clusters")
        else:
            print_status("Incident Clustering", False, f"Status: {response.status_code}")
        return success
    except Exception as e:
        print_status("Incident Clustering", False, str(e))
        return False


def run_all_tests():
    """Run all tests"""
    print("="*60)
    print("CrisisFlow System Test Suite")
    print("="*60)
    print()
    
    tests_passed = 0
    tests_total = 0
    
    # Core functionality tests
    print("Core Functionality Tests")
    print("-"*60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("API Documentation", test_api_docs),
        ("Dashboard Stats", test_dashboard_stats),
        ("Incident List", test_incident_list),
        ("AI Models Status", test_ai_models_status),
    ]
    
    for name, test_func in tests:
        tests_total += 1
        if test_func():
            tests_passed += 1
    
    print()
    
    # AI functionality tests
    print("AI Functionality Tests")
    print("-"*60)
    
    ai_tests = [
        ("NLP Analysis", test_nlp_analysis),
        ("Incident Clustering", test_clustering),
    ]
    
    for name, test_func in ai_tests:
        tests_total += 1
        if test_func():
            tests_passed += 1
    
    print()
    
    # Integration tests
    print("Integration Tests")
    print("-"*60)
    
    tests_total += 1
    success, incident_id = test_create_sample_incident()
    if success:
        tests_passed += 1
    
    print()
    print("="*60)
    print(f"Test Results: {tests_passed}/{tests_total} passed")
    print("="*60)
    
    if tests_passed == tests_total:
        print("\nAll tests passed! CrisisFlow is working correctly.")
        return 0
    else:
        print(f"\n{tests_total - tests_passed} test(s) failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("  1. Ensure backend is running: uvicorn app.main:app --reload")
        print("  2. Check database connection in .env file")
        print("  3. Verify PostgreSQL with PostGIS is running")
        print("  4. Install required packages: pip install -r requirements.txt")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
