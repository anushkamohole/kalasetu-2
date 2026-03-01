import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Wallet, Music, Globe, Play, Pause } from 'lucide-react'
import API from '../api/client'

// ── Inject waveform animation CSS once ───────────────────────────────────────
let waveCSS = false
function ensureWaveCSS() {
    if (waveCSS) return
    const style = document.createElement('style')
    style.textContent = `
@keyframes wave {
    0%, 100% { transform: scaleY(0.3); }
    50%       { transform: scaleY(1);   }
}
.wave-bar { transform-origin: bottom; transform: scaleY(0.3); }
.wave-bar.playing { animation: wave 0.9s ease-in-out infinite; }
.lang-toggle-track {
    position: relative; display: flex; align-items: center;
    width: 108px; height: 34px; border-radius: 20px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    cursor: pointer; user-select: none; overflow: hidden;
}
.lang-toggle-pill {
    position: absolute; top: 3px; height: 28px; width: 50px;
    border-radius: 16px;
    background: linear-gradient(135deg, #FF6B1A, #F59E0B);
    transition: left 0.25s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 2px 8px rgba(255,107,26,0.4);
}
.lang-toggle-label {
    position: relative; z-index: 1; flex: 1; text-align: center;
    font-size: 12px; font-weight: 700; transition: color 0.2s;
    line-height: 34px;
}
@keyframes slideInUp {
    from { transform: translateY(110%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
}
@keyframes slideOutDown {
    from { transform: translateY(0);    opacity: 1; }
    to   { transform: translateY(110%); opacity: 0; }
}
.badge-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    z-index: 9999; width: min(380px, calc(100vw - 32px));
    animation: slideInUp 0.45s cubic-bezier(.4,0,.2,1) forwards;
}
.badge-toast.exit {
    animation: slideOutDown 0.35s cubic-bezier(.4,0,.2,1) forwards;
}
`
    document.head.appendChild(style)
    waveCSS = true
}

// ── Leaflet CSS ───────────────────────────────────────────────────────────────
let leafletCSSLoaded = false
function ensureLeafletCSS() {
    if (leafletCSSLoaded) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    leafletCSSLoaded = true
}

// ── Badge helpers (localStorage) ─────────────────────────────────────────────
const BADGE_KEY = 'kalasetu_badges'
function getBadges() {
    try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]') } catch { return [] }
}
function addBadge(state) {
    const badges = getBadges()
    if (!badges.includes(state)) {
        localStorage.setItem(BADGE_KEY, JSON.stringify([...badges, state]))
        return true   // newly earned
    }
    return false      // already had it
}

// ── WaveformPlayer ────────────────────────────────────────────────────────────
const BAR_COUNT = 32
const HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) =>
    20 + Math.abs(Math.sin(i * 0.72 + 1.1) * 48)
)

function WaveformPlayer({ src, artisanName }) {
    const audioRef = useRef(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)       // 0–1
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        ensureWaveCSS()
        const audio = audioRef.current
        if (!audio) return
        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
            setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
        }
        const onLoadedMeta = () => setDuration(audio.duration)
        const onEnded = () => setPlaying(false)
        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.addEventListener('loadedmetadata', onLoadedMeta)
        audio.addEventListener('ended', onEnded)
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate)
            audio.removeEventListener('loadedmetadata', onLoadedMeta)
            audio.removeEventListener('ended', onEnded)
        }
    }, [])

    const togglePlay = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        if (playing) { audio.pause(); setPlaying(false) }
        else { audio.play().then(() => setPlaying(true)).catch(() => { }) }
    }, [playing])

    const handleBarClick = useCallback((i) => {
        const audio = audioRef.current
        if (!audio || !audio.duration) return
        audio.currentTime = (i / BAR_COUNT) * audio.duration
    }, [])

    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    const filledBars = Math.round(progress * BAR_COUNT)

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '14px', padding: '12px 14px',
        }}>
            <audio ref={audioRef} src={src} preload="metadata" style={{ display: 'none' }} />

            {/* Play / Pause */}
            <button onClick={togglePlay} style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none', flexShrink: 0,
                background: 'linear-gradient(135deg, #FF6B1A, #F59E0B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 3px 12px rgba(255,107,26,0.4)',
            }}>
                {playing
                    ? <Pause size={16} color="white" fill="white" />
                    : <Play size={16} color="white" fill="white" style={{ marginLeft: '2px' }} />}
            </button>

            {/* Waveform bars */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                gap: '2px', height: '40px', cursor: 'pointer',
            }}>
                {HEIGHTS.map((h, i) => (
                    <div key={i}
                        onClick={() => handleBarClick(i)}
                        className={`wave-bar${playing ? ' playing' : ''}`}
                        style={{
                            flex: 1, height: `${h}%`, borderRadius: '2px',
                            background: i < filledBars
                                ? 'linear-gradient(to top, #FF6B1A, #F59E0B)'
                                : 'rgba(255,255,255,0.15)',
                            animationDelay: `${(i % 8) * 0.1}s`,
                            transition: 'background 0.15s',
                        }}
                    />
                ))}
            </div>

            {/* Time */}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums', minWidth: '36px', textAlign: 'right' }}>
                {duration > 0 ? fmt(currentTime) : '0:00'}
            </span>
        </div>
    )
}

