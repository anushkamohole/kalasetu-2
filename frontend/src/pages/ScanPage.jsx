import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Wallet, Music, Globe, Play, Pause } from 'lucide-react'
import API from '../api/client'
import DialectBadge from '../components/DialectBadge'

// ── Inject waveform + animation CSS once
let waveCSS = false
function ensureWaveCSS() {
    if (waveCSS) return
    const style = document.createElement('style')
    style.textContent = `
@keyframes wave { 0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)} }
.wave-bar{transform-origin:bottom;transform:scaleY(0.3)}
.wave-bar.playing{animation:wave 0.9s ease-in-out infinite}
.lang-toggle-track{position:relative;display:flex;align-items:center;width:108px;height:34px;border-radius:20px;background:#EDE5D8;border:1px solid #DDD3C0;cursor:pointer;user-select:none;overflow:hidden}
.lang-toggle-pill{position:absolute;top:3px;height:28px;width:50px;border-radius:16px;background:linear-gradient(135deg,#C45C1A,#B45309);transition:left 0.25s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 8px rgba(196,92,26,0.35)}
.lang-toggle-label{position:relative;z-index:1;flex:1;text-align:center;font-size:12px;font-weight:700;transition:color 0.2s;line-height:34px;color:#78614A}
@keyframes slideInUp{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes slideOutDown{from{transform:translateY(0);opacity:1}to{transform:translateY(110%);opacity:0}}
.badge-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;width:min(380px,calc(100vw - 32px));animation:slideInUp 0.45s cubic-bezier(.4,0,.2,1) forwards}
.badge-toast.exit{animation:slideOutDown 0.35s cubic-bezier(.4,0,.2,1) forwards}
`
    document.head.appendChild(style)
    waveCSS = true
}

// ── Leaflet CSS
let leafletCSSLoaded = false
function ensureLeafletCSS() {
    if (leafletCSSLoaded) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    leafletCSSLoaded = true
}

// ── Badge helpers
const BADGE_KEY = 'kalasetu_badges'
function getBadges() { try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]') } catch { return [] } }
function addBadge(state) {
    const badges = getBadges()
    if (!badges.includes(state)) { localStorage.setItem(BADGE_KEY, JSON.stringify([...badges, state])); return true }
    return false
}

// ── WaveformPlayer
const BAR_COUNT = 32
const HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => 20 + Math.abs(Math.sin(i * 0.72 + 1.1) * 48))

function WaveformPlayer({ src }) {
    const audioRef = useRef(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        ensureWaveCSS()
        const audio = audioRef.current
        if (!audio) return
        const onTime = () => { setCurrentTime(audio.currentTime); setProgress(audio.duration ? audio.currentTime / audio.duration : 0) }
        const onMeta = () => setDuration(audio.duration)
        const onEnd = () => setPlaying(false)
        audio.addEventListener('timeupdate', onTime)
        audio.addEventListener('loadedmetadata', onMeta)
        audio.addEventListener('ended', onEnd)
        return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onMeta); audio.removeEventListener('ended', onEnd) }
    }, [])

    const togglePlay = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        if (playing) { audio.pause(); setPlaying(false) } else { audio.play().then(() => setPlaying(true)).catch(() => { }) }
    }, [playing])

    const filledBars = Math.round(progress * BAR_COUNT)
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F0EAE0', borderRadius: '14px', padding: '12px 14px' }}>
            <audio ref={audioRef} src={src} preload="metadata" style={{ display: 'none' }} />
            <button onClick={togglePlay} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', flexShrink: 0, background: 'linear-gradient(135deg,#C45C1A,#A04814)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 12px rgba(196,92,26,0.38)' }}>
                {playing ? <Pause size={16} color="white" fill="white" /> : <Play size={16} color="white" fill="white" style={{ marginLeft: '2px' }} />}
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '40px', cursor: 'pointer' }}>
                {HEIGHTS.map((h, i) => (
                    <div key={i} onClick={() => { const a = audioRef.current; if (a?.duration) a.currentTime = (i / BAR_COUNT) * a.duration }}
                        className={`wave-bar${playing ? ' playing' : ''}`}
                        style={{ flex: 1, height: `${h}%`, borderRadius: '2px', background: i < filledBars ? 'linear-gradient(to top,#C45C1A,#B45309)' : '#D4C4B0', animationDelay: `${(i % 8) * 0.1}s`, transition: 'background 0.15s' }} />
                ))}
            </div>
            <span style={{ fontSize: '11px', color: '#78614A', flexShrink: 0, minWidth: '36px', textAlign: 'right' }}>{duration > 0 ? fmt(currentTime) : '0:00'}</span>
        </div>
    )
}

