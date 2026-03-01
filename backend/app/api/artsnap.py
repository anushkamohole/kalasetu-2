"""
ArtSnap Lens Routes - AI-powered craft identification from an uploaded photo
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ai_service import analyze_image_mock
from app.core.config import supabase

router = APIRouter(prefix="/artsnap", tags=["artsnap"])


@router.post("/identify")
async def identify_craft(image: UploadFile = File(...)):
    """
    ArtSnap Lens endpoint:
    1. Receives an image from a user (tourist / buyer)
    2. Runs mock Google Vision to classify art form
    3. Queries DB for artisans matching that art form
    4. Returns classification + artisan recommendations
    """
    try:
        image_bytes = await image.read()
        # In production, upload the image and pass URL to Vision API
        vision_result = await analyze_image_mock("mock_url")

        art_form = vision_result["art_form"]
        artisans = supabase.table("artisans").select("id, name, location_lat, location_long, upi_id").execute()

        # In production, filter by art_form once artisans have a craft_type column
        return {
            "identified_art_form": art_form,
            "confidence": vision_result["confidence"],
            "tags": vision_result["tags"],
            "artisan_recommendations": artisans.data[:5],  # return top 5
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
