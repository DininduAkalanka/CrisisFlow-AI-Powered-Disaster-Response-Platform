"""Pydantic schemas for API request/response validation"""
from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class IncidentStatusEnum(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    RESOLVED = "resolved"


class IncidentTypeEnum(str, Enum):
    FIRE = "fire"
    FLOOD = "flood"
    ROAD_BLOCK = "road_block"
    BUILDING_DAMAGE = "building_damage"
    MEDICAL = "medical"
    RESOURCE_SHORTAGE = "resource_shortage"
    OTHER = "other"


class UrgencyLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentCreate(BaseModel):
    """Schema for creating a new incident"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    incident_type: IncidentTypeEnum
    reporter_name: Optional[str] = Field(None, max_length=100)
    reporter_contact: Optional[str] = Field(None, max_length=100)
    
    @validator('description')
    def description_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Description cannot be empty')
        return v


class IncidentUpdate(BaseModel):
    """Schema for updating an incident"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = None
    incident_type: Optional[IncidentTypeEnum] = None
    urgency_level: Optional[UrgencyLevelEnum] = None
    status: Optional[IncidentStatusEnum] = None


class AIAnalysisResult(BaseModel):
    """Schema for AI analysis results"""
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    detected_type: Optional[IncidentTypeEnum] = None
    severity_score: float = Field(..., ge=0.0, le=1.0)
    extracted_entities: Dict[str, Any] = {}
    resources_needed: List[str] = []
    is_suspicious: bool = False
    analysis_notes: str = ""


class IncidentResponse(BaseModel):
    """Schema for incident response"""
    id: int
    latitude: float
    longitude: float
    address: Optional[str] = None
    title: str
    description: str
    incident_type: IncidentTypeEnum
    urgency_level: UrgencyLevelEnum
    status: IncidentStatusEnum
    ai_confidence_score: Optional[float] = None
    ai_detected_type: Optional[IncidentTypeEnum] = None
    ai_severity_score: Optional[float] = None
    image_url: Optional[str] = None
    cluster_id: Optional[int] = None
    is_duplicate: bool = False
    reporter_name: Optional[str] = None
    resources_needed: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    view_count: int = 0
    
    @model_validator(mode='before')
    @classmethod
    def exclude_geometry_fields(cls, data: Any) -> Any:
        """Remove geometry fields that can't be serialized"""
        if hasattr(data, '__dict__'):
            # It's an ORM object, convert to dict and exclude geometry
            obj_dict = {k: v for k, v in data.__dict__.items() if k != 'location' and not k.startswith('_')}
            return obj_dict
        elif isinstance(data, dict):
            # Already a dict, just remove geometry
            return {k: v for k, v in data.items() if k != 'location'}
        return data
    
    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    """Schema for paginated incident list"""
    total: int
    page: int
    page_size: int
    incidents: List[IncidentResponse]


class ClusterResponse(BaseModel):
    """Schema for incident cluster"""
    id: int
    center_latitude: float
    center_longitude: float
    incident_count: int
    cluster_type: Optional[IncidentTypeEnum] = None
    average_urgency: Optional[float] = None
    first_report_at: datetime
    last_report_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    """Schema for dashboard statistics"""
    total_incidents: int
    pending_incidents: int
    verified_incidents: int
    resolved_incidents: int
    critical_incidents: int
    active_clusters: int
    incidents_last_24h: int
    most_common_type: Optional[str] = None


class UserCreate(BaseModel):
    """Schema for creating a user"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    organization: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_responder: bool
    is_admin: bool
    organization: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str = "bearer"


class LocationQuery(BaseModel):
    """Schema for location-based queries"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(5.0, gt=0, le=50)
    incident_type: Optional[IncidentTypeEnum] = None
    min_urgency: Optional[UrgencyLevelEnum] = None
