import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")
GOOGLE_VISION_API_KEY: str = os.environ.get("GOOGLE_VISION_API_KEY", "")
BHASHINI_API_KEY: str = os.environ.get("BHASHINI_API_KEY", "")
RAZORPAY_KEY_ID: str = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET: str = os.environ.get("RAZORPAY_KEY_SECRET", "")
APP_BASE_URL: str = os.environ.get("APP_BASE_URL", "http://localhost:5173")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_KEY else None

GOOGLE_API_KEY: str = os.environ.get("GOOGLE_API_KEY", "")
OPENROUTER_API_KEY: str=os.environ.get("OPENROUTER_API_KEY", "")