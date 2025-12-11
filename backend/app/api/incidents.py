"""Incident management endpoints"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
import json
from datetime import datetime, timedelta
import os
import shutil

from app.core.database import get_db
from app.models.incident import Incident, IncidentStatus, IncidentType, UrgencyLevel
from app.schemas.schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    IncidentListResponse, AIAnalysisResult
)
from app.ai.image_verification import get_vision_service
from app.ai.nlp_parser import get_nlp_service
from app.ai.clustering import get_clustering_service
from app.core.config import settings
from geoalchemy2.functions import ST_DWithin, ST_SetSRID, ST_MakePoint
from geoalchemy2.shape import to_shape

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("/", response_model=IncidentResponse)
async def create_incident(
    latitude: float = Form(...),
    longitude: float = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    incident_type: str = Form(...),
    reporter_name: Optional[str] = Form(None),
    reporter_contact: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Create a new incident report
    Supports multipart/form-data for image upload
    """
    # Validate incident type
    try:
        incident_type_enum = IncidentType(incident_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid incident type")
    
    # Create incident object
    incident = Incident(
        latitude=latitude,
        longitude=longitude,
        # location field removed (PostGIS disabled)
        title=title,
        description=description,
        incident_type=incident_type_enum,
        reporter_name=reporter_name,
        reporter_contact=reporter_contact,
        status=IncidentStatus.PENDING
    )
    
    # Analyze text with NLP (GLiNER-based parsing)
    nlp_service = get_nlp_service()
    text_analysis = nlp_service.parse_sos(f"{title}. {description}")
    
    # Set AI-detected urgency
    urgency_map = {
        "critical": UrgencyLevel.CRITICAL,
        "high": UrgencyLevel.HIGH,
        "medium": UrgencyLevel.MEDIUM,
        "low": UrgencyLevel.LOW
    }
    incident.urgency_level = urgency_map.get(text_analysis["urgency_level"], UrgencyLevel.MEDIUM)
    
    # Extract entities from parsed result
    entities_dict = {
        "location": text_analysis.get("location", []),
        "person_count": text_analysis.get("person_count", []),
        "contact_info": text_analysis.get("contact_info", [])
    }
    incident.ai_extracted_entities = json.dumps(entities_dict)
    incident.resources_needed = json.dumps(text_analysis.get("resource_needed", []))
    
    # Set confidence score (default if not present)
    incident.ai_confidence_score = text_analysis.get("confidence_score", 0.7)
    
    # Handle image upload if provided
    if image:
        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{image.filename}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        incident.image_url = f"/uploads/{filename}"
        
        # Analyze image (Vision Agent: EfficientNetV2 + CLIP)
        vision_service = get_vision_service()
        image_analysis = await vision_service.analyze_image(filepath, db)
        
        # Store CLIP embedding (for semantic duplicate detection)
        if image_analysis.get("embedding") is not None:
            embedding = image_analysis["embedding"]
            # Verify embedding dimension matches database schema (512 for CLIP ViT-B/32)
            if len(embedding) == 512:
                incident.clip_embedding = embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
            else:
                print(f"⚠️  Warning: CLIP embedding has {len(embedding)} dimensions, expected 512. Skipping embedding storage.")
                incident.clip_embedding = None
        
        # Check if image is disaster-related
        classification = image_analysis.get("classification", {})
        if classification.get("is_disaster"):
            # Calculate severity from detected classes
            detected_classes = classification.get("detected_classes", [])
            if detected_classes:
                avg_confidence = sum(c["confidence"] for c in detected_classes) / len(detected_classes)
                incident.ai_severity_score = avg_confidence
                incident.ai_confidence_score = (incident.ai_confidence_score + avg_confidence) / 2
        
        # Check for duplicate images
        duplicate_check = image_analysis.get("duplicate_detection", {})
        if duplicate_check.get("is_duplicate"):
            incident.is_duplicate = True
            match = duplicate_check.get("match")
            if match:
                incident.parent_incident_id = match["incident_id"]
    
    # Save to database
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    return incident


@router.get("/", response_model=IncidentListResponse)
def list_incidents(
    page: int = 1,
    page_size: int = 50,
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    urgency: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    List incidents with optional filters
    Supports pagination and geospatial queries
    """
    query = db.query(Incident)
    
    # Apply filters
    if status:
        try:
            status_enum = IncidentStatus(status)
            query = query.filter(Incident.status == status_enum)
        except ValueError:
            pass
    
    if incident_type:
        try:
            type_enum = IncidentType(incident_type)
            query = query.filter(Incident.incident_type == type_enum)
        except ValueError:
            pass
    
    if urgency:
        try:
            urgency_enum = UrgencyLevel(urgency)
            query = query.filter(Incident.urgency_level == urgency_enum)
        except ValueError:
            pass
    
    # Geospatial filter (PostGIS disabled - could use simple distance calculation instead)
    # if latitude is not None and longitude is not None and radius_km is not None:
    #     # Convert radius from km to degrees (approximate)
    #     radius_degrees = radius_km / 111.0
    #     point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    #     query = query.filter(
    #         ST_DWithin(Incident.location, point, radius_degrees)
    #     )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    incidents = query.order_by(Incident.created_at.desc()).offset(offset).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "incidents": incidents
    }


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Get a specific incident by ID"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Increment view count
    incident.view_count += 1
    db.commit()
    
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    update_data: IncidentUpdate,
    db: Session = Depends(get_db)
):
    """Update an incident"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(incident, key, value)
    
    db.commit()
    db.refresh(incident)
    
    return incident


@router.post("/{incident_id}/verify")
def verify_incident(
    incident_id: int,
    verified: bool = True,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Verify or reject an incident"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = IncidentStatus.VERIFIED if verified else IncidentStatus.REJECTED
    incident.verification_notes = notes
    
    db.commit()
    
    return {"message": f"Incident {'verified' if verified else 'rejected'}", "incident_id": incident_id}


@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    """Delete an incident"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    db.delete(incident)
    db.commit()
    
    return {"message": "Incident deleted", "incident_id": incident_id}
