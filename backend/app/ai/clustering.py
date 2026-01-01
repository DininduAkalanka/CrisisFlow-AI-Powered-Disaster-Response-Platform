"""
Geospatial Clustering Service - PostGIS Native Implementation
Uses ST_ClusterDBSCAN directly in PostgreSQL for high-performance spatial clustering
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List
from app.core.config import settings


class GeospatialClusteringService:
    """
    Production-Grade Geospatial Clustering using PostGIS
    
    Features:
    - Native PostGIS ST_ClusterDBSCAN for spatial clustering
    - Efficient server-side processing (no Python scikit-learn)
    - Configurable clustering parameters (eps, minpoints)
    - Real-time cluster updates
    """
    
    def __init__(self):
        # Clustering parameters
        self.eps = 0.005  # ~500 meters in decimal degrees
        self.minpoints = 3  # Minimum incidents to form a cluster
    
    async def update_incident_clusters(self, db: Session) -> Dict[str, any]:
        """
        Execute PostGIS ST_ClusterDBSCAN to group nearby incidents
        
        Args:
            db: SQLAlchemy database session
            
        Returns:
            Dict with clustering statistics
        """
        try:
            # Use simple geometry-based clustering (no geography type needed)
            # ST_ClusterDBSCAN with geometry works with degrees
            query = text("""
                WITH clustered AS (
                    SELECT 
                        id,
                        title,
                        latitude,
                        longitude,
                        ST_ClusterDBSCAN(
                            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                            eps := :eps, 
                            minpoints := :minpoints
                        ) OVER () AS cluster_id
                    FROM incidents
                    WHERE status != 'RESOLVED'
                        AND created_at >= NOW() - INTERVAL '24 hours'
                        AND latitude IS NOT NULL
                        AND longitude IS NOT NULL
                )
                UPDATE incidents
                SET cluster_id = clustered.cluster_id
                FROM clustered
                WHERE incidents.id = clustered.id
                RETURNING incidents.cluster_id;
            """)
            
            # For geometry (not geography), eps is in degrees
            # 0.005 degrees ≈ 500-550 meters at equator
            
            result = db.execute(
                query,
                {
                    "eps": self.eps,  # Use degrees directly for geometry
                    "minpoints": self.minpoints
                }
            )
            db.commit()
            
            # Collect clustering statistics
            stats_query = text("""
                SELECT 
                    cluster_id,
                    COUNT(*) as incident_count,
                    AVG(latitude) as center_lat,
                    AVG(longitude) as center_lon,
                    ARRAY_AGG(id) as incident_ids,
                    MODE() WITHIN GROUP (ORDER BY incident_type) as dominant_type,
                    AVG(CASE urgency_level 
                        WHEN 'CRITICAL' THEN 1.0
                        WHEN 'HIGH' THEN 0.75
                        WHEN 'MEDIUM' THEN 0.5
                        WHEN 'LOW' THEN 0.25
                        ELSE 0.5
                    END) as priority_score
                FROM incidents
                WHERE cluster_id IS NOT NULL
                    AND status != 'RESOLVED'
                    AND created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY cluster_id
                ORDER BY incident_count DESC;
            """)
            
            clusters_result = db.execute(stats_query).fetchall()
            
            # Map action recommendations based on dominant type and priority
            action_map = {
                'FIRE': 'deploy_firefighters',
                'FLOOD': 'evacuate_area',
                'ROAD_BLOCK': 'clear_road',
                'BUILDING_DAMAGE': 'structural_inspection',
                'MEDICAL': 'send_ambulance',
                'RESOURCE_SHORTAGE': 'distribute_supplies',
                'OTHER': 'assess_situation'
            }
            
            clusters = []
            for row in clusters_result:
                dominant_type = row[5] if row[5] else 'OTHER'
                clusters.append({
                    "cluster_id": row[0],
                    "incident_count": row[1],
                    "center_latitude": float(row[2]),
                    "center_longitude": float(row[3]),
                    "incident_ids": row[4],
                    "dominant_type": dominant_type.lower(),
                    "priority_score": float(row[6]) if row[6] else 0.5,
                    "recommended_action": action_map.get(dominant_type, 'assess_situation')
                })
            
            # Count unclustered incidents
            unclustered_query = text("""
                SELECT COUNT(*) 
                FROM incidents 
                WHERE cluster_id IS NULL 
                    AND status != 'RESOLVED'
                    AND created_at >= NOW() - INTERVAL '24 hours';
            """)
            unclustered_count = db.execute(unclustered_query).scalar()
            
            # Calculate approximate meters for reporting
            eps_meters = self.eps * 111320  # Convert degrees to meters at equator
            
            return {
                "status": "success",
                "total_clusters": len(clusters),
                "clusters": clusters,
                "unclustered_count": unclustered_count,
                "largest_cluster_size": clusters[0]["incident_count"] if clusters else 0,
                "parameters": {
                    "eps": self.eps,
                    "eps_meters": eps_meters,
                    "minpoints": self.minpoints
                }
            }
            
        except Exception as e:
            print(f"Error in update_incident_clusters: {str(e)}")
            import traceback
            traceback.print_exc()
            db.rollback()
            return {
                "status": "error",
                "error": str(e),
                "total_clusters": 0,
                "clusters": [],
                "unclustered_count": 0
            }


# Singleton instance
_clustering_service = None


def get_clustering_service() -> GeospatialClusteringService:
    """Get singleton instance of GeospatialClusteringService"""
    global _clustering_service
    if _clustering_service is None:
        _clustering_service = GeospatialClusteringService()
    return _clustering_service
