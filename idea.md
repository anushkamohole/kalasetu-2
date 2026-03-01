Track Name AI for Social Good
Problem Statement
India’s diverse cultural heritage faces a silent crisis: a "trust deficit" where
artifacts are easily faked, and the hands that create them remain invisible.
While we have over 400 GI-tagged crafts, the rural artisans behind them are
digitally silenced by literacy barriers, leaving their stories untold and their
work undervalued.
We believe an artisan’s heritage should be a bridge, not a barrier. By
transforming a simple voice note into a soulful narrative and a physical scan
into a human connection, we move beyond the transaction. Our platform
ensures that when a craft is sold, the story isn't lost, it’s heard. We are
finally letting the hands behind the craft speak for themselves.
NEED:
1. Preservation of Culture: Creating a "Digital Identity" to record geographic origin,
materials, and techniques before they are lost to time.
2. Economic Empowerment (Vocal for Local): Elevating the value of authentic crafts
on the global stage by backing the "Made in India" tag with verifiable data.
3. GI Tag Protection: Shielding India's billions in handicraft revenue from
mass-produced replicas through secure digital tagging.
4. Closing the Tech Gap: Providing a "Voice-First" interface for artisans who cannot
IDEA DESCRIPTION:
KalaSetu is a "Phygital" (Physical + Digital) ecosystem designed to de-commoditize Indian
handicrafts. It bridges the gap between the silent artisan and the curious consumer
through four pillars:
1. Voice-First Digitization: Artisans record stories in native dialects; AI (Bhashini +
Gemini) transforms them into polished narratives.
2. Human-in-the-loop: The polished narratives reach the customers once they are
approved by the artists.
3. The "Living Tag": Unique QR codes attached to products act as "Digital Passports,"
allowing buyers to hear the artisan’s voice and see the product’s journey.
4. AI Craft Discovery: A camera based "lens" feature that uses Computer Vision to
identify art forms (e.g., Warli vs. Madhubani) from a photo.
5. Economy of Gratitude: A direct micro-tipping model (UPI) for "Buying the artist a
chai," creating a direct emotional and financial bond.
6. A Friendly Marketplace: Customers receive artisan’s contact id and address and can
SOLUTION AND PROTOTYPE:
KalaSetu is a phygital
authentication engine that
converts artisan voices and craft
visuals into verifiable digital
identities, addressing three gaps:
authenticity (AI-powered visual
fingerprinting), accessibility
(zero-literacy voice interfaces), and
emotional commerce (embedded
maker narratives).
The prototype architecture is built
on real-time intelligence
orchestration—where regional
speech recognition (Bhashini),
computer vision (Google Vision
API), and generative AI (Gemini 1.5
Flash) work in concert to create
artifact-specific digital passports.
Unlike platforms that commoditize
crafts, KalaSetu transforms transactions into cultural witnessing, initiating human
connections across geographies and economic divides.
WORKING:
1. The Ingestion: Artisan records a voice note via the React.js interface. FastAPI
sanitizes the data and resizes images using Pillow.
2. The Intelligence Chain:
○ Bhashini converts regional speech to text.
○ Google Vision identifies visual patterns (strokes/motifs).
○ Gemini 1.5 Flash "weaves" these into a bilingual (Hindi/English) emotive
narrative.
3. The Connection: Metadata is stored in Supabase. A unique QR is generated.
4. The Interaction: When a buyer scans the tag, the React frontend fetches the data,
renders the Artisan Map (Google Maps API), and enables direct UPI payments via
Razorpay.
DESCRIPTION OF COMPONENTS/TOOLS:
● Frontend: React.js + Tailwind CSS (Fast, responsive UI).
● Backend: Python (FastAPI) (High-speed asynchronous orchestration).
● Intelligence: Gemini 1.5 Flash (Creative synthesis), Bhashini(Regional Speech),
Google Vision API (Image classification).
● Database & Storage: Supabase (PostgreSQL for metadata, Cloud storage for
assets).
● Payments: Razorpay / UPI Intent Flow.
● Discovery: Typesense (Lightning-fast search)
ADVANTAGES OVER PRESENT IDEAS:
1. Meaning over Marketplace: Transforms a transaction into a partnership; users buy
the story, not just the pot.
2. Inclusive Tech: Removes the literacy barrier. If you can speak, you can sell.
3. The ArtSnap Feature: Captures the "curious tourist" market by identifying art from
photos, unlike competitors who require text searches.
4. AI Impact Engine: Provides artisans with "AI Mentorship" (e.g., "Stories with your
face get 30% more tips"), helping them grow as digital storytellers.
5. Human-Centric Support: Separates "buying" from "supporting" through a
micro-tipping model that builds dignity rather than charity. 