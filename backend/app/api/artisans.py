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
    """Register a new artisan profile. Upserts on phone_number so returning artisans
    are recognised automatically — no separate login step needed."""
    # Strip empty strings and None values before sending to Supabase.
    # This prevents errors if optional columns (like state or upi_id) do not exist
    # in the actual database schema yet.
    data = {k: v for k, v in artisan.model_dump().items() if v is not None and v != ""}
    insert_error_msg = ""
    try:
        # Try to insert first
        response = supabase.table("artisans").insert(data).execute()
        if response.data:
            return response.data[0]
        raise Exception("Empty response from Supabase insert")
    except Exception as insert_err:
        insert_error_msg = str(insert_err)
        print("DEBUG INSERT ERR:", insert_error_msg)
        print("DEBUG LOOKUP PHONE:", artisan.phone_number)
        # Phone number already exists — look up and return the existing record
        try:
            existing = supabase.table("artisans").select("*").eq(
                "phone_number", artisan.phone_number
            ).execute()
            print("DEBUG LOOKUP RESULT:", existing.data)
            if existing.data:
                return existing.data[0]
        except Exception as lookup_err:
            print("DEBUG LOOKUP EXCEPTION:", lookup_err)
            raise HTTPException(
                status_code=400,
                detail=f"Registration failed ({insert_error_msg}); lookup also failed: {lookup_err}"
            )
        raise HTTPException(
            status_code=400,
            detail=f"Could not register or find artisan: {insert_error_msg} | Looked for {artisan.phone_number}, got {existing.data}"
        )


@router.get("/by-phone/{phone_number}", response_model=ArtisanResponse)
async def get_artisan_by_phone(phone_number: str):
    """Fetch artisan by phone number — used for OTP-based login lookup.
    
    IMPORTANT: This route MUST be declared before /{artisan_id} to avoid
    FastAPI matching 'by-phone' as a literal artisan_id.
    """
    try:
        response = supabase.table("artisans").select("*").eq("phone_number", phone_number).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Artisan not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


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
        data = {k: v for k, v in artisan.model_dump(exclude_unset=True).items() if v is not None and v != ""}
        response = (
            supabase.table("artisans")
            .update(data)
            .eq("id", artisan_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Artisan not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
