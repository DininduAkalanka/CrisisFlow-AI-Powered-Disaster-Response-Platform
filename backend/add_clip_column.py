"""Add clip_embedding column to incidents table"""
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Add clip_embedding column
    conn.execute(text("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS clip_embedding TEXT"))
    conn.commit()
    print("clip_embedding column added to incidents table")
