from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime


class ArtisanCreate(BaseModel):
    phone_number: str
    name: str
    location_lat: Optional[float] = None
    location_long: Optional[float] = None
    state: Optional[str] = None
    upi_id: Optional[str] = None


class ArtisanResponse(BaseModel):
    id: str
    phone_number: str
    name: str
    location_lat: Optional[float] = None
    location_long: Optional[float] = None
    state: Optional[str] = None
    upi_id: Optional[str] = None
    created_at: Optional[str] = None


class ArtifactResponse(BaseModel):
    id: str
    artisan_id: str
    art_form: Optional[str]
    image_url: Optional[str]
    qr_code_url: Optional[str]
    created_at: Optional[str]


class StoryResponse(BaseModel):
    id: str
    artifact_id: str
    original_voice_note_url: Optional[str]
    raw_transcript: Optional[str]
    generated_narrative_english: Optional[str]
    generated_narrative_hindi: Optional[str]
    vision_tags: Optional[dict]
    is_approved: bool


class TipRequest(BaseModel):
    artifact_id: str
    artisan_id: str
    amount: float  # In INR


class TipOrderResponse(BaseModel):
    order_id: str
    amount: int  # In paise
    currency: str
    artisan_name: str
    upi_id: Optional[str]


class ArtSnapResponse(BaseModel):
    art_form: str
    confidence: float
    artisans: list
