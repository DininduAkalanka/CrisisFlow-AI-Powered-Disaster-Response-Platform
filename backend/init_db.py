"""Database initialization script"""
from app.core.database import Base, engine, init_db
from app.models import Incident, User, IncidentCluster
import sys


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    try:
        # Import all models to ensure they're registered
        from app.models.incident import Incident, User, IncidentCluster
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✓ Database tables created successfully!")
        print("\nCreated tables:")
        print("  - incidents")
        print("  - users")
        print("  - incident_clusters")
        
        return True
        
    except Exception as e:
        print(f"✗ Error creating tables: {str(e)}")
        return False


def check_postgis():
    """Check if PostGIS extension is available"""
    from sqlalchemy import text
    from app.core.database import engine
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_version();"))
            version = result.fetchone()[0]
            print(f"✓ PostGIS is installed: {version}")
            return True
    except Exception as e:
        print(f"✗ PostGIS check failed: {str(e)}")
        print("\nPlease ensure PostGIS is installed:")
        print("  1. Install PostgreSQL with PostGIS")
        print("  2. Connect to your database")
        print("  3. Run: CREATE EXTENSION postgis;")
        return False


if __name__ == "__main__":
    print("="*60)
    print("CrisisFlow Database Initialization")
    print("="*60)
    print()
    
    # Check PostGIS
    if not check_postgis():
        print("\n⚠ Warning: PostGIS not available. Spatial features will not work.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    print()
    
    # Create tables
    if create_tables():
        print("\n✓ Database initialization complete!")
        print("\nNext steps:")
        print("  1. Start the backend: uvicorn app.main:app --reload")
        print("  2. Start the frontend: cd frontend && npm run dev")
    else:
        print("\n✗ Database initialization failed!")
        sys.exit(1)
