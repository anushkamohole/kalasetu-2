import { useState } from 'react'
import { Link } from 'react-router-dom'
import CulturalMap from '../components/CulturalMap'
import { Camera, ChevronRight, Sparkles, Zap } from 'lucide-react'

/* ── Inject one-time keyframe CSS ─────────────────────────────────────────── */
const HOME_STYLE = `
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 24px 4px rgba(13,148,136,0.45), 0 0 60px 8px rgba(13,148,136,0.15); }
  50%       { box-shadow: 0 0 40px 10px rgba(13,148,136,0.7), 0 0 90px 20px rgba(13,148,136,0.25); }
}
@keyframes ringPulse {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(1.75); opacity: 0;   }
}
@keyframes fabFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.artform-card-img {
  transition: transform 0.55s cubic-bezier(.4,0,.2,1);
}
.artform-card:hover .artform-card-img {
  transform: scale(1.08);
}
.artform-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.artform-card:hover {
  transform: translateY(-6px) scale(1.01);
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

/* ── Art form data with Unsplash image URLs ───────────────────────────────── */
const ART_FORMS = [
    {
        slug: 'warli',
        name: 'Warli',
        origin: 'Maharashtra',
        emoji: '🌿',
        desc: 'Geometric folk art from the Warli tribe — depicting life, nature, and community in chalk-white on mud-red.',
        image: 'https://images.unsplash.com/photo-1592123766745-e4cafc8ecd11?w=600&q=80',
        accent: '#FB923C',
        glowColor: 'rgba(251,146,60,0.55)',
    },
    {
        slug: 'madhubani',
        name: 'Madhubani',
        origin: 'Bihar',
        emoji: '🌸',
        desc: 'Intricate paintings from Mithila — bursting with floral motifs, gods, and the stories of women\'s wisdom.',
        image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&q=80',
        accent: '#60A5FA',
        glowColor: 'rgba(96,165,250,0.55)',
    },
    {
        slug: 'gond',
        name: 'Gond Art',
        origin: 'Madhya Pradesh',
        emoji: '🌳',
        desc: 'Every line is a prayer — Gond paintings celebrate nature with a distinctive dot-and-dash texture.',
        image: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=600&q=80',
        accent: '#4ADE80',
        glowColor: 'rgba(74,222,128,0.55)',
    },
    {
        slug: 'pattachitra',
        name: 'Pattachitra',
        origin: 'Odisha',
        emoji: '📜',
        desc: 'Sacred scroll paintings from Puri — each telling mythological tales of Lord Jagannath in vivid lacquered colour.',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        accent: '#C084FC',
        glowColor: 'rgba(192,132,252,0.55)',
    },
    {
        slug: 'dhokra',
        name: 'Dhokra',
        origin: 'Chhattisgarh',
        emoji: '🔱',
        desc: 'The lost-wax metal casting of India — tribal figures cast in bronze using a 4,000-year-old technique.',
        image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=600&q=80',
        accent: '#FCD34D',
        glowColor: 'rgba(252,211,77,0.55)',
    },
    {
        slug: 'kalamkari',
        name: 'Kalamkari',
        origin: 'Andhra Pradesh',
        emoji: '✒️',
        desc: 'Hand-drawn and block-printed epics on cotton — India\'s textile storytelling tradition.',
        image: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600&q=80',
        accent: '#2DD4BF',
        glowColor: 'rgba(45,212,191,0.55)',
    },
]

/* ── ArtFormCard  ─────────────────────────────────────────────────────────── */
function ArtFormCard({ art }) {
    const [hovered, setHovered] = useState(false)

    return (
        <Link to={`/artform/${art.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div
                id={`artform-card-${art.slug}`}
                className="artform-card"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: `1px solid ${hovered ? art.accent + '55' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    aspectRatio: '4/3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    boxShadow: hovered
                        ? `0 20px 50px rgba(0,0,0,0.55), 0 0 30px ${art.glowColor}`
                        : '0 4px 20px rgba(0,0,0,0.3)',
                }}
            >
                {/* ── Real photo background ── */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <img
                        className="artform-card-img"
                        src={art.image}
                        alt={art.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => {
                            // Graceful fallback to a coloured gradient if Unsplash fails
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                </div>

                {/* ── Gradient scrim — top to bottom ── */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(
            0deg,
            rgba(10,8,20,0.93) 0%,
            rgba(10,8,20,0.55) 45%,
            rgba(10,8,20,0.1)  100%
          )`,
                }} />

                {/* ── Accent colour tint on hover ── */}
                {hovered && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(ellipse at bottom left, ${art.accent}22 0%, transparent 70%)`,
                        transition: 'opacity 0.3s',
                    }} />
                )}

                {/* ── Glassmorphism text area ── */}
                <div style={{
                    position: 'relative', zIndex: 2,
                    padding: '16px 18px 18px',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    background: 'rgba(255,255,255,0.06)',
                    borderTop: `1px solid rgba(255,255,255,0.1)`,
                    margin: '0',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{art.emoji}</div>
                            <h3 style={{
                                fontWeight: '800', fontSize: '18px', color: 'white',
                                marginBottom: '2px', letterSpacing: '-0.3px',
                            }}>{art.name}</h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.6)', fontSize: '11px',
                                display: 'flex', alignItems: 'center', gap: '3px',
                            }}>
                                📍 {art.origin}
                            </p>
                        </div>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: hovered ? art.accent : 'rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(6px)',
                            transition: 'background 0.25s, transform 0.25s',
                            transform: hovered ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: hovered ? `0 0 14px ${art.glowColor}` : 'none',
                            flexShrink: 0,
                        }}>
                            <ChevronRight size={16} color="white" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

/* ── GlowingArtSnapFAB — hero centrepiece ────────────────────────────────── */
function GlowingArtSnapFAB() {
    const [pressed, setPressed] = useState(false)
    return (
        <Link to="/artsnap" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>

                {/* Pulsing ring 1 */}
                <div style={{
                    position: 'absolute', inset: '-14px',
                    borderRadius: '999px',
                    border: '2px solid rgba(13,148,136,0.4)',
                    animation: 'ringPulse 2s ease-out infinite',
                    pointerEvents: 'none',
                }} />
                {/* Pulsing ring 2 — staggered */}
                <div style={{
                    position: 'absolute', inset: '-14px',
                    borderRadius: '999px',
                    border: '2px solid rgba(13,148,136,0.3)',
                    animation: 'ringPulse 2s ease-out infinite 0.75s',
                    pointerEvents: 'none',
                }} />

                {/* FAB button */}
                <button
                    id="artsnap-fab"
                    onMouseDown={() => setPressed(true)}
                    onMouseUp={() => setPressed(false)}
                    onMouseLeave={() => setPressed(false)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '16px 36px',
                        borderRadius: '999px',
                        border: '1.5px solid rgba(13,148,136,0.7)',
                        background: 'linear-gradient(135deg, rgba(13,148,136,0.25), rgba(79,70,229,0.2))',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px', fontWeight: '700',
                        letterSpacing: '-0.2px',
                        animation: 'glowPulse 3s ease-in-out infinite, fabFloat 3.5s ease-in-out infinite',
                        transform: pressed ? 'scale(0.96)' : 'scale(1)',
                        transition: 'transform 0.12s',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                    }}
                >
                    <Camera size={20} color="#2DD4BF" />
                    <span style={{
                        background: 'linear-gradient(90deg, #2DD4BF, #818CF8, #2DD4BF)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'shimmer 3s linear infinite',
                    }}>
                        Try ArtSnap Lens
                    </span>
                    <Sparkles size={16} color="#818CF8" />
                </button>
            </div>
        </Link>
    )
}

/* ── Home page ───────────────────────────────────────────────────────────── */
export default function Home() {
    return (
        <div style={{ minHeight: '100vh', background: '#1A1625' }}>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section style={{ padding: '64px 24px 56px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '52px' }}>

                    <span className="tag-chip" style={{ marginBottom: '20px', display: 'inline-flex' }}>
                        🇮🇳 400+ GI-Tagged Craft Forms
                    </span>

                    <h1 style={{
                        fontSize: 'clamp(32px, 6vw, 60px)',
                        fontWeight: '900', lineHeight: '1.1',
                        letterSpacing: '-2px', marginBottom: '18px',
                    }}>
                        Discover India's<br />
                        <span className="gradient-text">Living Heritage</span>
                    </h1>

                    <p style={{
                        color: 'var(--text-muted)', fontSize: '17px',
                        maxWidth: '500px', margin: '0 auto 36px',
                        lineHeight: '1.75',
                    }}>
                        Every craft holds a universe. Explore folk art forms, meet the
                        artisans behind them, and carry a piece of India's soul.
                    </p>

                    {/* ── GLOWING ArtSnap FAB in hero ── */}
                    <GlowingArtSnapFAB />

                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '14px' }}>
                        AI-powered · Instant identification · Free
                    </p>
                </div>

                {/* ── Art Form Masonry Grid ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                    gap: '18px',
                    marginBottom: '72px',
                }}>
                    {ART_FORMS.map(art => <ArtFormCard key={art.slug} art={art} />)}
                </div>
            </section>

            {/* ── Cultural Map Section ─────────────────────────────────────── */}
            <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 72px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontWeight: '800', fontSize: '28px', marginBottom: '6px' }}>
                        🗺️ India's <span className="gradient-text">Craft Map</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Click any state to see what traditional crafts it's home to.
                    </p>
                </div>
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <CulturalMap />
                </div>
            </section>

            {/* ── ArtSnap CTA Banner ───────────────────────────────────────── */}
            <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 88px' }}>
                <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(79,70,229,0.18) 50%, rgba(13,148,136,0.10) 100%)',
                    border: '1px solid rgba(13,148,136,0.3)',
                    borderRadius: '24px',
                    padding: '40px 36px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '28px', flexWrap: 'wrap',
                }}>
                    {/* Background shimmer stripe */}
                    <div style={{
                        position: 'absolute', top: '-40px', right: '-60px',
                        width: '320px', height: '320px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Zap size={18} color="var(--teal)" />
                            <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                AI-Powered
                            </span>
                        </div>
                        <h3 style={{ fontWeight: '800', fontSize: '24px', marginBottom: '8px', lineHeight: 1.2 }}>
                            📷 See a craft? <span style={{ color: 'var(--teal)' }}>Snap it.</span>
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '380px', lineHeight: 1.7 }}>
                            Upload any photo of an Indian handicraft and our AI will identify
                            the art form and suggest the artisans behind it.
                        </p>
                    </div>

                    <Link to="/artsnap" style={{ textDecoration: 'none', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                        <button id="home-artsnap-cta" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '16px 32px', borderRadius: '14px',
                            border: '1.5px solid rgba(13,148,136,0.6)',
                            background: 'linear-gradient(135deg, rgba(13,148,136,0.3), rgba(13,148,136,0.15))',
                            color: 'white', cursor: 'pointer',
                            fontSize: '15px', fontWeight: '700',
                            boxShadow: '0 0 28px rgba(13,148,136,0.3)',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13,148,136,0.5), rgba(13,148,136,0.3))'; e.currentTarget.style.boxShadow = '0 0 48px rgba(13,148,136,0.5)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(13,148,136,0.3), rgba(13,148,136,0.15))'; e.currentTarget.style.boxShadow = '0 0 28px rgba(13,148,136,0.3)' }}
                        >
                            <Camera size={18} />
                            Try ArtSnap Lens
                        </button>
                    </Link>
                </div>
            </section>
        </div>
    )
}
