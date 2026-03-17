import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CulturalMap from '../components/CulturalMap'
import { Camera, ChevronRight, Sparkles, Zap, X, ScanLine, Scan } from 'lucide-react'

/* ── Inject keyframes once ───────────────────────────────────────────────── */
const HOME_STYLE = `
@keyframes orbDrift1 {
  0%,100% { transform: translate(0px, 0px) scale(1); }
  33%      { transform: translate(40px, -30px) scale(1.08); }
  66%      { transform: translate(-25px, 20px) scale(0.95); }
}
@keyframes orbDrift2 {
  0%,100% { transform: translate(0px, 0px) scale(1); }
  33%      { transform: translate(-35px, 25px) scale(1.06); }
  66%      { transform: translate(30px, -20px) scale(0.97); }
}
@keyframes shimmerBtn {
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
}
@keyframes fabFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}
@keyframes ringPulseWarm {
  0%   { transform: scale(1);   opacity: 0.55; }
  100% { transform: scale(1.9); opacity: 0;    }
}
@keyframes scanLine {
  0%   { top: 8px; }
  50%  { top: calc(100% - 8px); }
  100% { top: 8px; }
}
.artform-card-img {
  transition: transform 0.6s cubic-bezier(.25,.46,.45,.94);
}
.artform-card:hover .artform-card-img {
  transform: scale(1.1);
}
.artform-card {
  transition: box-shadow 0.3s ease;
}
.artform-card:hover {
  box-shadow: 0 24px 56px rgba(80,30,0,0.28) !important;
}
.shimmer-btn {
  background: linear-gradient(
    100deg,
    #C45C1A 0%,
    #C45C1A 30%,
    #F97316 45%,
    #FBBF24 50%,
    #F97316 55%,
    #C45C1A 70%,
    #C45C1A 100%
  );
  background-size: 300% auto;
  animation: shimmerBtn 3s linear infinite, fabFloat 4s ease-in-out infinite;
}
.shimmer-btn:hover {
  animation: shimmerBtn 1.8s linear infinite, fabFloat 4s ease-in-out infinite;
  box-shadow: 0 8px 36px rgba(196,92,26,0.55) !important;
}
.discover-option-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
.discover-option-card:hover {
  transform: translateY(-3px);
}
.qr-scanner-wrap video {
  border-radius: 16px;
  width: 100% !important;
  height: auto !important;
}
.qr-scanner-wrap > div {
  border-radius: 16px !important;
  overflow: hidden !important;
}
`
let homeStyleInjected = false
function ensureHomeStyle() {
    if (homeStyleInjected) return
    const s = document.createElement('style')
    s.textContent = HOME_STYLE
    document.head.appendChild(s)
    homeStyleInjected = true
}
ensureHomeStyle()

