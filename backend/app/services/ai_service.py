"""
KalaSetu AI Services
- Bhashini: Regional speech-to-text
- Google Vision API: Image classification (REST-based)
- Gemini 1.5 Flash: Bilingual story generation

Each function falls back to the mock if the API key is not configured,
so the app remains fully functional during local development without keys.
"""
import random
import os
import base64
import httpx

# Loaded from environment via config
from app.core.config import GEMINI_API_KEY, GOOGLE_VISION_API_KEY, BHASHINI_API_KEY

# ─── Gemini SDK import (only used if key is present) ─────────────────────────
try:
    import google.generativeai as genai
    if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    else:
        _gemini_model = None
except ImportError:
    _gemini_model = None


# ─── Mock fallback data ───────────────────────────────────────────────────────
_MOCK_TRANSCRIPTS = [
    "Yeh mitti meri dadi ne sikhaya tha. Hum Rajasthan ke jungle se mitti laate hain aur usse teen din bhigokar rakhhte hain.",
    "Yeh Warli painting mera gaon ki kahani batata hai. Mere haath se har rekha ek sapna hai.",
    "Madhubani ki yeh kala hamare parivaar mein seedha hamare nana ne sikhaya tha. Rang hum apne ghar ke phool se banaate hain.",
]

_MOCK_ART_FORMS = [
    {"art_form": "Warli", "confidence": 0.92, "tags": ["tribal", "geometric", "folk", "Maharashtra"]},
    {"art_form": "Madhubani", "confidence": 0.88, "tags": ["intricate", "floral", "Bihar", "natural-dyes"]},
    {"art_form": "Blue Pottery", "confidence": 0.85, "tags": ["ceramic", "turquoise", "Jaipur", "Persian"]},
    {"art_form": "Dhokra", "confidence": 0.90, "tags": ["metal", "lost-wax", "tribal", "Chhattisgarh"]},
    {"art_form": "Pattachitra", "confidence": 0.87, "tags": ["scroll", "mythological", "Odisha", "palm-leaf"]},
]


