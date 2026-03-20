"""
mentor.py — KalaSetu AI Mentor
Bilingual (Hindi + English) coaching for artisans.
Rule-based smart analysis — works without any API, always reliable.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/mentor", tags=["mentor"])


class MentorRequest(BaseModel):
    transcript: str
    art_form: str
    story_english: str
    artisan_id: Optional[str] = None


class MentorTip(BaseModel):
    icon: str
    title_en: str
    title_hi: str
    message_en: str
    message_hi: str
    impact: str
    score_boost: int


class MentorResponse(BaseModel):
    story_strength: int
    growth_score: int
    grade: str
    grade_hi: str
    tips: list[MentorTip]
    praise_en: str
    praise_hi: str
    next_goal_en: str
    next_goal_hi: str


def _analyze_transcript(transcript: str, art_form: str) -> MentorResponse:
    tips = []
    score = 40

    t = transcript.lower()
    word_count = len(transcript.split())

    # ── Signal 1: Length
    if word_count < 5:
        tips.append(MentorTip(
            icon="🎤",
            title_en="Tell Us More!",
            title_hi="और बताइए!",
            message_en=f"Your story is only {word_count} words. Try speaking for 20-30 seconds about how you make your craft.",
            message_hi=f"आपकी कहानी केवल {word_count} शब्दों की है। अपनी कला के बारे में 20-30 सेकंड बोलने की कोशिश करें।",
            impact="high",
            score_boost=20
        ))
    elif word_count >= 20:
        score += 15

    # ── Signal 2: Emotion / family words
    emotion_words = ["माँ", "मां", "दादी", "परिवार", "सीखा", "सिखाया", "प्यार",
                     "love", "mother", "family", "grandmother", "taught", "learn",
                     "पीढ़ी", "tradition", "heritage", "passion"]
    found_emotions = any(w in t for w in emotion_words)
    if found_emotions:
        score += 20
        tips.append(MentorTip(
            icon="❤️",
            title_en="Great Emotional Connection!",
            title_hi="बेहतरीन भावनात्मक जुड़ाव!",
            message_en="You mentioned family/tradition — this gets 60% more tips from buyers. Keep sharing these personal stories!",
            message_hi="आपने परिवार/परंपरा का उल्लेख किया — इससे खरीदारों से 60% अधिक टिप्स मिलती हैं। ऐसी व्यक्तिगत कहानियाँ साझा करते रहें!",
            impact="high",
            score_boost=0
        ))
    else:
        tips.append(MentorTip(
            icon="👨‍👩‍👧",
            title_en="Add a Personal Touch",
            title_hi="व्यक्तिगत बात जोड़ें",
            message_en="Mention who taught you this craft or how long your family has been making it. Buyers connect deeply with family stories.",
            message_hi="बताएं कि यह कला आपको किसने सिखाई या आपका परिवार कितने समय से यह बना रहा है। खरीदार पारिवारिक कहानियों से गहरा जुड़ाव महसूस करते हैं।",
            impact="high",
            score_boost=25
        ))

    # ── Signal 3: Location
    location_words = ["गाँव", "गांव", "शहर", "राज्य", "village", "district",
                      "bihar", "rajasthan", "gujarat", "odisha", "maharashtra",
                      "mp", "up", "bengal", "from", "जगह", "यहाँ"]
    found_location = any(w in t for w in location_words)
    if found_location:
        score += 10
        tips.append(MentorTip(
            icon="📍",
            title_en="Location Adds Authenticity!",
            title_hi="स्थान से प्रामाणिकता बढ़ती है!",
            message_en="Mentioning your village/state builds trust with buyers. They love knowing the exact origin of their craft.",
            message_hi="अपना गाँव/राज्य बताने से खरीदारों का विश्वास बढ़ता है। वे जानना चाहते हैं कि उनकी कला कहाँ से आई है।",
            impact="medium",
            score_boost=0
        ))
    else:
        tips.append(MentorTip(
            icon="🗺️",
            title_en="Tell Buyers Where You're From",
            title_hi="खरीदारों को बताएं आप कहाँ से हैं",
            message_en=f"Add your village or state when describing your {art_form}. Geographic origin increases perceived value by 40%.",
            message_hi=f"अपनी {art_form} का वर्णन करते समय अपना गाँव या राज्य बताएं। भौगोलिक उत्पत्ति से मूल्य 40% तक बढ़ जाता है।",
            impact="medium",
            score_boost=15
        ))

    # ── Signal 4: Material / technique
    material_words = ["रंग", "मिट्टी", "धागा", "कपड़ा", "लकड़ी", "धातु", "हाथ",
                      "color", "clay", "thread", "cloth", "wood", "metal", "hand",
                      "brush", "natural", "organic", "traditional", "technique"]
    found_material = any(w in t for w in material_words)
    if found_material:
        score += 10
    else:
        tips.append(MentorTip(
            icon="🎨",
            title_en="Describe Your Materials",
            title_hi="अपनी सामग्री बताएं",
            message_en=f"Tell buyers what materials you use — natural dyes, local clay, organic thread? This justifies premium pricing.",
            message_hi=f"खरीदारों को बताएं कि आप क्या उपयोग करते हैं — प्राकृतिक रंग, स्थानीय मिट्टी, जैविक धागा? इससे उच्च मूल्य उचित लगता है।",
            impact="medium",
            score_boost=10
        ))

    # ── Signal 5: Time / effort
    time_words = ["घंटे", "दिन", "महीना", "साल", "hours", "days", "weeks",
                  "month", "year", "time", "समय", "वक्त"]
    found_time = any(w in t for w in time_words)
    if found_time:
        score += 10
        tips.append(MentorTip(
            icon="⏰",
            title_en="Time Investment Noted!",
            title_hi="समय निवेश बताया!",
            message_en="Mentioning how long it takes builds respect for your craft. Buyers understand the true value of handmade work.",
            message_hi="कितना समय लगता है यह बताने से आपकी कला का सम्मान बढ़ता है। खरीदार हस्तनिर्मित कार्य का सही मूल्य समझते हैं।",
            impact="medium",
            score_boost=0
        ))
    else:
        tips.append(MentorTip(
            icon="⏳",
            title_en="Share Your Time Investment",
            title_hi="अपना समय निवेश बताएं",
            message_en="Tell buyers how many hours or days this craft takes. It helps them understand the true value of handmade work.",
            message_hi="खरीदारों को बताएं कि इस कला में कितने घंटे या दिन लगते हैं। इससे उन्हें हस्तनिर्मित कार्य का असली मूल्य पता चलता है।",
            impact="low",
            score_boost=10
        ))

    score = min(score, 100)

    # ── Grade
    if score >= 80:
        grade, grade_hi = "Master", "उस्ताद"
        praise_en = f"🏆 Exceptional storytelling! Your {art_form} story is compelling and will attract serious buyers."
        praise_hi = f"🏆 अद्भुत कहानी! आपकी {art_form} की कहानी बहुत प्रभावशाली है और गंभीर खरीदारों को आकर्षित करेगी।"
        next_goal_en = "You're a Master storyteller! Focus on recording in a quiet place for even clearer audio."
        next_goal_hi = "आप एक उस्ताद कहानीकार हैं! और स्पष्ट ऑडियो के लिए शांत जगह पर रिकॉर्ड करें।"
    elif score >= 60:
        grade, grade_hi = "Expert", "विशेषज्ञ"
        praise_en = f"⭐ Great story! Your {art_form} narrative connects well with buyers."
        praise_hi = f"⭐ बढ़िया कहानी! आपकी {art_form} की कहानी खरीदारों से अच्छा जुड़ाव बनाती है।"
        next_goal_en = "Add one personal memory about learning this craft to reach Master level."
        next_goal_hi = "इस कला सीखने की एक व्यक्तिगत याद जोड़ें और उस्ताद स्तर तक पहुँचें।"
    elif score >= 40:
        grade, grade_hi = "Rising", "उभरता सितारा"
        praise_en = f"👍 Good start! Your {art_form} story has real potential."
        praise_hi = f"👍 अच्छी शुरुआत! आपकी {art_form} की कहानी में वास्तविक क्षमता है।"
        next_goal_en = "Mention your family connection and location to boost your score significantly."
        next_goal_hi = "अपना पारिवारिक संबंध और स्थान बताएं — इससे आपका स्कोर काफी बढ़ेगा।"
    else:
        grade, grade_hi = "Beginner", "शुरुआती"
        praise_en = f"🌱 Every master started here! Your {art_form} journey begins with this first story."
        praise_hi = f"🌱 हर उस्ताद यहीं से शुरू हुआ! आपकी {art_form} की यात्रा इस पहली कहानी से शुरू होती है।"
        next_goal_en = "Try speaking for 20 seconds about who taught you this craft and where you learned it."
        next_goal_hi = "20 सेकंड बोलने की कोशिश करें — किसने यह कला सिखाई और कहाँ सीखी।"

    growth_score = min(
        (word_count * 2) +
        (20 if found_emotions else 0) +
        (15 if found_location else 0) +
        (10 if found_material else 0) +
        (10 if found_time else 0),
        100
    )

    actionable = sorted([t for t in tips if t.score_boost > 0], key=lambda x: -x.score_boost)
    praise_tips = [t for t in tips if t.score_boost == 0]
    final_tips = (praise_tips + actionable)[:4]

    return MentorResponse(
        story_strength=score,
        growth_score=growth_score,
        grade=grade,
        grade_hi=grade_hi,
        tips=final_tips,
        praise_en=praise_en,
        praise_hi=praise_hi,
        next_goal_en=next_goal_en,
        next_goal_hi=next_goal_hi,
    )


@router.post("/analyze", response_model=MentorResponse)
async def analyze_story(req: MentorRequest):
    try:
        if not req.transcript or not req.transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript is required")
        return _analyze_transcript(req.transcript, req.art_form)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{artisan_id}")
async def get_artisan_stats(artisan_id: str):
    try:
        from app.core.config import supabase
        artifacts = supabase.table("artifacts").select("id, created_at, art_form").eq(
            "artisan_id", artisan_id).execute()
        artifact_ids = [a["id"] for a in (artifacts.data or [])]
        stories_data = []
        if artifact_ids:
            stories = supabase.table("stories").select(
                "raw_transcript, is_approved, created_at"
            ).in_("artifact_id", artifact_ids).execute()
            stories_data = stories.data or []
        tips = supabase.table("transactions").select("amount, status").eq(
            "artisan_id", artisan_id).eq("status", "Success").execute()
        total_tips = sum(float(t["amount"]) for t in (tips.data or []))
        approved_stories = len([s for s in stories_data if s.get("is_approved")])
        strengths = []
        for s in stories_data:
            if s.get("raw_transcript"):
                analysis = _analyze_transcript(s["raw_transcript"], "Indian Craft")
                strengths.append(analysis.story_strength)
        avg_strength = int(sum(strengths) / len(strengths)) if strengths else 0
        return {
            "total_artifacts": len(artifacts.data or []),
            "approved_stories": approved_stories,
            "total_tips_received": total_tips,
            "average_story_strength": avg_strength,
            "art_forms": list(set(
                a["art_form"] for a in (artifacts.data or []) if a.get("art_form")
            )),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