/* ── Art form data ───────────────────────────────────────────────────────── */
const ART_FORMS = [
    { slug: 'warli', name: 'Warli', origin: 'Maharashtra', emoji: '🌿', image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?q=80&w=800', accent: '#C45C1A' },
    { slug: 'madhubani', name: 'Madhubani', origin: 'Bihar', emoji: '🌸', image: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800', accent: '#3730A3' },
    { slug: 'gond', name: 'Gond Art', origin: 'Madhya Pradesh', emoji: '🌳', image: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?q=80&w=800', accent: '#166534' },
    { slug: 'pattachitra', name: 'Pattachitra', origin: 'Odisha', emoji: '📜', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', accent: '#7C3AED' },
    { slug: 'dhokra', name: 'Dhokra', origin: 'Chhattisgarh', emoji: '🔱', image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=600&q=80', accent: '#92400E' },
    { slug: 'kalamkari', name: 'Kalamkari', origin: 'Andhra Pradesh', emoji: '✒️', image: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600&q=80', accent: '#0F766E' },
]

/* ── Framer variants ─────────────────────────────────────────────────────── */
const heroVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.72, delay: i * 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
}
const cardContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.11, delayChildren: 0.35 } },
}
const cardVariants = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const modalVariants = {
    hidden: { opacity: 0, scale: 0.93, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
}

/* ── ArtFormCard ─────────────────────────────────────────────────────────── */
function ArtFormCard({ art }) {
    const [hovered, setHovered] = useState(false)
    return (
        <motion.div variants={cardVariants}>
            <Link to={`/artform/${art.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                    id={`artform-card-${art.slug}`}
                    className="artform-card"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                        position: 'relative', borderRadius: '22px', overflow: 'hidden',
                        border: hovered ? `1.5px solid ${art.accent}55` : '1.5px solid #DDD3C0',
                        cursor: 'pointer', aspectRatio: '4/3', display: 'flex',
                        flexDirection: 'column', justifyContent: 'flex-end',
                        boxShadow: '0 4px 20px rgba(80,30,0,0.12)', background: '#e8ded4',
                    }}
                >
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                        <img className="artform-card-img" src={art.image} alt={art.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.currentTarget.style.display = 'none' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,6,2,0.92) 0%, rgba(12,6,2,0.48) 40%, rgba(12,6,2,0.06) 100%)' }} />
                    {hovered && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at bottom left, ${art.accent}28 0%, transparent 65%)` }} />}
                    <div style={{ position: 'relative', zIndex: 2, padding: '16px 18px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '20px', marginBottom: '5px' }}>{art.emoji}</div>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '19px', color: '#FFF8F0', marginBottom: '3px', lineHeight: 1.15 }}>{art.name}</h3>
                                <p style={{ color: 'rgba(255,240,220,0.65)', fontSize: '11.5px' }}>📍 {art.origin}</p>
                            </div>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: hovered ? art.accent : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s, transform 0.25s', transform: hovered ? 'scale(1.12)' : 'scale(1)', flexShrink: 0 }}>
                                <ChevronRight size={16} color="white" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

/* ── QR Scanner view (lazy-loads the library) ────────────────────────────── */
function QRScannerView({ onDetect, onCancel }) {
    const [ScannerComponent, setScannerComponent] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useState(() => {
        import('@yudiel/react-qr-scanner').then(mod => {
            setScannerComponent(() => mod.Scanner || mod.default)
            setLoading(false)
        }).catch(() => {
            setError('Camera library failed to load.')
            setLoading(false)
        })
    })

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #DDD3C0', borderTopColor: '#C45C1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#78614A', fontSize: '14px' }}>Starting camera…</p>
        </div>
    )
    if (error) return <p style={{ color: '#C45C1A', textAlign: 'center', padding: '24px' }}>{error}</p>

    return (
        <div>
            <div className="qr-scanner-wrap" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '12px' }}>
                {ScannerComponent && (
                    <ScannerComponent
                        onScan={(results) => {
                            if (results && results.length > 0) {
                                onDetect(results[0].rawValue || results[0].text || String(results[0]))
                            }
                        }}
                        onError={() => setError('Camera access denied. Please allow camera permissions.')}
                        constraints={{ facingMode: 'environment' }}
                        components={{ audio: false, torch: false }}
                        styles={{ container: { borderRadius: '16px', overflow: 'hidden' } }}
                    />
                )}
                {/* Animated scan line overlay */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute', left: '12px', right: '12px', height: '2px',
                        background: 'linear-gradient(90deg, transparent, #C45C1A, #F97316, #C45C1A, transparent)',
                        animation: 'scanLine 2s ease-in-out infinite', boxShadow: '0 0 10px rgba(196,92,26,0.7)',
                    }} />
                    {/* Corner brackets */}
                    {[['0', '0', 'bottom', 'right'], ['0', 'auto', 'bottom', 'left'], ['auto', '0', 'top', 'right'], ['auto', 'auto', 'top', 'left']].map(([t, r, b, l], i) => (
                        <div key={i} style={{ position: 'absolute', top: t !== 'auto' ? '12px' : undefined, bottom: b !== 'auto' ? '12px' : undefined, left: l !== 'auto' ? '12px' : undefined, right: r !== 'auto' ? '12px' : undefined, width: '24px', height: '24px', borderStyle: 'solid', borderColor: '#F97316', borderWidth: 0, borderTopWidth: t !== 'auto' ? '3px' : 0, borderBottomWidth: b !== 'auto' ? '3px' : 0, borderLeftWidth: l !== 'auto' ? '3px' : 0, borderRightWidth: r !== 'auto' ? '3px' : 0 }} />
                    ))}
                </div>
            </div>
            <p style={{ textAlign: 'center', color: '#78614A', fontSize: '12px', marginBottom: '16px' }}>
                Point your camera at a KalaSetu QR code
            </p>
            <button onClick={onCancel} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: '1px solid #DDD3C0', background: '#fff', color: '#78614A', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                ← Back to options
            </button>
        </div>
    )
}

/* ── Discovery Modal ─────────────────────────────────────────────────────── */
function DiscoveryModal({ onClose, navigate }) {
    // 'options' | 'qr'
    const [view, setView] = useState('options')

    const handleQRDetect = useCallback((raw) => {
        // Parse KalaSetu URLs like https://kalasetu.com/scan/ID or /scan/ID
        const match = raw.match(/\/scan\/([a-zA-Z0-9_-]+)/)
        if (match) {
            onClose()
            navigate(`/scan/${match[1]}`)
        } else {
            // treat the entire scanned text as an ID fallback for demo purposes
            const id = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'demo'
            onClose()
            navigate(`/scan/${id}`)
        }
    }, [navigate, onClose])

    return (
        /* Backdrop */
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(44,26,14,0.55)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
            }}
        >
            {/* Modal card — stop propagation so clicks inside don't close */}
            <motion.div
                key="modal"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#FDFAF6',
                    border: '1px solid #DDD3C0',
                    borderRadius: '28px',
                    padding: '32px 28px',
                    width: '100%',
                    maxWidth: '460px',
                    boxShadow: '0 24px 64px rgba(80,30,0,0.22)',
                    position: 'relative',
                }}
            >
                {/* Close button */}
                <button
                    id="discovery-modal-close"
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#EDE5D8', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#78614A',
                    }}
                >
                    <X size={16} />
                </button>

                {view === 'options' ? (
                    <>
                        <div style={{ marginBottom: '24px', paddingRight: '32px' }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '800', color: '#2C1A0E', marginBottom: '6px' }}>
                                Explore an Artifact
                            </h2>
                            <p style={{ color: '#78614A', fontSize: '13px', lineHeight: '1.6' }}>
                                How would you like to discover this piece of heritage?
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '14px', flexDirection: 'column' }}>
                            {/* Option A — QR Scan */}
                            <button
                                id="discovery-option-qr"
                                className="discover-option-card"
                                onClick={() => setView('qr')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '18px',
                                    padding: '20px 20px',
                                    background: '#fff', border: '1.5px solid #DDD3C0',
                                    borderRadius: '18px', cursor: 'pointer', textAlign: 'left',
                                    boxShadow: '0 2px 12px rgba(80,40,10,0.07)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C45C1A'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(196,92,26,0.18)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD3C0'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(80,40,10,0.07)' }}
                            >
                                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #FDF0E6, #F7E0C8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Scan size={26} color="#C45C1A" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '16px', color: '#2C1A0E', marginBottom: '3px' }}>
                                        🔳 Scan Living Tag
                                    </p>
                                    <p style={{ color: '#78614A', fontSize: '12px', lineHeight: '1.5' }}>
                                        I have a KalaSetu QR code on a craft piece.
                                    </p>
                                </div>
                                <ChevronRight size={18} color="#C45C1A" />
                            </button>

                            {/* Option B — ArtSnap AI */}
                            <Link
                                id="discovery-option-artsnap"
                                to="/artsnap"
                                onClick={onClose}
                                className="discover-option-card"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '18px',
                                    padding: '20px 20px',
                                    background: '#fff', border: '1.5px solid #DDD3C0',
                                    borderRadius: '18px', cursor: 'pointer', textDecoration: 'none',
                                    boxShadow: '0 2px 12px rgba(80,40,10,0.07)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3730A3'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(55,48,163,0.14)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD3C0'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(80,40,10,0.07)' }}
                            >
                                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #EDE9FF, #DDD6FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Camera size={26} color="#3730A3" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '16px', color: '#2C1A0E', marginBottom: '3px' }}>
                                        📷 Identify Art (AI Lens)
                                    </p>
                                    <p style={{ color: '#78614A', fontSize: '12px', lineHeight: '1.5' }}>
                                        I want to identify an unknown Indian art piece.
                                    </p>
                                </div>
                                <ChevronRight size={18} color="#3730A3" />
                            </Link>
                        </div>

                        <p style={{ textAlign: 'center', color: '#B09070', fontSize: '11px', marginTop: '20px' }}>
                            Both options are free · Powered by KalaSetu AI
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '800', color: '#2C1A0E', marginBottom: '4px' }}>
                                🔳 Scan QR Code
                            </h2>
                            <p style={{ color: '#78614A', fontSize: '12px' }}>
                                Hold your camera steady over the KalaSetu tag.
                            </p>
                        </div>
                        <QRScannerView
                            onDetect={handleQRDetect}
                            onCancel={() => setView('options')}
                        />
                    </>
                )}
            </motion.div>
        </div>
    )
}

