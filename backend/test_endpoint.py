"""Test that exactly replicates the create_artisan endpoint logic."""
import sys
import traceback
sys.path.insert(0, '.')

from app.core.config import supabase
from app.models.schemas import ArtisanCreate, ArtisanResponse

# Test data that would come from ArtisanCreate
test_data = {"name": "Rekha Devi", "phone_number": "+91 9876543210", "upi_id": ""}

print("Test 1: model_dump with empty upi_id...")
artisan = ArtisanCreate(**test_data)
data = artisan.model_dump()
print("  Dumped data:", data)

print("\nTest 2: insert into Supabase...")
try:
    response = supabase.table("artisans").insert(data).execute()
    print("  Response data:", response.data)
    if response.data:
        print("  SUCCESS - inserted:", response.data[0])
        # Immediate cleanup
        supabase.table("artisans").delete().eq("id", response.data[0]["id"]).execute()
        print("  Cleaned up.")
    else:
        print("  No data in response - this is the issue!")
except Exception as e:
    print(f"  INSERT EXCEPTION: {type(e).__name__}: {e}")
    traceback.print_exc()
    
    print("\nTest 3: fallback - get by phone...")
    try:
        existing = supabase.table("artisans").select("*").eq("phone_number", "+91 9876543210").single().execute()
        print("  Existing data:", existing.data)
    except Exception as e2:
        print(f"  FALLBACK EXCEPTION: {type(e2).__name__}: {e2}")
        traceback.print_exc()

print("\nTest 4: schema validation roundtrip...")
sample = {
    "id": "test-uuid",
    "phone_number": "+91 9876543210",
    "name": "Rekha Devi",
    "location_lat": None,
    "location_long": None,
    "state": None,
    "upi_id": None,
    "created_at": "2024-01-01T00:00:00Z",
}
try:
    resp = ArtisanResponse(**sample)
    print("  ArtisanResponse validated OK:", resp.id)
except Exception as e:
    print(f"  ArtisanResponse FAILED: {e}")