# ─────────────────────────────────────────────────────────────────────────────
# 1. BHASHINI — Speech-to-Text
# ─────────────────────────────────────────────────────────────────────────────
async def transcribe_audio(audio_url: str, source_language: str = "hi") -> str:
    """
    Transcribes a voice note URL using the Bhashini ASR pipeline.
    Falls back to a mock transcript if the API key is not configured.

    Bhashini ASR endpoint reference:
    POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline
    """
    if not BHASHINI_API_KEY or BHASHINI_API_KEY.startswith("your_"):
        return random.choice(_MOCK_TRANSCRIPTS)

    try:
        # Fetch the audio bytes from Supabase storage URL
        async with httpx.AsyncClient(timeout=30) as client:
            audio_resp = await client.get(audio_url)
            audio_b64 = base64.b64encode(audio_resp.content).decode("utf-8")

        payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": source_language},
                        "serviceId": "",  # Will be resolved by Bhashini's ULCA
                        "audioFormat": "wav",
                        "samplingRate": 16000,
                    },
                }
            ],
            "inputData": {
                "audio": [{"audioContent": audio_b64}]
            },
        }
        headers = {
            "Authorization": BHASHINI_API_KEY,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            transcript = data["pipelineResponse"][0]["output"][0]["source"]
            return transcript

    except Exception as e:
        print(f"[Bhashini] Transcription failed ({e}), using mock.")
        return random.choice(_MOCK_TRANSCRIPTS)


# ─────────────────────────────────────────────────────────────────────────────
# 2. GOOGLE VISION API — Image classification
# ─────────────────────────────────────────────────────────────────────────────
async def analyze_image(image_url: str) -> dict:
    """
    Calls Google Cloud Vision API to extract labels from a crafted image URL.
    Falls back to mock data if the key is not configured.
    
    Uses the Vision REST API with a sourceImageUri (no binary upload needed
    since images are already on a public Supabase URL).
    """
    if not GOOGLE_VISION_API_KEY or GOOGLE_VISION_API_KEY.startswith("your_"):
        return random.choice(_MOCK_ART_FORMS)

    try:
        endpoint = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"
        payload = {
            "requests": [
                {
                    "image": {"source": {"imageUri": image_url}},
                    "features": [
                        {"type": "LABEL_DETECTION", "maxResults": 15},
                        {"type": "WEB_DETECTION", "maxResults": 5},
                    ],
                }
            ]
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            result = response.json()

        labels = result["responses"][0].get("labelAnnotations", [])
        web_entities = result["responses"][0].get("webDetection", {}).get("webEntities", [])

        # Map Vision labels to known Indian handicraft styles
        CRAFT_KEYWORDS = {
            "Warli": ["warli", "tribal", "folk art", "white figures", "geometric"],
            "Madhubani": ["madhubani", "mithila", "bihar painting", "floral", "intricate"],
            "Pattachitra": ["pattachitra", "scroll painting", "odisha", "mythology"],
            "Blue Pottery": ["pottery", "ceramic", "blue glaze", "jaipur", "persian"],
            "Dhokra": ["dhokra", "metal casting", "brass", "tribal", "lost wax"],
            "Kalamkari": ["kalamkari", "hand painted", "cotton", "vegetable dye"],
        }

        all_text = " ".join(
            [l["description"].lower() for l in labels] +
            [e.get("description", "").lower() for e in web_entities]
        )

        detected_form = "Unknown Craft"
        best_score = 0.0
        for craft, keywords in CRAFT_KEYWORDS.items():
            hits = sum(1 for kw in keywords if kw in all_text)
            if hits > best_score:
                best_score = hits
                detected_form = craft

        # Confidence: based on top Vision label score
        top_confidence = labels[0]["score"] if labels else 0.75
        tags = [l["description"] for l in labels[:6]]

        return {
            "art_form": detected_form,
            "confidence": round(top_confidence, 3),
            "tags": tags,
        }

    except Exception as e:
        print(f"[Google Vision] Analysis failed ({e}), using mock.")
        return random.choice(_MOCK_ART_FORMS)


# ─────────────────────────────────────────────────────────────────────────────
# 3. GEMINI 1.5 FLASH — Bilingual story generation
# ─────────────────────────────────────────────────────────────────────────────
async def generate_story(transcript: str, vision_tags: dict, art_form: str) -> dict:
    """
    Uses Gemini 1.5 Flash to weave the artisan's raw transcript + visual tags
    into a polished, emotive bilingual (English + Hindi) narrative.
    Falls back to a templated mock if the API key is not configured.
    """
    if not _gemini_model:
        # Graceful mock
        english = (
            f"This exquisite piece of **{art_form}** art carries within it the echoes of generations. "
            f"The artisan's own words paint a vivid picture: \"{transcript[:80]}...\" "
            f"Created using techniques passed down through centuries, each stroke tells a story of heritage, "
            f"resilience, and a deep reverence for the land that inspired it. "
            f"Notice the {', '.join(vision_tags.get('tags', ['intricate'])[:2])} motifs — "
            f"every element is intentional, every color a conversation with tradition."
        )
        hindi = (
            f"यह {art_form} कला की अनमोल कृति पीढ़ियों की गूंज को अपने में समेटे है। "
            f"कलाकार के अपने शब्दों में: \"{transcript[:60]}...\" "
            f"सदियों से चली आ रही परंपरा से सीखी इस विधा में, हर रेखा एक कहानी कहती है।"
        )
        return {"english": english, "hindi": hindi}

    prompt = f"""
You are a poetic cultural storyteller for KalaSetu, a platform that brings Indian artisans to the world.

An artisan who creates **{art_form}** art has shared their story in their regional language. 
Your task is to craft a moving, human-centered narrative that a buyer will read when they scan the product's QR code.

**Artisan's raw words (transcribed):**
"{transcript}"

**Visual analysis of the craft (what AI saw in the image):**
Art Style: {art_form}
Visual Tags: {', '.join(vision_tags.get('tags', []))}

**Instructions:**
- Write TWO versions: one in English, one in Hindi (Devanagari script).
- English version: 3-4 sentences. Warm, evocative, personal. Start with the artisan's voice, then zoom out to heritage.
- Hindi version: 2-3 sentences in natural, simple Hindi. Use the artisan's core sentiment.
- Do NOT use generic phrases like "skilled artisan" or "beautiful craft". Make it feel real and specific.
- Do NOT fabricate facts. Only use what's in the transcript and visual tags.
- Return your response as a JSON object with two keys: "english" and "hindi".
- Return ONLY the JSON object, no surrounding text.
"""

    try:
        response = _gemini_model.generate_content(prompt)
        text = response.text.strip()

        # Parse the JSON from Gemini's response
        import json, re
        # Strip any markdown code fences Gemini might wrap around it
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return {
                "english": parsed.get("english", ""),
                "hindi": parsed.get("hindi", ""),
            }
        else:
            raise ValueError("No JSON block found in Gemini response")

    except Exception as e:
        print(f"[Gemini] Story generation failed ({e}), using template.")
        english = (
            f"This piece of {art_form} carries within it the echoes of generations. "
            f"\"{transcript[:100].strip()}...\" Each stroke is a conversation with tradition."
        )
        hindi = f"यह {art_form} कला की कृति पीढ़ियों की गूंज को समेटे है। \"{transcript[:60].strip()}...\""
        return {"english": english, "hindi": hindi}


# ─────────────────────────────────────────────────────────────────────────────
# Legacy mock aliases (kept for test compatibility)
# ─────────────────────────────────────────────────────────────────────────────
async def transcribe_audio_mock(audio_url: str) -> str:
    return await transcribe_audio(audio_url)


async def analyze_image_mock(image_url: str) -> dict:
    return await analyze_image(image_url)


async def generate_story_mock(transcript: str, vision_tags: dict, art_form: str) -> dict:
    return await generate_story(transcript, vision_tags, art_form)