/* ── Hero CTA button ─────────────────────────────────────────────────────── */
function ExploreArtifactBtn({ onClick }) {
    const [pressed, setPressed] = useState(false)
    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: '-16px', borderRadius: '999px', border: '2px solid rgba(196,92,26,0.3)', animation: 'ringPulseWarm 2.4s ease-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: '-16px', borderRadius: '999px', border: '2px solid rgba(196,92,26,0.2)', animation: 'ringPulseWarm 2.4s ease-out infinite 0.9s', pointerEvents: 'none' }} />
            <button
                id="explore-artifact-btn"
                className="shimmer-btn"
                onClick={onClick}
                onMouseDown={() => setPressed(true)}
                onMouseUp={() => setPressed(false)}
                onMouseLeave={() => setPressed(false)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '11px',
                    padding: '17px 40px', borderRadius: '999px', border: 'none',
                    color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: '700',
                    letterSpacing: '0.1px', boxShadow: '0 6px 28px rgba(196,92,26,0.40)',
                    transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform 0.1s',
                }}
            >
                <ScanLine size={20} />
                <span>Explore an Artifact</span>
                <Sparkles size={16} color="rgba(255,255,255,0.8)" />
            </button>
        </div>
    )
}

/* ── Home ────────────────────────────────────────────────────────────────── */
export default function Home() {
    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = useCallback(() => setModalOpen(true), [])
    const closeModal = useCallback(() => setModalOpen(false), [])

    return (
        <div style={{ minHeight: '100vh', background: '#F9F6F0', overflow: 'hidden', position: 'relative' }}>

            {/* ── Ambient orbs ───────────────────────────────────────────── */}
            <div style={{ position: 'fixed', top: '-120px', left: '-80px', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.22) 0%, rgba(251,146,60,0.05) 60%, transparent 100%)', filter: 'blur(48px)', animation: 'orbDrift1 18s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-100px', right: '-60px', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 60%, transparent 100%)', filter: 'blur(52px)', animation: 'orbDrift2 22s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', top: '40%', right: '10%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,83,9,0.10) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'orbDrift1 26s ease-in-out infinite 4s', pointerEvents: 'none', zIndex: 0 }} />

            {/* ── Main Content ────────────────────────────────────────────── */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Hero */}
                <section style={{ padding: '64px 24px 56px', maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>

                        <motion.div custom={0} variants={heroVariants} initial="hidden" animate="visible">
                            <span className="tag-chip" style={{ marginBottom: '22px', display: 'inline-flex' }}>
                                🇮🇳 400+ GI-Tagged Craft Forms
                            </span>
                        </motion.div>

                        <motion.h1
                            custom={1} variants={heroVariants} initial="hidden" animate="visible"
                            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: '900', lineHeight: '1.08', color: '#2C1A0E', letterSpacing: '-1.5px', marginBottom: '20px' }}
                        >
                            Discover India's<br />
                            <span className="gradient-text">Living Heritage</span>
                        </motion.h1>

                        <motion.p
                            custom={2} variants={heroVariants} initial="hidden" animate="visible"
                            style={{ color: '#78614A', fontSize: '17px', maxWidth: '480px', margin: '0 auto 40px', lineHeight: '1.8' }}
                        >
                            Every craft holds a universe. Explore folk art forms, meet the artisans behind them, and carry a piece of India's soul.
                        </motion.p>

                        <motion.div custom={3} variants={heroVariants} initial="hidden" animate="visible">
                            <ExploreArtifactBtn onClick={openModal} />
                        </motion.div>

                        <motion.p
                            custom={4} variants={heroVariants} initial="hidden" animate="visible"
                            style={{ color: '#B09070', fontSize: '12px', marginTop: '18px' }}
                        >
                            Scan QR tags · AI identification · Free
                        </motion.p>
                    </div>

                    {/* Art form grid — staggered */}
                    <motion.div
                        variants={cardContainerVariants} initial="hidden" animate="visible"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px', marginBottom: '80px' }}
                    >
                        {ART_FORMS.map(art => <ArtFormCard key={art.slug} art={art} />)}
                    </motion.div>
                </section>

                {/* Cultural Map */}
                <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 72px' }}>
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '30px', marginBottom: '6px', color: '#2C1A0E' }}>
                            🗺️ India's <span className="gradient-text">Craft Map</span>
                        </h2>
                        <p style={{ color: '#78614A', fontSize: '14px' }}>Click any state to see what traditional crafts it's home to.</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.65, delay: 0.1 }} style={{ background: '#fff', border: '1px solid #DDD3C0', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(80,40,10,0.09)' }}>
                        <CulturalMap />
                    </motion.div>
                </section>

                {/* ArtSnap CTA banner */}
                <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 96px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.65 }}
                        style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #FDF0E6 0%, #FEF3E2 55%, #F7E8CF 100%)', border: '1px solid #E8C9A0', borderRadius: '26px', padding: '44px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '28px', flexWrap: 'wrap' }}
                    >
                        <div style={{ position: 'absolute', top: '-60px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,92,26,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Zap size={18} color="#C45C1A" />
                                <span style={{ color: '#C45C1A', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>AI-Powered</span>
                            </div>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '26px', marginBottom: '10px', lineHeight: 1.2, color: '#2C1A0E' }}>
                                📷 See a craft? <span style={{ color: '#C45C1A' }}>Snap it.</span>
                            </h3>
                            <p style={{ color: '#78614A', fontSize: '14px', maxWidth: '380px', lineHeight: 1.75 }}>
                                Upload any photo of an Indian handicraft and our AI will identify the art form and suggest the artisans behind it.
                            </p>
                        </div>
                        <button
                            id="home-artsnap-cta"
                            onClick={openModal}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '16px 34px', borderRadius: '999px', border: 'none',
                                background: 'linear-gradient(100deg, #C45C1A 0%, #C45C1A 30%, #F97316 50%, #C45C1A 70%, #C45C1A 100%)',
                                backgroundSize: '300% auto',
                                animation: 'shimmerBtn 3s linear infinite',
                                color: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: '700',
                                boxShadow: '0 6px 24px rgba(196,92,26,0.38)',
                                position: 'relative', zIndex: 1, flexShrink: 0,
                            }}
                        >
                            <ScanLine size={18} />
                            Explore an Artifact
                        </button>
                    </motion.div>
                </section>
            </div>

            {/* ── Discovery Modal (portal-style overlay) ──────────────────── */}
            <AnimatePresence>
                {modalOpen && (
                    <DiscoveryModal onClose={closeModal} navigate={navigate} />
                )}
            </AnimatePresence>
        </div>
    )
}