// ── BadgeToast ────────────────────────────────────────────────────────────────
function BadgeToast({ state, artForm, onDismiss }) {
    const [exiting, setExiting] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            setExiting(true)
            setTimeout(onDismiss, 380)
        }, 4200)
        return () => clearTimeout(t)
    }, [onDismiss])

    return (
        <div className={`badge-toast${exiting ? ' exit' : ''}`}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(37,30,53,0.97), rgba(26,22,37,0.97))',
                border: '1px solid rgba(255,107,26,0.4)',
                borderRadius: '18px',
                padding: '16px 20px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,107,26,0.15)',
                backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', gap: '14px',
            }}>
                {/* Badge icon */}
                <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FF6B1A, #F59E0B)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', boxShadow: '0 4px 16px rgba(255,107,26,0.5)',
                }}>🏅</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '800', fontSize: '14px', marginBottom: '3px', lineHeight: '1.3' }}>
                        🎉 Badge Unlocked!
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>
                        You've discovered <span style={{ color: 'var(--saffron)', fontWeight: '700' }}>{artForm}</span> from <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{state}</span> — <em>{state} Explorer</em> 🗺️
                    </p>
                </div>

                <button onClick={() => { setExiting(true); setTimeout(onDismiss, 380) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0, padding: '4px' }}>
                    ×
                </button>
            </div>
        </div>
    )
}

// ── ArtisanLeafletMap ─────────────────────────────────────────────────────────
function ArtisanLeafletMap({ lat, lon, artisanName, stateName }) {
    const mapDivRef = useRef(null)
    const mapInstanceRef = useRef(null)

    useEffect(() => {
        ensureLeafletCSS()
        import('leaflet').then((L) => {
            const Leaflet = L.default || L
            delete Leaflet.Icon.Default.prototype._getIconUrl
            Leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            })
            if (mapInstanceRef.current) { mapInstanceRef.current.flyTo([lat, lon], 8); return }
            if (!mapDivRef.current) return
            const map = Leaflet.map(mapDivRef.current, { center: [lat, lon], zoom: 8, zoomControl: true, scrollWheelZoom: false })
            Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
            }).addTo(map)
            const icon = Leaflet.divIcon({
                className: '',
                html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#FF6B1A,#F59E0B);border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(255,107,26,0.5)"></div>`,
                iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -36],
            })
            Leaflet.marker([lat, lon], { icon }).addTo(map)
                .bindPopup(`<div style="font-family:sans-serif;text-align:center;padding:4px 8px"><b style="color:#FF6B1A">${artisanName}</b><br/><span style="font-size:12px;color:#666">${stateName || 'India'}</span></div>`, { maxWidth: 180 })
                .openPopup()
            mapInstanceRef.current = map
        })
        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
    }, [lat, lon])

    return <div ref={mapDivRef} id="artisan-map" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,107,26,0.2)', zIndex: 0 }} />
}

