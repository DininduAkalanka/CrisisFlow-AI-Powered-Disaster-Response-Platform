"""
Vision Service - SOTA Computer Vision AI
Uses EfficientNetV2 + CLIP for disaster image verification and semantic deduplication
"""
from PIL import Image
import torch
import torch.nn.functional as F
import timm
import clip
import numpy as np
from typing import Dict, Tuple, Optional, List
import os
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings


class VisionService:
    """
    Production-Grade Vision Agent for Disaster Image Analysis
    
    Features:
    - Multi-label classification using EfficientNetV2
    - Semantic embedding generation with CLIP (512-dim)
    - Duplicate detection via pgvector cosine similarity (threshold: 0.95)
    - GPU acceleration support
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.efficientnet_model = None
        self.clip_model = None
        self.clip_preprocess = None
        
        # Disaster class labels (multi-label)
        self.class_labels = ["flood", "fire", "safe"]
        self.threshold = 0.5  # Multi-label classification threshold
        
        # Deduplication threshold
        self.duplicate_threshold = 0.95
    
    def load_models(self):
        """Load EfficientNetV2 and CLIP models"""
        try:
            # Load EfficientNetV2 for classification
            print(f"Loading EfficientNetV2 on {self.device}...")
            self.efficientnet_model = timm.create_model(
                'tf_efficientnetv2_s',
                pretrained=True,
                num_classes=len(self.class_labels)
            )
            self.efficientnet_model.to(self.device)
            self.efficientnet_model.eval()
            
            # Load CLIP for semantic embeddings
            print(f"Loading CLIP ViT-B/32 on {self.device}...")
            self.clip_model, self.clip_preprocess = clip.load("ViT-B/32", device=self.device)
            self.clip_model.eval()
            
            print("✓ Vision models loaded successfully")
        except Exception as e:
            print(f"✗ Error loading vision models: {str(e)}")
            raise
    
    async def analyze_image(self, image_path: str, db: Session) -> Dict[str, any]:
        """
        Analyze disaster image with EfficientNetV2 + CLIP
        
        Args:
            image_path: Path to the uploaded image
            db: Database session for duplicate detection
            
        Returns:
            Dict with classification, embedding, and duplicate status
        """
        try:
            if self.efficientnet_model is None or self.clip_model is None:
                self.load_models()
            
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            
            # ===== STEP 1: Multi-Label Classification (EfficientNetV2) =====
            # Prepare image for EfficientNet
            img_tensor = timm.data.transforms_factory.create_transform(
                **timm.data.resolve_data_config(self.efficientnet_model.pretrained_cfg)
            )(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                logits = self.efficientnet_model(img_tensor)
                probs = torch.sigmoid(logits).cpu().numpy()[0]  # Multi-label: sigmoid
            
            # Extract detected classes (threshold-based)
            detected_classes = []
            for idx, prob in enumerate(probs):
                if prob > self.threshold:
                    detected_classes.append({
                        "label": self.class_labels[idx],
                        "confidence": float(prob)
                    })
            
            # Fallback if no class detected
            if not detected_classes:
                max_idx = np.argmax(probs)
                detected_classes = [{
                    "label": self.class_labels[max_idx],
                    "confidence": float(probs[max_idx])
                }]
            
            # ===== STEP 2: Generate CLIP Embedding (512-dim) =====
            clip_input = self.clip_preprocess(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                clip_embedding = self.clip_model.encode_image(clip_input)
                clip_embedding = F.normalize(clip_embedding, dim=-1).cpu().numpy()[0]  # L2 normalize
            
            # ===== STEP 3: Duplicate Detection via pgvector =====
            is_duplicate = False
            duplicate_info = None
            
            try:
                # Check if pgvector extension is available
                check_pgvector = text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
                has_pgvector = db.execute(check_pgvector).fetchone() is not None
                
                if has_pgvector:
                    # Query pgvector for similar images (Cosine Similarity > 0.95)
                    query = text("""
                        SELECT 
                            id, 
                            title,
                            1 - (clip_embedding <=> :embedding::vector) AS similarity
                        FROM incidents
                        WHERE clip_embedding IS NOT NULL
                            AND 1 - (clip_embedding <=> :embedding::vector) > :threshold
                        ORDER BY similarity DESC
                        LIMIT 1
                    """)
                    
                    result = db.execute(
                        query,
                        {
                            "embedding": clip_embedding.tolist(),
                            "threshold": self.duplicate_threshold
                        }
                    ).fetchone()
                    
                    if result:
                        is_duplicate = True
                        duplicate_info = {
                            "incident_id": result[0],
                            "title": result[1],
                            "similarity": float(result[2])
                        }
                else:
                    print("⚠ pgvector not installed - duplicate detection disabled")
            except Exception as e:
                print(f"⚠ Duplicate detection failed (pgvector may not be installed): {str(e)}")
                # Continue without duplicate detection
            
            # ===== STEP 4: Return Results =====
            return {
                "classification": {
                    "detected_classes": detected_classes,
                    "is_disaster": not any(c["label"] == "safe" for c in detected_classes)
                },
                "embedding": {
                    "vector": clip_embedding.tolist(),
                    "dimension": len(clip_embedding),
                    "model": "CLIP-ViT-B/32"
                },
                "duplicate_detection": {
                    "is_duplicate": is_duplicate,
                    "match": duplicate_info
                }
            }
            
        except Exception as e:
            print(f"✗ Error in analyze_image: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "classification": {
                    "detected_classes": [],
                    "is_disaster": False
                },
                "embedding": None,
                "duplicate_detection": {
                    "is_duplicate": False,
                    "match": None
                },
                "error": str(e)
            }


# Singleton instance
_vision_service = None


def get_vision_service() -> VisionService:
    """Get singleton instance of VisionService"""
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionService()
        _vision_service.load_models()
    return _vision_service
