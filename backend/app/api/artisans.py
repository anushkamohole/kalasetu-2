"""
Artisan Routes - CRUD for artisan profiles with OTP-based auth simulation
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.models.schemas import ArtisanCreate, ArtisanResponse
from app.core.config import supabase

router = APIRouter(prefix="/artisans", tags=["artisans"])


@router.get("/", response_model=list[ArtisanResponse])
async def list_artisans(art_form: Optional[str] = None):
    """List all artisans, optionally filtered by art_form (for ArtformDetails page)."""
    try:
        query = supabase.table("artisans").select("*")
        # Filter by art_form via join on artifacts table — for MVP we return all and filter client-side
        # TODO: once artisans have craft_type column, add .eq("craft_type", art_form) here
        response = query.execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ArtisanResponse, status_code=201)
async def create_artisan(artisan: ArtisanCreate):
    """Register a new artisan profile. In a real app, OTP verification happens before this."""
    data = artisan.model_dump()
    try:
        response = supabase.table("artisans").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{artisan_id}", response_model=ArtisanResponse)
async def get_artisan(artisan_id: str):
    """Fetch a single artisan profile by ID."""
    try:
        response = supabase.table("artisans").select("*").eq("id", artisan_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Artisan not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{artisan_id}", response_model=ArtisanResponse)
async def update_artisan(artisan_id: str, artisan: ArtisanCreate):
    """Update artisan profile details."""
    try:
        response = (
            supabase.table("artisans")
            .update(artisan.model_dump(exclude_unset=True))
            .eq("id", artisan_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Artisan not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/by-phone/{phone_number}", response_model=ArtisanResponse)
async def get_artisan_by_phone(phone_number: str):
    """Fetch artisan by phone number — used for OTP-based login lookup."""
    try:
        response = supabase.table("artisans").select("*").eq("phone_number", phone_number).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Artisan not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
