"""
Tips (Razorpay) Routes - Micro-tipping flow for buyers
"""
import hmac, hashlib
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import TipRequest, TipOrderResponse
from app.core.config import supabase, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

router = APIRouter(prefix="/tips", tags=["tips"])


@router.post("/create-order", response_model=TipOrderResponse)
async def create_tip_order(tip: TipRequest):
    """
    Creates a Razorpay order for the tip amount.
    In production, call razorpay.order.create(). Here we mock the order ID.
    Replace with: import razorpay; client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
    """
    try:
        # Fetch artisan details
        artisan = supabase.table("artisans").select("*").eq("id", tip.artisan_id).single().execute()
        if not artisan.data:
            raise HTTPException(status_code=404, detail="Artisan not found")

        artisan_data = artisan.data
        amount_paise = int(tip.amount * 100)

        # MOCK: In production replace with Razorpay SDK call
        mock_order_id = f"order_MOCK_{tip.artisan_id[:8].upper()}"

        # Record pending transaction in DB
        supabase.table("transactions").insert({
            "artifact_id": tip.artifact_id,
            "artisan_id": tip.artisan_id,
            "amount": tip.amount,
            "status": "Pending",
            "razorpay_order_id": mock_order_id,
        }).execute()

        return TipOrderResponse(
            order_id=mock_order_id,
            amount=amount_paise,
            currency="INR",
            artisan_name=artisan_data["name"],
            upi_id=artisan_data.get("upi_id"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """
    Razorpay webhook handler — verifies payment signature and marks transaction as Success.
    In production, register this URL in the Razorpay Dashboard → Webhooks.
    """
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    expected_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = await request.json()
    event = payload.get("event")

    if event == "payment.captured":
        order_id = payload["payload"]["payment"]["entity"]["order_id"]
        supabase.table("transactions").update({"status": "Success"}).eq("razorpay_order_id", order_id).execute()
        return {"status": "ok"}

    return {"status": "ignored", "event": event}
