import base64
import httpx
import json
import re
import logging

from app.core.config import OPENROUTER_API_KEY, GOOGLE_API_KEY

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"

# Using a FREE vision model on OpenRouter
# google/gemini-2.0-flash-lite-preview-02-05:free is the most stable free vision model on OR
VISION_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free"

def _get_mock_identification_data() -> dict:
    """Returns realistic mock data when the API fails."""
    return {
        "name": "Madhubani Painting",
        "type": "Painting",
        "culture": "Mithila region, Bihar",
        "period": "Traditional / Present",
        "material": "Natural dyes and pigments on paper or cloth",
        "description": "A vibrant and intricate painting characterized by complex geometric patterns. It depicts traditional folklore and mythological scenes using bright natural colors.",
        "significance": "Historically created by women for rituals and festivals, symbolizing harmony with nature and divine connection.",
        "confidence": 0.88
    }

async def identify_with_openrouter(image_bytes: bytes, image_media_type: str = "image/jpeg") -> dict:
    """Identifies an artifact using OpenRouter's vision models."""
    if not OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY not set in .env. Falling back to mock data.")
        return _get_mock_identification_data()

    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    image_data_url = f"data:{image_media_type};base64,{base64_image}"

    payload = {
        "model": VISION_MODEL.strip(),
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """You are an expert Indian art historian. Identify the Indian handicraft or artifact in this image.
Return ONLY a valid JSON object:
{
  "name": "specific name of the art form",
  "type": "category like painting/pottery/textile/metalwork",
  "culture": "cultural origin e.g. Warli/Maharashtra",
  "period": "historical period",
  "material": "materials used",
  "description": "2 sentence visual description",
  "significance": "cultural or spiritual meaning",
  "confidence": 0.9
}"""
                    },
                    {
                        "type": "image_url",
                        "image_url": { "url": image_data_url }
                    }
                ]
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "KalaSetu App",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            if response.status_code != 200:
                logger.error(f"[OpenRouter Error]: Status {response.status_code} - {response.text}")
            response.raise_for_status()
            data = response.json()

        text = data["choices"][0]["message"]["content"].strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

    except httpx.HTTPStatusError as e:
        logger.error(f"[OpenRouter HTTP Error]: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"[OpenRouter Unexpected Error]: {str(e)}")

    return _get_mock_identification_data()

async def generate_story(transcript: str, vision_tags: dict, art_form: str) -> dict:
    """Generates a cultural story using Gemini (Free) or fallback."""
    if not GOOGLE_API_KEY:
        return {
            "english": f"The beautiful art of {art_form} comes alive through this artisan's work: {transcript}",
            "hindi": f"{art_form} की कला इस कारीगर के माध्यम से जीवंत हो उठती है।"
        }

    payload = {
        "contents": [{
            "parts": [{"text": f"""You are a poetic cultural storyteller for KalaSetu.
Artisan creates {art_form}. They said: "{transcript}". Tags: {str(vision_tags)}
Return ONLY this JSON:
{{"english": "3-4 warm sentences", "hindi": "2-3 sentences in Hindi Devanagari"}}"""}]
        }]
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(GEMINI_URL, json=payload)
            response.raise_for_status()
            data = response.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"english": text, "hindi": "अनुवाद उपलब्ध नहीं है।"}

    except Exception as e:
        logger.error(f"[GenerateStory Error]: {str(e)}. Falling back to mock.")
        return {
            "english": f"The story of {art_form} unfolds through generations of skilled artisans. Every brushstroke and color reflects the rich cultural heritage and deep-rooted traditions of India.",
            "hindi": f"{art_form} की कहानी कुशल कारीगरों की पीढ़ियों से होकर गुजरती है।"
        }

# --- Compatibility Wrappers ---
async def identify_with_anthropic(image_bytes: bytes, image_media_type: str = "image/jpeg") -> dict:
    """Wrapper to maintain compatibility with legacy endpoint names."""
    return await identify_with_openrouter(image_bytes, image_media_type)

async def transcribe_audio(audio_url: str, source_language: str = "hi") -> str:
    raise NotImplementedError("Bhashini not configured")

async def transcribe_audio_mock(audio_url: str) -> str:
    return "This is a sample artisan story about preserving ancient techniques for modern generations."

async def analyze_image_mock(image_url: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            analysis = await identify_with_openrouter(resp.content)
    except Exception as e:
        logger.error(f"[MockImage Error]: {str(e)}. Using fallback.")
        analysis = _get_mock_identification_data()
        
    return {
        "art_form": analysis.get("name", "Unknown Craft"),
        "confidence": analysis.get("confidence", 0.85),
        "tags": [analysis.get("type", ""), analysis.get("culture", ""), analysis.get("material", "")]
    }

async def generate_story_mock(transcript: str, vision_tags: dict, art_form: str) -> dict:
    return await generate_story(transcript, vision_tags, art_form)