// ── LangToggle ────────────────────────────────────────────────────────────────
function LangToggle({ lang, onChange }) {
    return (
        <div className="lang-toggle-track" onClick={() => onChange(lang === 'en' ? 'hi' : 'en')}
            title="Toggle language / भाषा बदलें">
            {/* sliding pill — left=3px for EN, right-side=55px for हि */}
            <div className="lang-toggle-pill" style={{ left: lang === 'en' ? '3px' : '55px' }} />
            <span className="lang-toggle-label" style={{ color: lang === 'en' ? 'white' : 'rgba(255,255,255,0.4)' }}>EN</span>
            <span className="lang-toggle-label" style={{ color: lang === 'hi' ? 'white' : 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>हि</span>
        </div>
    )
}

// ── Mocked Hindi fallback ─────────────────────────────────────────────────────
function getMockedHindi(artForm, artisanName) {
    return `${artisanName || 'यह कलाकार'} ${artForm || 'इस पारंपरिक कला'} की अद्भुत शिल्प-परंपरा को जीवित रखे हुए हैं। पीढ़ियों से चली आ रही यह कला, उनके हाथों से एक नया रूप लेती है — हर रेखा में इतिहास है, हर रंग में आत्मा। KalaSetu के माध्यम से, आप इस विरासत का सीधा हिस्सा बन रहे हैं।`
}

// ── Main ScanPage ─────────────────────────────────────────────────────────────
export default function ScanPage() {
    const { artifactId } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lang, setLang] = useState('en')
    const [tipAmount, setTipAmount] = useState(21)
    const [tipLoading, setTipLoading] = useState(false)
    const [tipSuccess, setTipSuccess] = useState(false)
    const [showBadge, setShowBadge] = useState(false)

    useEffect(() => {
        ensureWaveCSS()
        const fetchData = async () => {
            try {
                const res = await API.get(`/artifacts/${artifactId}`)
                setData(res.data)
            } catch {
                setError('Could not find this artifact. Make sure you have scanned a valid KalaSetu tag.')
            }
            setLoading(false)
        }
        fetchData()
    }, [artifactId])

    // Trigger badge toast after data loads (1.2s delay, once per state)
    useEffect(() => {
        if (!data) return
        const state = data.artifact?.artisans?.state
        if (!state) return
        const t = setTimeout(() => {
            const earned = addBadge(state)
            if (earned) setShowBadge(true)
        }, 1200)
        return () => clearTimeout(t)
    }, [data])

    const handleTip = async () => {
        if (!data) return
        setTipLoading(true)
        try {
            await API.post('/tips/create-order', {
                artifact_id: artifactId,
                artisan_id: data.artifact.artisan_id,
                amount: tipAmount,
            })
            setTimeout(() => { setTipSuccess(true); setTipLoading(false) }, 1500)
        } catch (e) {
            alert('Tip failed: ' + (e.response?.data?.detail || e.message))
            setTipLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1625' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Fetching artisan story...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1625', padding: '24px' }}>
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center', maxWidth: '360px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px' }}>Tag Not Found</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>{error}</p>
                    <Link to="/" style={{ color: 'var(--saffron)', fontSize: '13px' }}>← Discover crafts</Link>
                </div>
            </div>
        )
    }

    const { artifact, story } = data
    const artisan = artifact.artisans || {}
    const artForm = artifact.art_form || 'Unknown'
    const firstName = artisan.name?.split(' ')[0] || 'the Artist'
    const hasLocation = artisan.location_lat && artisan.location_long
    const visualTags = story?.vision_tags?.tags || []

    // Language-aware narrative with Hindi fallback
    const narrative = lang === 'en'
        ? (story?.generated_narrative_english || '')
        : (story?.generated_narrative_hindi || getMockedHindi(artForm, artisan.name))

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1A1625 0%, #251E35 100%)' }}>

            {/* ── Badge Toast ──────────────────────────────────────────────── */}
            {showBadge && artisan.state && (
                <BadgeToast
                    state={artisan.state}
                    artForm={artForm}
                    onDismiss={() => setShowBadge(false)}
                />
            )}

            <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '60px' }}>

                {/* ── Hero Image ──────────────────────────────────────────── */}
                <div style={{ position: 'relative' }}>
                    {artifact.image_url ? (
                        <img src={artifact.image_url} alt={artForm}
                            style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                    ) : (
                        <div style={{
                            width: '100%', height: '300px',
                            background: 'linear-gradient(135deg, var(--saffron), var(--gold))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px',
                        }}>🎨</div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, #1A1625)', height: '120px' }} />
                    <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                        <span className="tag-chip">✅ KalaSetu Verified</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '24px', left: '20px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', lineHeight: '1.2' }}>
                            <span className="gradient-text">{artForm}</span>
                        </h1>
                    </div>
                </div>

                <div style={{ padding: '12px 20px 0' }}>

                    {/* ── Artisan Profile Card ─────────────────────────── */}
                    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, var(--saffron), var(--gold))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '20px', fontWeight: '800', color: 'white',
                            }}>
                                {artisan.name?.[0] || '🎨'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: '800', fontSize: '17px', marginBottom: '3px' }}>
                                    {artisan.name || 'Unknown Artisan'}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {artisan.state && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <MapPin size={11} /> {artisan.state}
                                        </span>
                                    )}
                                    {artisan.upi_id && (
                                        <span style={{ color: 'var(--teal)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Wallet size={11} /> UPI Enabled
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="tag-chip" style={{ flexShrink: 0, fontSize: '11px' }}>🎨 {artForm}</div>
                        </div>
                    </div>

                    {/* ── Visual Tags ──────────────────────────────────── */}
                    {visualTags.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            {visualTags.map(tag => <span key={tag} className="tag-chip">#{tag}</span>)}
                        </div>
                    )}

                    {/* ── Story with Bhashini Toggle ───────────────────── */}
                    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <p style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Globe size={12} /> The Artisan's Story
                            </p>
                            <LangToggle lang={lang} onChange={setLang} />
                        </div>

                        {/* Bhashini powered hint */}
                        {lang === 'hi' && (
                            <p style={{ fontSize: '10px', color: 'rgba(255,107,26,0.6)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ⚡ Powered by Bhashini · भाषिणी
                            </p>
                        )}

                        {story?.is_approved ? (
                            <p className={lang === 'hi' ? 'hindi-text' : ''}
                                style={{ fontSize: '14px', lineHeight: '1.9', color: 'var(--text-primary)' }}>
                                {narrative}
                            </p>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                                Story is pending artisan approval.
                            </p>
                        )}
                    </div>

                    {/* ── Waveform Voice Player ────────────────────────── */}
                    {story?.original_voice_note_url && (
                        <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Music size={12} /> Hear {firstName}'s voice
                            </p>
                            <WaveformPlayer src={story.original_voice_note_url} artisanName={firstName} />
                        </div>
                    )}

                    {/* ── Leaflet Map ──────────────────────────────────── */}
                    {hasLocation && (
                        <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={12} /> Where this was crafted
                            </p>
                            <ArtisanLeafletMap
                                lat={artisan.location_lat}
                                lon={artisan.location_long}
                                artisanName={artisan.name || 'Artisan'}
                                stateName={artisan.state}
                            />
                            {artisan.state && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
                                    📍 {artisan.state}, India
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Tip Section ──────────────────────────────────── */}
                    <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(255,107,26,0.2)', background: 'rgba(255,107,26,0.04)' }}>
                        {tipSuccess ? (
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🙏</div>
                                <p style={{ fontWeight: '800', fontSize: '18px', color: 'var(--teal)', marginBottom: '4px' }}>Dhanyavaad!</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                    Your ₹{tipAmount} chai is on its way to {artisan.name}.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '28px' }}>☕</span>
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '15px' }}>Buy {firstName} a Chai</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Direct tip via UPI — no middleman.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                    {[11, 21, 51, 101].map(a => (
                                        <button key={a} id={`tip-amount-${a}`} onClick={() => setTipAmount(a)} style={{
                                            padding: '10px 6px', borderRadius: '10px',
                                            border: tipAmount === a ? '1.5px solid var(--saffron)' : '1px solid rgba(255,255,255,0.1)',
                                            background: tipAmount === a ? 'rgba(255,107,26,0.2)' : 'rgba(255,255,255,0.03)',
                                            color: tipAmount === a ? 'var(--saffron)' : 'var(--text-muted)',
                                            cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'all 0.15s',
                                        }}>₹{a}</button>
                                    ))}
                                </div>
                                <button id="send-tip-btn" className="btn-saffron"
                                    style={{ width: '100%', fontSize: '15px', padding: '14px' }}
                                    onClick={handleTip} disabled={tipLoading}>
                                    {tipLoading
                                        ? <><span className="spinner" style={{ width: 18, height: 18 }} />Processing...</>
                                        : `☕ Send ₹${tipAmount} via UPI`}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
