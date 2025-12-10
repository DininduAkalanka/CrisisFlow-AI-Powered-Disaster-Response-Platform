"""Database models for CrisisFlow"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.sql import func
# from geoalchemy2 import Geometry  # PostGIS optional - can be enabled later
from pgvector.sqlalchemy import Vector
from enum import Enum
from app.core.database import Base


class IncidentStatus(str, Enum):
    """Incident verification status"""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    RESOLVED = "resolved"


class IncidentType(str, Enum):
    """Types of incidents"""
    FIRE = "fire"
    FLOOD = "flood"
    ROAD_BLOCK = "road_block"
    BUILDING_DAMAGE = "building_damage"
    MEDICAL = "medical"
    RESOURCE_SHORTAGE = "resource_shortage"
    OTHER = "other"


class UrgencyLevel(str, Enum):
    """Urgency levels for incidents"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Incident(Base):
    """Incident report model"""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    
    # Location data (using latitude/longitude for now - PostGIS can be added later)
    # location = Column(Geometry('POINT', srid=4326), nullable=True)  # PostGIS geometry - disabled
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500))
    
    # Incident details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(SQLEnum(IncidentType), nullable=False)
    urgency_level = Column(SQLEnum(UrgencyLevel), default=UrgencyLevel.MEDIUM)
    
    # Verification status
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.PENDING)
    verified_by = Column(String(100))
    verification_notes = Column(Text)
    
    # AI Analysis results
    ai_confidence_score = Column(Float)  # 0.0 to 1.0
    ai_detected_type = Column(SQLEnum(IncidentType))
    ai_severity_score = Column(Float)  # 0.0 to 1.0
    ai_extracted_entities = Column(Text)  # JSON string of extracted entities
    
    # Media
    image_url = Column(String(500))
    image_hash = Column(String(100))  # For duplicate detection
    image_metadata = Column(Text)  # JSON string of EXIF data
    
    # SOTA AI Features (pgvector)
    clip_embedding = Column(Vector(512))  # CLIP ViT-B/32 embedding (512 dimensions)
    
    # Clustering (PostGIS ST_ClusterDBSCAN)
    cluster_id = Column(Integer, index=True)
    is_duplicate = Column(Boolean, default=False)
    parent_incident_id = Column(Integer)
    
    # Reporter information
    reporter_name = Column(String(100))
    reporter_contact = Column(String(100))
    reporter_ip = Column(String(50))
    
    # Resources needed (extracted by NLP)
    resources_needed = Column(Text)  # JSON array of resources
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    # View count for dashboard
    view_count = Column(Integer, default=0)


class User(Base):
    """User model for responders and administrators"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100))
    
    # Role
    is_responder = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Organization
    organization = Column(String(100))
    role_title = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))


class IncidentCluster(Base):
    """Clustered incidents for deduplication"""
    __tablename__ = "incident_clusters"

    id = Column(Integer, primary_key=True, index=True)
    
    # Cluster center location
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    # center_location = Column(Geometry('POINT', srid=4326))  # PostGIS - disabled
    
    # Cluster metadata
    incident_count = Column(Integer, default=0)
    cluster_type = Column(SQLEnum(IncidentType))
    average_urgency = Column(Float)
    
    # Time window
    first_report_at = Column(DateTime(timezone=True))
    last_report_at = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
