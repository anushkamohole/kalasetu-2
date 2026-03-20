"""
Artifact Routes - Core product ingestion, AI processing, QR generation, and buyer scan endpoint
"""
import uuid
import base64
import hashlib
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.core.config import supabase, APP_BASE_URL
from app.services.ai_service import transcribe_audio, analyze_image_mock, generate_story_mock
from app.utils.image_processor import resize_image
from app.utils.qr_generator import generate_qr_code_base64
from app.services.dialect_engine import analyze_dialect_authenticity  # ← NEW

logger = logging.getLogger(__name__)
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
    3. AI chain: Vision → Sarvam ASR → Story Generation
    4. Dialect Intelligence: Linguistic authentication
    5. Cryptographic provenance signature
    6. Store artifact + story in DB
    7. Return artifact ID + dialect analysis
    """
    try:
        # ── Step 1: Process & upload image
        image_bytes = await image.read()
        resized_image = resize_image(image_bytes)
        image_filename = f"{uuid.uuid4()}.jpg"
        supabase.storage.from_("artifact_images").upload(
            path=image_filename,
            file=resized_image,
            file_options={"content-type": "image/jpeg"},
        )
        image_url = supabase.storage.from_("artifact_images").get_public_url(image_filename)

        # ── Step 2: Upload voice note
        voice_bytes = await voice_note.read()
        voice_filename = f"{uuid.uuid4()}.webm"
        supabase.storage.from_("voice_notes").upload(
            path=voice_filename,
            file=voice_bytes,
            file_options={"content-type": "audio/webm"},
        )
        voice_url = supabase.storage.from_("voice_notes").get_public_url(voice_filename)
        # ── Step 3: AI Intelligence Chain
        vision_result = await analyze_image_mock(image_url)
        logger.info(f"[Vision Debug] art_form={vision_result['art_form']} | image_url={image_url[-40:]}")  # ← ADD THIS LINE
        transcript, language_code = await transcribe_audio_with_language(voice_bytes)
        logger.info(f"[DEBUG] transcript={transcript[:30]} | language_code={language_code}")
        story_texts = await generate_story_mock(transcript, vision_result, vision_result["art_form"])

        # ── Step 4: Dialect Intelligence — Linguistic Authentication ← NEW
        # This NEVER crashes — has safety net inside
        dialect_analysis = analyze_dialect_authenticity(
            language_code=language_code,
            art_form=vision_result["art_form"],
            transcript=transcript,
        )
        logger.info(
            f"[Dialect] {dialect_analysis['dialect']['language_name']} | "
            f"Score: {dialect_analysis['authenticity_score']} | "
            f"Verdict: {dialect_analysis['verdict']}"
        )

        # ── Step 5: Cryptographic Provenance Signature
        # Now includes dialect in the signature for extra tamper-proofing
        core_data = (
            f"{artisan_id}|"
            f"{vision_result['art_form']}|"
            f"{image_url}|"
            f"{dialect_analysis['dialect']['language_code']}"
        )
        crypto_sig = hashlib.sha256(core_data.encode("utf-8")).hexdigest()

        # ── Step 6: Insert artifact into DB
        artifact_data = {
            "artisan_id": artisan_id,
            "art_form": vision_result["art_form"],
            "image_url": image_url,
            "cryptographic_signature": crypto_sig,
        }
        artifact_resp = supabase.table("artifacts").insert(artifact_data).execute()
        artifact_id = artifact_resp.data[0]["id"]

        # ── Step 7: Insert story into DB
        # vision_tags now includes dialect analysis
        enhanced_vision_tags = {
            **vision_result,
            "dialect_analysis": dialect_analysis,
        }
        story_data = {
            "artifact_id": artifact_id,
            "original_voice_note_url": voice_url,
            "raw_transcript": transcript,
            "generated_narrative_english": story_texts["english"],
            "generated_narrative_hindi": story_texts["hindi"],
            "vision_tags": enhanced_vision_tags,
            "is_approved": False,
        }
        supabase.table("stories").insert(story_data).execute()

        return {
            "artifact_id": artifact_id,
            "art_form": vision_result["art_form"],
            "story_preview": story_texts["english"][:150] + "...",
            "message": "Story generated! Pending artisan approval.",
            # ── Dialect Intelligence in response ← NEW
            "dialect_intelligence": {
                "language_detected": dialect_analysis["dialect"]["language_name"],
                "authenticity_score": dialect_analysis["authenticity_score"],
                "verdict": dialect_analysis["verdict"],
                "verdict_color": dialect_analysis["verdict_color"],
                "dialect_region": dialect_analysis["dialect"]["region"],
                "craft_origin_region": dialect_analysis["craft_origin"]["authentic_region"],
                "is_geographic_match": dialect_analysis["match_analysis"]["is_geographic_match"],
                "gi_tagged": dialect_analysis["craft_origin"]["gi_tagged"],
                "explanation": dialect_analysis["explanation"],
            },
        }

    except Exception as e:
        logger.error(f"[process_artifact] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def transcribe_audio_with_language(audio_bytes: bytes) -> tuple[str, str]:
    """
    Wrapper around transcribe_audio that also returns the detected language code.
    Sarvam returns language_code in the response — we need to capture it.
    SAFE: returns ("mock transcript", "hi-IN") if anything fails.
    """
    from app.core.config import SARVAM_API_KEY
    import httpx
    import os
    from dotenv import load_dotenv
    load_dotenv()

    key = os.getenv("SARVAM_API_KEY", "")
    if not key:
        transcript = await transcribe_audio(audio_bytes)
        return transcript, "hi-IN"

    try:
        form_data = {"model": "saaras:v3", "mode": "transcribe"}
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": key},
                files={"file": ("audio.webm", audio_bytes, "audio/webm")},
                data=form_data,
            )

        if response.status_code == 200:
            result = response.json()
            transcript = result.get("transcript", "").strip()
            language_code = result.get("language_code", "hi-IN")
            logger.info(f"[Sarvam] Transcript: '{transcript[:60]}' | Lang: {language_code}")
            return transcript or "यह एक परंपरागत कला है।", language_code

    except Exception as e:
        logger.error(f"[Sarvam] transcribe_audio_with_language failed: {e}")

    # Fallback — use existing transcribe_audio function
    transcript = await transcribe_audio(audio_bytes)
    return transcript, "hi-IN"


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
        story = supabase.table("stories").select("vision_tags").eq("artifact_id", artifact_id).single().execute()

        # Get dialect info from stored vision_tags
        dialect_analysis = {}
        if story.data and story.data.get("vision_tags"):
            dialect_analysis = story.data["vision_tags"].get("dialect_analysis", {})

        artisan_id_val = str(data.get("artisan_id") or "")
        art_form_val = str(data.get("art_form") or "")
        image_url_val = str(data.get("image_url") or "")
        language_code_val = dialect_analysis.get("dialect", {}).get("language_code", "hi-IN")

        # Recalculate with dialect included
        core_data = f"{artisan_id_val}|{art_form_val}|{image_url_val}|{language_code_val}"
        recalculated_sig = hashlib.sha256(core_data.encode("utf-8")).hexdigest()
        stored_sig = data.get("cryptographic_signature", "")

        # Also try old signature format (backward compatibility)
        old_core_data = f"{artisan_id_val}|{art_form_val}|{image_url_val}"
        old_sig = hashlib.sha256(old_core_data.encode("utf-8")).hexdigest()

        is_verified = recalculated_sig == stored_sig or old_sig == stored_sig

        return {
            "verified": is_verified,
            "dialect_intelligence": dialect_analysis if dialect_analysis else None,
            "authenticity_score": dialect_analysis.get("authenticity_score", 75) if dialect_analysis else 75,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{artifact_id}/generate-qr")
async def generate_qr(artifact_id: str):
    """Generates a QR code for the artifact's buyer scan URL and stores it in the DB."""
    artifact_req = supabase.table("artifacts").select("cryptographic_signature").eq("id", artifact_id).single().execute()
    crypto_sig = artifact_req.data.get("cryptographic_signature", "")

    scan_url = f"{APP_BASE_URL}/scan/{artifact_id}?sig={crypto_sig}"
    qr_base64 = generate_qr_code_base64(scan_url)

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


@router.get("/by-artisan/{artisan_id}")
async def get_artifacts_by_artisan(artisan_id: str):
    """Fetch all artifacts with their stories for a given artisan."""
    try:
        artifacts = supabase.table("artifacts").select("*, stories(*)").eq(
            "artisan_id", artisan_id
        ).execute()
        return artifacts.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
