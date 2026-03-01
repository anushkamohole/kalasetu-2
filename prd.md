# KalaSetu - Product Requirements Document (PRD) & Execution Plan

## System Overview
**Problem:** India's diverse cultural heritage faces a "trust deficit" where authentic artifacts are easily faked by mass-produced replicas. Meanwhile, the rural artisans who craft them remain digitally silenced due to literacy barriers, leaving their stories untold and work undervalued.

**Solution:** KalaSetu is a "Phygital" (Physical + Digital) authentication ecosystem designed to de-commoditize Indian handicrafts. The platform bridges the gap between the silent artisan and the consumer by translating artisan voices and craft visuals into verifiable digital passports ("Living Tags"). By replacing purely transactional commerce with cultural witnessing, KalaSetu ensures authenticity, accessibility (zero-literacy voice interfaces), and emotional connection through embedded maker narratives and direct micro-tipping.

---

## Tech Stack Definition
* **Frontend:** React.js and Tailwind CSS (Progressive Web App, fast, responsive UI).
* **Backend:** Python (FastAPI) (High-speed asynchronous orchestration).
* **Database & Storage:** Supabase (PostgreSQL for structured metadata, Cloud Storage for media assets).
* **AI & External Services:**
  * **Bhashini:** Regional speech-to-text capability.
  * **Google Vision API:** Computer vision for image classification and stroke/motif recognition.
  * **Gemini 1.5 Flash:** Creative synthesis for weaving inputs into polished bilingual narratives.
  * **Razorpay / UPI Intent Flow:** Direct micro-tipping and standard payments.
  * **Typesense:** Fast semantic search for artisan discovery.
  * **Google Maps API:** Rendering artisan locations.

---

## Core User Flows (Detailed Breakdown)

### 1. Artisan Flow (Onboarding & Digitization)
* **Login/Authentication:** Number-based OTP login designed for low literacy.
* **Product Addition:** Artisan selects an overarching product category (if any).
* **Photo & Audio Capture:**
  * Artisan uses the app to take/upload a photo of the completed handicraft.
  * Artisan records a raw voice note narrating the process or story in their native dialect.
* **The Intelligence Chain (Processing):**
  * Image is resized (Pillow) and analyzed by Google Vision API to extract patterns and identify art forms.
  * Voice note is transcribed directly by Bhashini.
  * Gemini 1.5 Flash merges visual tags and transcripts into an emotive, polite bilingual (Hindi/English) narrative.
* **Approval & Generation:**
  * The resulting story draft is presented/played back to the artisan for approval (Human-in-the-loop).
  * Unique "Living Tag" (QR Code) is generated, linking to the specific product entry in Supabase.

### 2. Buyer Scan Flow (PWA Experience)
* **QR Scan:** Buyer scans the product’s QR tag using a standard smartphone camera.
* **Product Story Page Rendering:** A responsive React UI fetches data from FastAPI/Supabase and displays:
  * High-res imagery of the product.
  * The verified AI-generated story.
  * Artisan Map (Google Maps API) showing geographic origin.
* **Audio Playback:** User can optionally listen to the original raw voice note or the AI-generated polished reading.
* **Tipping Modal:** App surfaces a "Buy the artist a chai" prompt for direct tipping to the artisan via Razorpay/UPI integration.

### 3. AI Lens/Shazam Flow (ArtSnap Discovery)
* **Image Upload:** A user (such as a curious tourist or potential buyer) snaps a photo of an unidentified craft without scanning a QR.
* **Recognition Result:** Google Vision API evaluates the visual footprint to identify the specific art form (e.g., Warli vs. Madhubani).
* **Artisan Recommendation:** Based on recognized aesthetic classification, the platform queries Typesense to suggest background context on the craft, and recommends authentic artisans producing that style, closing the connection loop.

---

## Data Models (Supabase/PostgreSQL)

**`artisans`**
* `id` (UUID, Primary Key)
* `phone_number` (String, Unique)
* `name` (String)
* `location_lat` / `location_long` (Float)
* `upi_id` (String)
* `created_at` (Timestamp)

**`artifacts`**
* `id` (UUID, Primary Key)
* `artisan_id` (UUID, Foreign Key -> `artisans.id`)
* `art_form` (String, e.g., "Warli")
* `image_url` (String)
* `qr_code_url` (String)
* `created_at` (Timestamp)

**`stories`**
* `id` (UUID, Primary Key)
* `artifact_id` (UUID, Foreign Key -> `artifacts.id`)
* `original_voice_note_url` (String)
* `raw_transcript` (Text)
* `generated_narrative_english` (Text)
* `generated_narrative_hindi` (Text)
* `vision_tags` (JSONB)
* `is_approved` (Boolean)

