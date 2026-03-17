"""
Artifact Routes - Core product ingestion, AI processing, QR generation, and buyer scan endpoint
"""
import uuid
import base64
import hashlib
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.core.config import supabase, APP_BASE_URL
from app.services.ai_service import transcribe_audio_mock, analyze_image_mock, generate_story_mock
from app.utils.image_processor import resize_image
from app.utils.qr_generator import generate_qr_code_base64

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.get("/{artifact_id}")
async def get_artifact(artifact_id: str):
    """Buyer Scan Endpoint: fetches the full product story for a given artifact UUID."""
    try:
        artifact = supabase.table("artifacts").select("*, artisans(*)").eq("id", artifact_id).single().execute()
        if not artifact.data:
            raise HTTPException(status_code=404, detail="Artifact not found")

        story = supabase.table("stories").select("*").eq("artifact_id", artifact_id).single().execute()

        return {
            "artifact": artifact.data,
            "story": story.data,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/process")
async def process_artifact(
    artisan_id: str = Form(...),
    image: UploadFile = File(...),
    voice_note: UploadFile = File(...),
):
    """
    Core Pipeline Endpoint:
    1. Resize + upload image to Supabase Storage
    2. Upload voice note to Supabase Storage
    3. Run mocked AI chain (Vision -> Transcript -> Gemini Story)
    4. Store artifact + story in DB
    5. Return artifact ID for downstream QR generation
    """
    try:
        # --- Step 1: Process & upload image ---
        image_bytes = await image.read()
        resized_image = resize_image(image_bytes)
        image_filename = f"{uuid.uuid4()}.jpg"

        supabase.storage.from_("artifact_images").upload(
            path=image_filename,
            file=resized_image,
            file_options={"content-type": "image/jpeg"},
        )
        image_url = supabase.storage.from_("artifact_images").get_public_url(image_filename)

        # --- Step 2: Upload voice note ---
        voice_bytes = await voice_note.read()
        voice_filename = f"{uuid.uuid4()}.wav"
        supabase.storage.from_("voice_notes").upload(
            path=voice_filename,
            file=voice_bytes,
            file_options={"content-type": "audio/wav"},
        )
        voice_url = supabase.storage.from_("voice_notes").get_public_url(voice_filename)

        # --- Step 3: AI Intelligence Chain (Mocked) ---
        vision_result = await analyze_image_mock(image_url)
        transcript = await transcribe_audio_mock(voice_url)
        story_texts = await generate_story_mock(transcript, vision_result, vision_result["art_form"])

        # --- Cryptographic Provenance Engine ---
        # Hash core immutable data
        core_data = f"{artisan_id}|{vision_result['art_form']}|{image_url}"
        crypto_sig = hashlib.sha256(core_data.encode("utf-8")).hexdigest()

        # --- Step 4: Insert artifact into DB ---
        artifact_data = {
            "artisan_id": artisan_id,
            "art_form": vision_result["art_form"],
            "image_url": image_url,
            "cryptographic_signature": crypto_sig,
        }
        artifact_resp = supabase.table("artifacts").insert(artifact_data).execute()
        artifact_id = artifact_resp.data[0]["id"]

        # --- Insert story into DB ---
        story_data = {
            "artifact_id": artifact_id,
            "original_voice_note_url": voice_url,
            "raw_transcript": transcript,
            "generated_narrative_english": story_texts["english"],
            "generated_narrative_hindi": story_texts["hindi"],
            "vision_tags": vision_result,
            "is_approved": False,
        }
        supabase.table("stories").insert(story_data).execute()

        return {
            "artifact_id": artifact_id,
            "art_form": vision_result["art_form"],
            "story_preview": story_texts["english"][:150] + "...",
            "message": "Story generated! Pending artisan approval.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{artifact_id}/approve")
async def approve_story(artifact_id: str):
    """Human-in-the-loop: Artisan approves the AI-generated story."""
    try:
        supabase.table("stories").update({"is_approved": True}).eq("artifact_id", artifact_id).execute()
        return {"message": "Story approved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{artifact_id}/verify")
async def verify_artifact(artifact_id: str):
    """Cryptographic Verification Endpoint."""
    try:
        artifact = supabase.table("artifacts").select("*").eq("id", artifact_id).single().execute()
        if not artifact.data:
            raise HTTPException(status_code=404, detail="Artifact not found")

        data = artifact.data
        # Recalculate hash from immutable fields
        artisan_id_val = str(data.get("artisan_id") or "")
        art_form_val = str(data.get("art_form") or "")
        image_url_val = str(data.get("image_url") or "")
        
        core_data = f"{artisan_id_val}|{art_form_val}|{image_url_val}"
        recalculated_sig = hashlib.sha256(core_data.encode("utf-8")).hexdigest()
        
        stored_sig = data.get("cryptographic_signature", "")
        
        return {"verified": recalculated_sig == stored_sig}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{artifact_id}/generate-qr")
async def generate_qr(artifact_id: str):
    """Generates a QR code for the artifact's buyer scan URL and stores it in the DB."""
    # Fetch the cryptographic signature for the URL parameters
    artifact_req = supabase.table("artifacts").select("cryptographic_signature").eq("id", artifact_id).single().execute()
    crypto_sig = artifact_req.data.get("cryptographic_signature", "")

    scan_url = f"{APP_BASE_URL}/scan/{artifact_id}?sig={crypto_sig}"
    qr_base64 = generate_qr_code_base64(scan_url)

    # Upload QR PNG to Supabase storage
    qr_bytes = base64.b64decode(qr_base64.split(",")[1])
    qr_filename = f"qr_{artifact_id}.png"
    supabase.storage.from_("qr_codes").upload(
        path=qr_filename,
        file=qr_bytes,
        file_options={"content-type": "image/png"},
    )
    qr_url = supabase.storage.from_("qr_codes").get_public_url(qr_filename)

    supabase.table("artifacts").update({"qr_code_url": qr_url}).eq("id", artifact_id).execute()

    return {
        "scan_url": scan_url,
        "qr_code_url": qr_url,
        "qr_base64": qr_base64,
    }
