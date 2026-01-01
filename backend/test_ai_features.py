"""
Test script for SOTA AI features
Run this after models are downloaded
"""
import sys
sys.path.insert(0, 'C:/Users/dinin/OneDrive/Desktop/Crisis-Flow-Project/backend')

print("=" * 60)
print("CRISISFLOW SOTA AI - TEST SCRIPT")
print("=" * 60)

# Test 1: NLP Service (GLiNER)
print("\n[TEST 1] NLP Service (GLiNER)")
print("-" * 60)
try:
    from app.ai.nlp_parser import get_nlp_service
    import json
    
    nlp = get_nlp_service()
    test_message = "URGENT! 15 families trapped in Colombo 7. Need food and medicine. Call 0771234567"
    
    print(f"Input: {test_message}")
    result = nlp.parse_sos(test_message)
    
    print("\nExtracted Entities:")
    print(f"  Location: {result['entities']['location']}")
    print(f"  Person Count: {result['entities']['person_count']}")
    print(f"  Resources: {result['entities']['resource_needed']}")
    print(f"  Contact: {result['entities']['contact_info']}")
    print(f"  Urgency Level: {result['urgency_level']}")
    print("PASS: NLP Service")
except Exception as e:
    print(f"FAIL: NLP Service - {e}")

# Test 2: Clustering Service (PostGIS)
print("\n[TEST 2] Clustering Service (PostGIS)")
print("-" * 60)
try:
    from app.ai.clustering import get_clustering_service
    
    clustering = get_clustering_service()
    print(f"Clustering parameters: eps={clustering.eps}, minpoints={clustering.minpoints}")
    print("READY: Clustering Service (requires database connection to test)")
except Exception as e:
    print(f"FAIL: Clustering Service - {e}")

# Test 3: Vision Service (EfficientNetV2 + CLIP) 
print("\n[TEST 3] Vision Service (EfficientNetV2 + CLIP)")
print("-" * 60)
try:
    from app.ai.image_verification import get_vision_service
    
    print("Loading models (may take 1-2 minutes on first run)...")
    vision = get_vision_service()
    print("LOADED: Vision Service")
    print(f"  Device: {vision.device}")
    print(f"  Classes: {vision.class_labels}")
    print("  Note: Image analysis requires test image file")
except Exception as e:
    print(f"FAIL: Vision Service - {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
print("\nNext Steps:")
print("1. Start your PostgreSQL database")
print("2. Run: python init_db.py (to create tables)")
print("3. Run: python backend/app/main.py (to start API)")
print("4. Access API docs: http://localhost:8000/docs")
