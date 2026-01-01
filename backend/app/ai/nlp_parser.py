"""
NLP Service - SOTA Entity Extraction using GLiNER
Handles messy, mixed-language (Singlish) SOS messages
"""
import re
from typing import Dict, List, Optional
from gliner import GLiNER
import torch
from app.core.config import settings
from app.core.monitoring import monitor_model_inference


class NLPService:
    """
    Production-Grade NLP Parser for Disaster SOS Messages
    
    Features:
    - Zero-shot Named Entity Recognition using GLiNER
    - Multi-language support (English, Sinhala, Singlish mix)
    - Robust entity extraction: Location, Urgency, Resources, Contact Info
    - No fine-tuning required
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.gliner_model = None
        
        # Entity labels for disaster management
        self.entity_labels = [
            "Location",
            "Urgency",
            "Resource_Needed",
            "Person_Count",
            "Contact_Info"
        ]
        
        # Additional regex patterns for phone numbers and counts
        self.phone_pattern = re.compile(r'\+?\d[\d\s\-()]{7,}\d')
        self.person_count_pattern = re.compile(r'(\d+)\s*(people|persons|families|ppl|මිනිස්සු)')
        
    def load_model(self):
        """Load GLiNER model for generalist NER"""
        try:
            print(f"Loading GLiNER model on {self.device}...")
            # Disable symlinks for Windows compatibility
            import os
            os.environ['HF_HUB_DISABLE_SYMLINKS'] = '1'
            
            # Use GLiNER-base model (supports English and multilingual)
            self.gliner_model = GLiNER.from_pretrained(
                "urchade/gliner_base",
                local_files_only=False
            )
            self.gliner_model.to(self.device)
            print("GLiNER model loaded successfully")
        except Exception as e:
            print(f"Error loading GLiNER model: {str(e)}")
            print("Tip: Try running PowerShell as Administrator or enable Developer Mode")
            raise
    
    @monitor_model_inference("GLiNER")
    def parse_sos(self, text: str) -> Dict[str, any]:
        """
        Parse SOS message and extract actionable entities using GLiNER
        
        Args:
            text: Raw SOS message (can be Singlish, fragmented, or mixed-language)
            
        Returns:
            JSON with extracted entities: Location, Urgency, Resources, etc.
        """
        try:
            if self.gliner_model is None:
                self.load_model()
            
            # Preprocess: Clean and normalize text
            cleaned_text = self._preprocess_text(text)
            
            # Entity extraction using GLiNER
            entities = self.gliner_model.predict_entities(
                cleaned_text,
                self.entity_labels,
                threshold=0.3  # Lower threshold for noisy text
            )
            
            # Post-process entities
            parsed_entities = {
                "location": [],
                "urgency": [],
                "resource_needed": [],
                "person_count": [],
                "contact_info": []
            }
            
            for entity in entities:
                label = entity["label"].lower()
                text_span = entity["text"]
                
                if label == "location":
                    parsed_entities["location"].append(text_span)
                elif label == "urgency":
                    parsed_entities["urgency"].append(text_span)
                elif label == "resource_needed":
                    parsed_entities["resource_needed"].append(text_span)
                elif label == "person_count":
                    parsed_entities["person_count"].append(text_span)
                elif label == "contact_info":
                    parsed_entities["contact_info"].append(text_span)
            
            # Regex-based fallback for phone numbers
            phone_matches = self.phone_pattern.findall(text)
            if phone_matches:
                parsed_entities["contact_info"].extend(phone_matches)
            
            # Extract person count from numbers
            count_matches = self.person_count_pattern.findall(text.lower())
            if count_matches:
                for count, _ in count_matches:
                    parsed_entities["person_count"].append(count)
            
            # Assess urgency level
            urgency_level = self._assess_urgency(cleaned_text, parsed_entities["urgency"])
            
            return {
                "entities": parsed_entities,
                "urgency_level": urgency_level,
                "raw_text": text,
                "cleaned_text": cleaned_text,
                "model": "GLiNER-base"
            }
            
        except Exception as e:
            print(f"Error in parse_sos: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "entities": {
                    "location": [],
                    "urgency": [],
                    "resource_needed": [],
                    "person_count": [],
                    "contact_info": []
                },
                "urgency_level": "medium",
                "raw_text": text,
                "error": str(e)
            }
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and normalize messy input text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\.,!?;:\-()#+]', '', text)
        return text
    
    def _assess_urgency(self, text: str, urgency_entities: List[str]) -> str:
        """
        Determine urgency level based on keywords and entities
        
        Returns: "critical", "high", "medium", or "low"
        """
        text_lower = text.lower()
        
        # Critical keywords
        critical_keywords = ["dying", "death", "critical", "bleeding", "trapped", "fire", "drowning"]
        if any(kw in text_lower for kw in critical_keywords):
            return "critical"
        
        # High urgency keywords
        high_keywords = ["urgent", "emergency", "help", "asap", "immediately", "injured"]
        if any(kw in text_lower for kw in high_keywords):
            return "high"
        
        # Check GLiNER-extracted urgency entities
        if urgency_entities:
            for entity in urgency_entities:
                if any(kw in entity.lower() for kw in critical_keywords):
                    return "critical"
                if any(kw in entity.lower() for kw in high_keywords):
                    return "high"
        
        # Default to medium
        return "medium"


# Singleton instance
_nlp_service = None


def get_nlp_service() -> NLPService:
    """Get singleton instance of NLPService"""
    global _nlp_service
    if _nlp_service is None:
        _nlp_service = NLPService()
        _nlp_service.load_model()
    return _nlp_service
