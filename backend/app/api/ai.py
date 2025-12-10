"""AI analysis endpoints"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict
import os
import shutil
from datetime import datetime

from app.ai.image_verification import get_vision_service
from app.ai.nlp_parser import get_nlp_service
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...), db: Session = Depends(get_db)) -> Dict:
    """
    Analyze an uploaded disaster image using Vision Agent (EfficientNetV2 + CLIP)
    Returns multi-label classification, CLIP embeddings, and duplicate detection
    """
    # Validate file type
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save temporary file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"temp_{timestamp}_{image.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Analyze image with SOTA Vision Agent
        vision_service = get_vision_service()
        analysis_result = await vision_service.analyze_image(filepath, db)
        
        return {
            "success": True,
            "analysis": analysis_result,
            "filename": filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass


@router.post("/analyze-text")
def analyze_text(text: str) -> Dict:
    """
    Analyze incident report text using GLiNER (Zero-shot NER)
    Returns extracted entities: Location, Urgency, Resources, Person Count, Contact Info
    Supports Singlish and fragmented text
    """
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text must be at least 10 characters")
    
    try:
        nlp_service = get_nlp_service()
        analysis_result = nlp_service.parse_sos(text)
        
        return {
            "success": True,
            "analysis": analysis_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")


@router.get("/models/status")
def get_models_status() -> Dict:
    """Get status of loaded SOTA AI models"""
    
    vision_service = get_vision_service()
    nlp_service = get_nlp_service()
    
    return {
        "vision_agent": {
            "efficientnet_loaded": vision_service.efficientnet_model is not None,
            "clip_loaded": vision_service.clip_model is not None,
            "model_type": "EfficientNetV2-Small + CLIP ViT-B/32",
            "device": str(vision_service.device),
            "embedding_dim": 512
        },
        "nlp_parser": {
            "gliner_loaded": nlp_service.gliner_model is not None,
            "model_type": "GLiNER-base (Zero-shot NER)",
            "supported_entities": ["Location", "Urgency", "Resource_Needed", "Person_Count", "Contact_Info"]
        }
    }


@router.post("/models/load")
def load_models() -> Dict:
    """Pre-load all SOTA AI models (EfficientNetV2, CLIP, GLiNER)"""
    
    try:
        vision_service = get_vision_service()
        vision_service.load_models()
        
        nlp_service = get_nlp_service()
        nlp_service.load_model()
        
        return {
            "success": True,
            "message": "All SOTA models loaded successfully",
            "models": {
                "vision": "EfficientNetV2-Small + CLIP ViT-B/32",
                "nlp": "GLiNER-base"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading models: {str(e)}")
