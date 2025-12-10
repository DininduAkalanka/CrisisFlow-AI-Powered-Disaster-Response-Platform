"""Dashboard and analytics endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List

from app.core.database import get_db
from app.models.incident import Incident, IncidentStatus, IncidentType, UrgencyLevel
from app.schemas.schemas import DashboardStats, ClusterResponse
from app.ai.clustering import get_clustering_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    
    # Total incidents
    total = db.query(Incident).count()
    
    # By status
    pending = db.query(Incident).filter(Incident.status == IncidentStatus.PENDING).count()
    verified = db.query(Incident).filter(Incident.status == IncidentStatus.VERIFIED).count()
    resolved = db.query(Incident).filter(Incident.status == IncidentStatus.RESOLVED).count()
    
    # Critical incidents
    critical = db.query(Incident).filter(
        and_(
            Incident.urgency_level == UrgencyLevel.CRITICAL,
            Incident.status != IncidentStatus.RESOLVED
        )
    ).count()
    
    # Active clusters
    active_clusters = db.query(Incident.cluster_id).filter(
        Incident.cluster_id.isnot(None)
    ).distinct().count()
    
    # Last 24 hours
    yesterday = datetime.now() - timedelta(hours=24)
    incidents_24h = db.query(Incident).filter(Incident.created_at >= yesterday).count()
    
    # Most common type
    type_counts = db.query(
        Incident.incident_type,
        func.count(Incident.id).label('count')
    ).group_by(Incident.incident_type).order_by(func.count(Incident.id).desc()).first()
    
    most_common_type = type_counts[0].value if type_counts else None
    
    return {
        "total_incidents": total,
        "pending_incidents": pending,
        "verified_incidents": verified,
        "resolved_incidents": resolved,
        "critical_incidents": critical,
        "active_clusters": active_clusters,
        "incidents_last_24h": incidents_24h,
        "most_common_type": most_common_type
    }


@router.get("/clusters")
async def get_clusters(db: Session = Depends(get_db)):
    """Get incident clusters using PostGIS ST_ClusterDBSCAN"""
    
    try:
        # Run PostGIS-based clustering
        clustering_service = get_clustering_service()
        result = await clustering_service.update_incident_clusters(db)
        
        return result
    except Exception as e:
        # Log the error and return empty result instead of crashing
        print(f"Error in clustering endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "clusters": [],
            "total_clustered": 0,
            "unclustered_count": 0,
            "error": str(e)
        }


@router.get("/heatmap")
def get_heatmap_data(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get incident data for heatmap visualization"""
    
    cutoff_time = datetime.now() - timedelta(hours=hours)
    incidents = db.query(Incident).filter(
        and_(
            Incident.created_at >= cutoff_time,
            Incident.status != IncidentStatus.REJECTED
        )
    ).all()
    
    # Format for heatmap
    heatmap_data = [
        {
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "intensity": 1.0 if inc.urgency_level == UrgencyLevel.CRITICAL else
                        0.7 if inc.urgency_level == UrgencyLevel.HIGH else
                        0.4 if inc.urgency_level == UrgencyLevel.MEDIUM else 0.2,
            "type": inc.incident_type.value,
            "timestamp": inc.created_at.isoformat()
        }
        for inc in incidents
    ]
    
    return {
        "data": heatmap_data,
        "total_points": len(heatmap_data),
        "time_range_hours": hours
    }


@router.get("/timeline")
def get_timeline(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get incident timeline data"""
    
    cutoff_time = datetime.now() - timedelta(days=days)
    
    # Query incidents by day
    timeline_data = db.query(
        func.date(Incident.created_at).label('date'),
        func.count(Incident.id).label('count'),
        Incident.incident_type
    ).filter(
        Incident.created_at >= cutoff_time
    ).group_by(
        func.date(Incident.created_at),
        Incident.incident_type
    ).order_by(func.date(Incident.created_at)).all()
    
    # Format results
    formatted_data = {}
    for date, count, incident_type in timeline_data:
        date_str = date.isoformat()
        if date_str not in formatted_data:
            formatted_data[date_str] = {"total": 0, "by_type": {}}
        
        formatted_data[date_str]["total"] += count
        formatted_data[date_str]["by_type"][incident_type.value] = count
    
    return {
        "timeline": formatted_data,
        "days": days
    }


@router.get("/top-areas")
def get_top_areas(
    limit: int = 10,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get areas with most incidents"""
    
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    # This is a simplified version - in production, you'd use PostGIS spatial clustering
    incidents = db.query(Incident).filter(
        Incident.created_at >= cutoff_time
    ).all()
    
    # Group by approximate location (rounded coordinates)
    location_counts = {}
    for inc in incidents:
        # Round to 2 decimal places (~1km precision)
        lat_key = round(inc.latitude, 2)
        lon_key = round(inc.longitude, 2)
        key = f"{lat_key},{lon_key}"
        
        if key not in location_counts:
            location_counts[key] = {
                "latitude": lat_key,
                "longitude": lon_key,
                "count": 0,
                "types": {}
            }
        
        location_counts[key]["count"] += 1
        type_name = inc.incident_type.value
        location_counts[key]["types"][type_name] = location_counts[key]["types"].get(type_name, 0) + 1
    
    # Sort by count and get top areas
    top_areas = sorted(location_counts.values(), key=lambda x: x["count"], reverse=True)[:limit]
    
    return {
        "top_areas": top_areas,
        "hours": hours
    }