**`transactions`**
* `id` (UUID, Primary Key)
* `artifact_id` (UUID, Foreign Key -> `artifacts.id`)
* `artisan_id` (UUID, Foreign Key -> `artisans.id`)
* `amount` (Decimal)
* `status` (Enum: 'Pending', 'Success', 'Failed')
* `razorpay_order_id` (String)

---

## Execution Task List

### Phase 1: Environment & Database Setup
1. **Repository Setup:** Scaffold React/Tailwind frontend project and FastAPI backend project. Update environment configurations (`.env`).
2. **Supabase Initialization:** Create Supabase project, initialize PostgreSQL tables (`artisans`, `artifacts`, `stories`, `transactions`).
3. **Storage Buckets:** Configure Supabase Storage buckets for `artifact_images`, `voice_notes`, and `qr_codes` with appropriate access policies.

### Phase 2: Backend API & AI Service Mocking
1. **Core API Routes (FastAPI):** Build standard CRUD endpoints for Artisan profiles and base Artifact creation.
2. **Media Handlers:** Implement image resizing (Python Pillow) and upload controllers handling multipart form data.
3. **AI Integration Orchestration (`POST /api/artifacts/process`):**
   * Integrate Bhashini for speech transcription.
   * Integrate Google Vision API for image feature extraction.
   * Integrate Gemini 1.5 Flash with custom prompt context to synthesize transcript + tags into the final narrative.
4. **Tag Generation:** Write utility endpoint that generates a secure, scan-ready QR code linked to the artifact's unique URL schema (e.g., `kalasetu.in/scan/{id}`).

### Phase 3: Frontend UI Components
1. **Artisan Intake App:** Build mobile-responsive layout and the multi-step ingest form (Photo Capture -> Voice Node Record -> Submit).
2. **AI Review Screen:** Build the component for the artisan to review the Gemini-generated story ("Human-in-the-loop" approval state).
3. **Buyer PWA Page:** Create the unauthenticated artifact viewing rendering page (`/scan/{id}`), displaying details, rendered Maps tile, and playback controls.
4. **ArtSnap Lens UI:** Build the camera/upload interface for visual discovery, loading states, and result tiles.

### Phase 4: API Integration & Payment Flow
1. **State Wiring:** Connect the frontend React state directly to the FastAPI orchestration endpoints using Axios/Fetch. Show success states for QR generation and Artisan approval.
2. **Razorpay Tipping Functionality:**
   * Backend: Generate Razorpay Order IDs (`/api/tip/create`).
   * Frontend: Call Razorpay Checkout SDK with artisan's direct details.
   * Backend: Create robust Webhook handler to reconcile successful transactions in the `transactions` table.
3. **Typesense Mapping:** Implement script syncing Supabase artifacts to Typesense for millisecond response times on ArtSnap visual similarity matches.

---

## Test Requirements (For TestSprite QA)

### 1. Artisan Flow (Data Ingestion Pipeline)
* **Goal:** Verify media ingestion and AI enrichment.
* **Test Case:** Submit mock voice `.wav` and mock artifact `.jpg`.
* **Validation:** Endpoint returns `200 OK`; Supabase stores image/audio URLs; `stories` table populates with transcript, vision tags, and translated narrative; QR URL is returned and valid.

### 2. Buyer Scan Flow (Frontend PWA)
* **Goal:** Verify QR resolution and content hydrated accurately.
* **Test Case:** Send HTTP GET request or navigate browser to `/scan/{valid_artifact_uuid}`.
* **Validation:** Page successfully fetches metadata; Story maps 1:1 with DB values; Audio player triggers the correct `.wav` URI; Maps component renders corresponding coordinates.

### 3. AI Lens/Shazam Flow (ArtSnap Feature)
* **Goal:** Verify classification matches intent and surfaces artisans.
* **Test Case:** Upload a test image of "Warli Art" to Lens endpoint.
* **Validation:** Google Vision matches keyword `Warli`; backend successfully queries Typesense/Supabase to return relevant artisan profiles and sample work array.

### 4. Direct Micro-Tipping Flow
* **Goal:** Verify seamless financial gratification mechanism.
* **Test Case:** Initiate a INR ₹50 tip from the Buyer PWA.
* **Validation:** Razorpay order object is returned successfully. Upon webhook mock trigger (`payment.captured`), the `transactions` table updates status to "Success".
