"""
ArtSnap Lens Routes - AI-powered craft identification from an uploaded photo
"""
import hashlib
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import supabase

router = APIRouter(prefix="/artsnap", tags=["artsnap"])

# No hardcoded DB - using real AI services exclusively.


@router.post("/identify")
async def identify_craft(image: UploadFile = File(...)):
    """
    ArtSnap Lens endpoint:
    Directly identifies the craft using Anthropic Vision.
    """
    try:
        from app.services.ai_service import identify_with_anthropic
        
        image_bytes = await image.read()
        
        # Identify using Anthropic Claude 3.5 Sonnet Vision
        analysis = await identify_with_anthropic(image_bytes, image.content_type or "image/jpeg")
        
        # Fetch matching artisans for recommendations based on the identified art form
        art_form_name = analysis.get("name", "Indian Craft")
        artisans = supabase.table("artisans").select("id, name, location_lat, location_long, upi_id").execute()

        return {
            "identified_art_form": art_form_name,
            "details": analysis,
            "cultural_story": analysis.get("description", "") + " " + analysis.get("significance", ""),
            "artisan_recommendations": artisans.data[:5], 
        }
    except Exception as e:
        print(f"[ArtSnap] Identification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
