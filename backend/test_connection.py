"""Quick test to check Supabase connection and artisan creation."""
import sys
import traceback
sys.path.insert(0, '.')

from app.core.config import supabase

print("Supabase client:", supabase)

if supabase is None:
    print("ERROR: Supabase client is None — check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

print("\n1. Testing GET /artisans...")
try:
    resp = supabase.table("artisans").select("*").limit(3).execute()
    print("   Success:", resp.data)
except Exception as e:
    print("   FAILED:", type(e).__name__, str(e))
    traceback.print_exc()

print("\n2. Testing INSERT /artisans...")
try:
    data = {"name": "Test User", "phone_number": "+91 9000000001", "upi_id": None}
    resp = supabase.table("artisans").insert(data).execute()
    print("   Success:", resp.data)
    # Clean up
    if resp.data:
        aid = resp.data[0]['id']
        supabase.table("artisans").delete().eq("id", aid).execute()
        print("   Cleaned up test record.")
except Exception as e:
    print("   FAILED:", type(e).__name__, str(e))
    traceback.print_exc()

print("\n3. Testing GET /artisans by phone...")
try:
    resp = supabase.table("artisans").select("*").eq("phone_number", "+91 9000000001").execute()
    print("   Result:", resp.data)
except Exception as e:
    print("   FAILED:", type(e).__name__, str(e))
    traceback.print_exc()
