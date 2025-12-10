"""
Realistic Fake Detection Demo
Shows how AI handles common fake scenarios
"""
import asyncio
from app.ai.image_verification import get_vision_service
from app.core.database import SessionLocal
from PIL import Image, ImageDraw, ImageFont
import numpy as np


async def demo_scenarios():
    """Demonstrate various fake/real scenarios"""
    
    print("=" * 70)
    print("🔍 CRISIS FLOW - AI FAKE DETECTION DEMONSTRATION")
    print("=" * 70)
    
    scenarios = [
        {
            "name": "Laptop/Computer",
            "description": "User uploads laptop screen photo",
            "expected": "REJECTED (not a disaster)",
            "ai_detects": "'safe' environment",
            "confidence": "95%",
            "action": "Flag as suspicious"
        },
        {
            "name": "Selfie/Indoor Photo", 
            "description": "User uploads selfie claiming emergency",
            "expected": "REJECTED (not a disaster)",
            "ai_detects": "'safe' indoor scene",
            "confidence": "88%",
            "action": "Require manual verification"
        },
        {
            "name": "Food/Meal Photo",
            "description": "User uploads food photo by mistake",
            "expected": "REJECTED (not a disaster)",
            "ai_detects": "'safe' object",
            "confidence": "92%",
            "action": "Auto-reject"
        },
        {
            "name": "Real Flood Image",
            "description": "User uploads flooded street photo",
            "expected": "ACCEPTED ✅",
            "ai_detects": "'flood' + 'building_damage'",
            "confidence": "92% + 67%",
            "action": "Auto-verify, escalate to CRITICAL"
        },
        {
            "name": "Fire Incident",
            "description": "User uploads building fire photo",
            "expected": "ACCEPTED ✅",
            "ai_detects": "'fire' + 'building_damage'",
            "confidence": "89% + 72%",
            "action": "Immediate dispatch alert"
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'─' * 70}")
        print(f"SCENARIO {i}: {scenario['name']}")
        print(f"{'─' * 70}")
        print(f"📸 Image: {scenario['description']}")
        print(f"🤖 AI Detects: {scenario['ai_detects']}")
        print(f"📊 Confidence: {scenario['confidence']}")
        print(f"✅ Expected: {scenario['expected']}")
        print(f"⚡ Action: {scenario['action']}")
    
    print(f"\n{'=' * 70}")
    print("🧠 HOW THE AI DECISION WORKS")
    print(f"{'=' * 70}")
    print("""
1️⃣ EfficientNetV2 analyzes the image:
   - Checks for: flood, fire, building_damage, road_block, safe
   - Assigns confidence scores (0-100%)
   
2️⃣ Decision Logic (in code):
   ```python
   is_disaster = not any(c["label"] == "safe" for c in detected_classes)
   ```
   
   Translation:
   - If "safe" detected → is_disaster = FALSE → REJECT ❌
   - If "flood/fire/damage" detected → is_disaster = TRUE → ACCEPT ✅
   
3️⃣ Application Response:
   
   FAKE IMAGE DETECTED:
   ├─ Status: REJECTED
   ├─ AI Confidence: 0.02 (very low)
   ├─ Verification Notes: "AI detected non-disaster image"
   ├─ Dashboard: Shows in "Suspicious Reports" section
   └─ Requires: Manual admin review
   
   REAL DISASTER DETECTED:
   ├─ Status: VERIFIED
   ├─ AI Confidence: 0.92 (high)
   ├─ Urgency: AUTO-ESCALATED to CRITICAL
   ├─ Dashboard: Shows in "Active Incidents" with red marker
   └─ Action: Responders notified immediately
    """)
    
    print(f"{'=' * 70}")
    print("📱 USER EXPERIENCE")
    print(f"{'=' * 70}")
    print("""
UPLOADING FAKE IMAGE:
User: "Reports flood, uploads laptop photo"
     ↓
AI Analysis: 0.5 seconds
     ↓
Result: "Your image doesn't show a disaster. Please upload a photo
        of the actual incident or your report will be reviewed by
        an administrator."
     ↓
Dashboard: Report marked as "Pending Review" (yellow flag)

UPLOADING REAL DISASTER:
User: "Reports flood, uploads flooded street photo"
     ↓
AI Analysis: 0.8 seconds
     ↓
Result: "Incident verified! Emergency responders have been notified.
        Detected: Flood (92% confidence), Building Damage (67%)
        Your location has been added to active disaster zone #4."
     ↓
Dashboard: Incident marked as "Critical" (red marker on map)
    """)
    
    print(f"{'=' * 70}")
    print("💾 DATABASE STORAGE")
    print(f"{'=' * 70}")
    print("""
FAKE REPORT (Laptop Image):
incidents table:
├─ status: 'rejected'
├─ ai_confidence_score: 0.05
├─ ai_severity_score: 0.02
├─ verification_notes: 'AI detected non-disaster image (safe: 95%)'
└─ requires_manual_review: TRUE

REAL REPORT (Flood Image):
incidents table:
├─ status: 'verified'
├─ ai_confidence_score: 0.92
├─ ai_severity_score: 0.92
├─ ai_detected_type: 'flood'
├─ urgency_level: 'critical'
├─ cluster_id: 4 (grouped with nearby floods)
└─ clip_embedding: [512-dim vector for duplicate detection]
    """)
    
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    asyncio.run(demo_scenarios())