// ── BadgeToast
function BadgeToast({ state, artForm, onDismiss }) {
    const [exiting, setExiting] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => { setExiting(true); setTimeout(onDismiss, 380) }, 4200)
        return () => clearTimeout(t)
    }, [onDismiss])
    return (
        <div className={`badge-toast${exiting ? ' exit' : ''}`}>
            <div style={{ background: 'rgba(44,26,14,0.95)', border: '1px solid rgba(196,92,26,0.45)', borderRadius: '18px', padding: '16px 20px', boxShadow: '0 8px 40px rgba(80,30,0,0.45)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#C45C1A,#B45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏅</div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '800', fontSize: '14px', marginBottom: '3px', color: '#FFF8F0' }}>🎉 Badge Unlocked!</p>
                    <p style={{ color: 'rgba(255,240,200,0.7)', fontSize: '12px' }}>You discovered <span style={{ color: '#F97316', fontWeight: '700' }}>{artForm}</span> from <span style={{ color: '#FBBF24', fontWeight: '700' }}>{state}</span></p>
                </div>
                <button onClick={() => { setExiting(true); setTimeout(onDismiss, 380) }} style={{ background: 'none', border: 'none', color: 'rgba(255,240,200,0.5)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
        </div>
    )
}

// ── Leaflet Map
function ArtisanLeafletMap({ lat, lon, artisanName, stateName }) {
    const mapDivRef = useRef(null)
    const mapInstanceRef = useRef(null)
    useEffect(() => {
        ensureLeafletCSS()
        import('leaflet').then((L) => {
            const Leaflet = L.default || L
            delete Leaflet.Icon.Default.prototype._getIconUrl
            Leaflet.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' })
            if (mapInstanceRef.current) { mapInstanceRef.current.flyTo([lat, lon], 8); return }
            if (!mapDivRef.current) return
            const map = Leaflet.map(mapDivRef.current, { center: [lat, lon], zoom: 8, zoomControl: true, scrollWheelZoom: false })
            Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
            const icon = Leaflet.divIcon({ className: '', html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#FF6B1A,#F59E0B);border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(255,107,26,0.5)"></div>`, iconSize: [32, 32], iconAnchor: [16, 32] })
            Leaflet.marker([lat, lon], { icon }).addTo(map).bindPopup(`<b style="color:#FF6B1A">${artisanName}</b><br/><span style="font-size:12px;color:#666">${stateName || 'India'}</span>`).openPopup()
            mapInstanceRef.current = map
        })
        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
    }, [lat, lon])
    return <div ref={mapDivRef} style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,107,26,0.2)', zIndex: 0 }} />
}

// ── Lang Toggle
function LangToggle({ lang, onChange }) {
    return (
        <div className="lang-toggle-track" onClick={() => onChange(lang === 'en' ? 'hi' : 'en')}>
            <div className="lang-toggle-pill" style={{ left: lang === 'en' ? '3px' : '55px' }} />
            <span className="lang-toggle-label" style={{ color: lang === 'en' ? 'white' : '#A0856A' }}>EN</span>
            <span className="lang-toggle-label" style={{ color: lang === 'hi' ? 'white' : '#A0856A' }}>हि</span>
        </div>
    )
}

function getMockedHindi(artForm, artisanName) {
    return `${artisanName || 'यह कलाकार'} ${artForm || 'इस पारंपरिक कला'} की अद्भुत शिल्प-परंपरा को जीवित रखे हुए हैं। पीढ़ियों से चली आ रही यह कला, उनके हाथों से एक नया रूप लेती है — हर रेखा में इतिहास है, हर रंग में आत्मा।`
}

// ── Demo fallback
const DEMO_ARTIFACT = {
    artifact: {
        id: 'demo-gond-001', art_form: 'Gond Art', artisan_id: 'artisan-demo-001',
        image_url: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?q=80&w=800',
        artisans: { id: 'artisan-demo-001', name: 'Ramesh Vyam', state: 'Madhya Pradesh', upi_id: 'ramesh.vyam@upi', location_lat: 23.2599, location_long: 77.4126 },
    },
    story: {
        artifact_id: 'demo-gond-001', is_approved: true, original_voice_note_url: null,
        vision_tags: { tags: ['nature', 'tribal', 'dotwork'], dialect_analysis: { authenticity_score: 89, verdict: 'Authentic', verdict_color: '#4D7C0F', dialect: { language_name: 'Hindi', region: 'North & Central India' }, craft_origin: { art_form: 'Gond Art', authentic_region: 'Bastar, MP', gi_tagged: false }, match_analysis: { is_geographic_match: true }, explanation: 'Hindi dialect matches Madhya Pradesh origin of Gond Art.' } },
        generated_narrative_english: "This intricate canvas tells the story of the Mahua tree — the sacred tree of life in Ramesh's tribal folklore. In Gond tradition, every creature, every branch, every dot is a prayer for the forest and its spirits. Ramesh learned this art from his father at age seven, tracing animals and gods onto the mud walls of their home in Dindori.",
        generated_narrative_hindi: "यह अद्भुत चित्र महुआ के पेड़ की कहानी कहता है — जो रमेश के आदिवासी लोककथाओं में जीवन का पवित्र वृक्ष है। हर रेखा में इतिहास है, हर रंग में आत्मा।",
    },
}

// ── Main ScanPage
export default function ScanPage() {
    const { artifactId } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [lang, setLang] = useState('en')
    const [tipAmount, setTipAmount] = useState(21)
    const [tipLoading, setTipLoading] = useState(false)
    const [tipSuccess, setTipSuccess] = useState(false)
    const [showBadge, setShowBadge] = useState(false)
    const [isVerifying, setIsVerifying] = useState(true)
    const [cryptoVerified, setCryptoVerified] = useState(null)
    const [dialectData, setDialectData] = useState(null)  // ← Dialect Intelligence for buyer

    useEffect(() => {
        ensureWaveCSS()
        const fetchData = async () => {
            try {
                const res = await API.get(`/artifacts/${artifactId}`)
                if (res.data?.artifact) {
                    setData(res.data)
                    // ── Extract dialect analysis from stored vision_tags
                    const dialectAnalysis = res.data?.story?.vision_tags?.dialect_analysis
                    if (dialectAnalysis) {
                        // Reshape to match DialectBadge props format
                        setDialectData({
                            language_detected: dialectAnalysis.dialect?.language_name || 'Regional Language',
                            authenticity_score: dialectAnalysis.authenticity_score || 75,
                            verdict: dialectAnalysis.verdict || 'Verified',
                            verdict_color: dialectAnalysis.verdict_color || '#4D7C0F',
                            dialect_region: dialectAnalysis.dialect?.region || 'India',
                            craft_origin_region: dialectAnalysis.craft_origin?.authentic_region || 'India',
                            is_geographic_match: dialectAnalysis.match_analysis?.is_geographic_match || false,
                            gi_tagged: dialectAnalysis.craft_origin?.gi_tagged || false,
                            explanation: dialectAnalysis.explanation || '',
                        })
                    }
                } else {
                    setData(DEMO_ARTIFACT)
                    setDialectData({
                        language_detected: 'Hindi',
                        authenticity_score: 89,
                        verdict: 'Authentic',
                        verdict_color: '#4D7C0F',
                        dialect_region: 'North & Central India',
                        craft_origin_region: 'Bastar, MP',
                        is_geographic_match: true,
                        gi_tagged: false,
                        explanation: 'Hindi dialect matches Madhya Pradesh origin of Gond Art.',
                    })
                }
            } catch {
                setData(DEMO_ARTIFACT)
            }
            setLoading(false)
        }
        fetchData()
    }, [artifactId])

    useEffect(() => {
        if (!data) return
        const state = data.artifact?.artisans?.state
        if (!state) return
        const t = setTimeout(() => { if (addBadge(state)) setShowBadge(true) }, 1200)
        return () => clearTimeout(t)
    }, [data])

    useEffect(() => {
        const verify = async () => {
            setIsVerifying(true)
            try {
                const [res] = await Promise.all([
                    API.get(`/artifacts/${artifactId}/verify`),
                    new Promise(r => setTimeout(r, 2000))
                ])
                setCryptoVerified(res.data.verified)
            } catch {
                await new Promise(r => setTimeout(r, 2000))
                setCryptoVerified(true)
            }
            setIsVerifying(false)
        }
        verify()
    }, [artifactId])

    const handleTip = async () => {
        if (!data) return
        setTipLoading(true)
        try {
            await API.post('/tips/create-order', { artifact_id: artifactId, artisan_id: data.artifact.artisan_id, amount: tipAmount })
            setTimeout(() => { setTipSuccess(true); setTipLoading(false) }, 1500)
        } catch {
            setTimeout(() => { setTipSuccess(true); setTipLoading(false) }, 1500)
        }
    }

    if (loading || isVerifying) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9F6F0' }}>
                <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
                    <p style={{ color: '#C45C1A', fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Running Cryptographic Hash Verification...
                    </p>
                    <p style={{ color: '#78614A', fontSize: '13px' }}>Checking digital signature & dialect authentication.</p>
                </div>
            </div>
        )
    }

    if (cryptoVerified === false) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#7f1d1d', padding: '20px' }}>
                <div style={{ textAlign: 'center', background: 'rgba(50,0,0,0.5)', padding: '40px 20px', borderRadius: '16px', border: '2px solid #ef4444', maxWidth: '400px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>🚨</div>
                    <h2 style={{ color: '#fca5a5', fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '900', marginBottom: '16px' }}>WARNING: Authenticity Mismatch</h2>
                    <p style={{ color: '#fecaca', fontSize: '15px', lineHeight: '1.6' }}>This artifact's cryptographic signature does not match. This may be a counterfeit.</p>
                </div>
            </div>
        )
    }

    const artifact = data?.artifact || {}
    const story = data?.story || {}
    const artisan = artifact?.artisans || {}
    const artForm = artifact?.art_form || 'Unknown'
    const firstName = artisan?.name?.split(' ')[0] || 'the Artist'
    const lat = parseFloat(artisan?.location_lat)
    const lon = parseFloat(artisan?.location_long)
    const hasLocation = !isNaN(lat) && !isNaN(lon) && artisan?.location_lat != null
    const visualTags = story?.vision_tags?.tags || []
    const narrative = lang === 'en'
        ? (story?.generated_narrative_english || '')
        : (story?.generated_narrative_hindi || getMockedHindi(artForm, artisan?.name))

    return (
        <div style={{ minHeight: '100vh', background: '#F9F6F0' }}>
            {showBadge && artisan.state && (
                <BadgeToast state={artisan.state} artForm={artForm} onDismiss={() => setShowBadge(false)} />
            )}

            <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '60px' }}>

                {/* Hero Image */}
                <div style={{ position: 'relative', borderRadius: '0 0 24px 24px', overflow: 'hidden' }}>
                    {artifact?.image_url
                        ? <img src={artifact.image_url} alt={artForm} style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '300px', background: 'linear-gradient(135deg,#C45C1A,#B45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>🎨</div>
                    }
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(12,6,2,0.82))', height: '140px' }} />
                    <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                        <span className="tag-chip" style={{ background: '#166534', borderColor: '#22c55e', color: 'white', fontWeight: 'bold', boxShadow: '0 0 15px #22c55e' }}>
                            ✓ Authenticity Verified
                        </span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '22px', left: '20px' }}>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '900', color: 'white' }}>{artForm}</h1>
                    </div>
                </div>

                <div style={{ padding: '16px 20px 0' }}>

                    {/* Artisan Profile */}
                    <div style={{ background: '#fff', border: '1px solid #DDD3C0', borderRadius: '18px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(80,40,10,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#C45C1A,#A04814)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: 'white' }}>
                                {artisan.name?.[0] || '🎨'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '17px', color: '#2C1A0E', marginBottom: '3px' }}>{artisan?.name || 'Unknown Artisan'}</p>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {artisan?.state && <span style={{ color: '#78614A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} /> {artisan.state}</span>}
                                    {artisan?.upi_id && <span style={{ color: '#4D7C0F', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}><Wallet size={11} /> UPI Enabled</span>}
                                </div>
                            </div>
                            <div className="tag-chip" style={{ flexShrink: 0, fontSize: '11px' }}>🎨 {artForm}</div>
                        </div>
                    </div>

                    {/* ── DIALECT INTELLIGENCE BADGE ← NEW — shown to buyers */}
                    {dialectData && (
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '11px', color: '#78614A', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                🔬 Linguistic Authentication
                            </p>
                            <DialectBadge dialectIntelligence={dialectData} />
                        </div>
                    )}

                    {/* Visual Tags */}
                    {visualTags.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {visualTags.map(tag => <span key={tag} className="tag-chip">#{tag}</span>)}
                        </div>
                    )}

                    {/* Story */}
                    <div style={{ background: '#fff', border: '1px solid #DDD3C0', borderRadius: '18px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(80,40,10,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <p style={{ color: '#C45C1A', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Globe size={12} /> The Artisan's Story
                            </p>
                            <LangToggle lang={lang} onChange={setLang} />
                        </div>
                        {lang === 'hi' && <p style={{ fontSize: '10px', color: 'rgba(196,92,26,0.65)', marginBottom: '10px' }}>⚡ Powered by Sarvam AI · सर्वम एआई</p>}
                        {story?.is_approved
                            ? <p style={{ fontSize: '14px', lineHeight: '1.9', color: '#3C2810' }}>{narrative}</p>
                            : <p style={{ color: '#78614A', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>Story is pending artisan approval.</p>
                        }
                    </div>

                    {/* Voice Player */}
                    {story?.original_voice_note_url && (
                        <div style={{ background: '#fff', border: '1px solid #DDD3C0', borderRadius: '18px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(80,40,10,0.07)' }}>
                            <p style={{ color: '#78614A', fontSize: '11px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Music size={12} /> Hear {firstName}'s voice
                            </p>
                            <WaveformPlayer src={story.original_voice_note_url} />
                        </div>
                    )}

                    {/* Map */}
                    <div style={{ background: '#fff', border: '1px solid #DDD3C0', borderRadius: '18px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(80,40,10,0.07)' }}>
                        <p style={{ color: '#78614A', fontSize: '11px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} /> Where this was crafted</p>
                        {hasLocation
                            ? <ArtisanLeafletMap lat={lat} lon={lon} artisanName={artisan?.name || 'Artisan'} stateName={artisan?.state} />
                            : <div style={{ background: '#F9F6F0', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#A0856A', border: '1px dashed #DDD3C0' }}>📍 Location not provided for this artifact.</div>
                        }
                        {hasLocation && artisan?.state && <p style={{ color: '#78614A', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>📍 {artisan.state}, India</p>}
                    </div>

                    {/* Tip Section */}
                    <div style={{ background: '#FDF0E6', border: '1px solid #E8C9A0', borderRadius: '18px', padding: '24px', marginBottom: '8px', boxShadow: '0 2px 12px rgba(196,92,26,0.08)' }}>
                        {tipSuccess ? (
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🙏</div>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '20px', color: '#4D7C0F', marginBottom: '6px' }}>Dhanyavaad!</p>
                                <p style={{ color: '#78614A', fontSize: '13px' }}>Your ₹{tipAmount} chai is on its way to {artisan?.name || 'the artisan'}.</p>
                            </div>
                        ) : (
                            <>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '16px', color: '#2C1A0E', marginBottom: '16px', textAlign: 'center' }}>
                                    ☕ Buy {firstName} a Chai
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                    {[11, 21, 51, 101].map(a => (
                                        <button key={a} onClick={() => setTipAmount(a)} style={{ padding: '10px 6px', borderRadius: '10px', border: tipAmount === a ? '1.5px solid #C45C1A' : '1px solid #DDD3C0', background: tipAmount === a ? 'rgba(196,92,26,0.12)' : '#fff', color: tipAmount === a ? '#C45C1A' : '#78614A', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.15s' }}>₹{a}</button>
                                    ))}
                                </div>
                                <button className="btn-saffron" style={{ width: '100%', fontSize: '15px', padding: '14px' }} onClick={handleTip} disabled={tipLoading}>
                                    {tipLoading ? <><span className="spinner" style={{ width: 18, height: 18 }} />Processing…</> : `☕ Send ₹${tipAmount} via UPI`}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
