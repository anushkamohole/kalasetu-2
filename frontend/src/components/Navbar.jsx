import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Camera, Palette, User, Map } from 'lucide-react'

// ── localStorage badge helpers ────────────────────────────────────────────────
const BADGE_KEY = 'kalasetu_badges'
function getBadges() {
    try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]') } catch { return [] }
}

// State → flag emoji map
const STATE_FLAGS = {
    'Maharashtra': '🟠', 'Rajasthan': '🔵', 'West Bengal': '🟡', 'Gujarat': '🟢',
    'Uttar Pradesh': '🟣', 'Bihar': '🟤', 'Odisha': '🔶', 'Tamil Nadu': '🔷',
    'Kerala': '🟩', 'Karnataka': '🟦', 'Madhya Pradesh': '🟨', 'Assam': '🟫',
    'Andhra Pradesh': '🔴', 'Telangana': '🟥', 'Jharkhand': '🔸', 'Chhattisgarh': '🔹',
}
function stateEmoji(s) { return STATE_FLAGS[s] || '📍' }

// ── PassportButton ────────────────────────────────────────────────────────────
function PassportButton() {
    const [badges, setBadges] = useState([])
    const [open, setOpen] = useState(false)
    const dropRef = useRef(null)

    useEffect(() => {
        const refresh = () => setBadges(getBadges())
        refresh()
        window.addEventListener('focus', refresh)
        const interval = setInterval(refresh, 2000)
        return () => { window.removeEventListener('focus', refresh); clearInterval(interval) }
    }, [])

    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const hasBadges = badges.length > 0

    return (
        <div ref={dropRef} style={{ position: 'relative' }}>
            <button
                id="passport-btn"
                onClick={() => setOpen(o => !o)}
                title={hasBadges ? `Cultural Passport — ${badges.length} badge${badges.length > 1 ? 's' : ''}` : 'Cultural Passport'}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '10px',
                    border: hasBadges ? '1px solid rgba(180,83,9,0.45)' : '1px solid #DDD3C0',
                    background: hasBadges ? 'rgba(180,83,9,0.08)' : 'rgba(80,40,10,0.04)',
                    color: hasBadges ? '#B45309' : '#78614A',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    transition: 'all 0.2s', position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = hasBadges ? 'rgba(180,83,9,0.14)' : 'rgba(80,40,10,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = hasBadges ? 'rgba(180,83,9,0.08)' : 'rgba(80,40,10,0.04)' }}
            >
                <Map size={14} />
                Passport

                {hasBadges && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: '#C45C1A',
                        border: '2px solid #F9F6F0',
                    }} />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    minWidth: '226px', zIndex: 200,
                    background: '#fff',
                    border: '1px solid #DDD3C0',
                    borderRadius: '14px',
                    boxShadow: '0 12px 40px rgba(80,40,10,0.14)',
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #EDE7DC' }}>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '14px', color: '#B45309' }}>
                            🗺️ Cultural Passport
                        </p>
                        <p style={{ color: '#78614A', fontSize: '11px', marginTop: '2px' }}>
                            {hasBadges ? `${badges.length} state${badges.length > 1 ? 's' : ''} explored` : 'No badges yet'}
                        </p>
                    </div>

                    {hasBadges ? (
                        <div style={{ padding: '8px 0', maxHeight: '200px', overflowY: 'auto' }}>
                            {badges.map((state, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 16px',
                                    borderBottom: i < badges.length - 1 ? '1px solid #F1EBE0' : 'none',
                                }}>
                                    <span style={{ fontSize: '18px' }}>{stateEmoji(state)}</span>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#2C1A0E', lineHeight: 1.2 }}>{state}</p>
                                        <p style={{ fontSize: '10px', color: '#78614A' }}>{state} Explorer 🏅</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', marginBottom: '6px' }}>🔍</p>
                            <p style={{ fontSize: '12px', color: '#78614A', lineHeight: 1.5 }}>
                                Scan a KalaSetu tag to earn your first badge!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
    const location = useLocation()
    const isScan = location.pathname.startsWith('/scan/')

    // Minimal scan-page navbar
    if (isScan) {
        return (
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(249,246,240,0.94)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid #DDD3C0',
                padding: '0 20px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🪡</span>
                    <span className="gradient-text" style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '17px' }}>KalaSetu</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="tag-chip">✅ Verified Product</span>
                    <PassportButton />
                </div>
            </nav>
        )
    }

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: 'rgba(249,246,240,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid #DDD3C0',
            padding: '0 28px', height: '62px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 8px rgba(80,40,10,0.06)',
        }}>
            {/* Logo */}
            <Link to="/" id="nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ fontSize: '22px' }}>🪡</span>
                <span className="gradient-text" style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: '800', fontSize: '20px', letterSpacing: '0px',
                }}>KalaSetu</span>
            </Link>

            {/* Center nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <NavLink to="/" icon={<Palette size={15} />} label="Discover" active={location.pathname === '/'} />
                <NavLink to="/artsnap" icon={<Camera size={15} />} label="ArtSnap" active={location.pathname === '/artsnap'} />
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PassportButton />
                <Link to="/artisan" id="navbar-artisan-portal-btn" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '999px',
                        border: '1.5px solid #C45C1A',
                        background: '#C45C1A',
                        color: 'white', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                        boxShadow: '0 2px 10px rgba(196,92,26,0.22)',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F97316'; e.currentTarget.style.borderColor = '#F97316' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#C45C1A'; e.currentTarget.style.borderColor = '#C45C1A' }}
                    >
                        <User size={14} />
                        Artisan Portal
                    </button>
                </Link>
            </div>
        </nav>
    )
}

function NavLink({ to, icon, label, active }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <button style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px', border: 'none',
                background: active ? 'rgba(196,92,26,0.1)' : 'transparent',
                color: active ? '#C45C1A' : '#78614A',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: active ? '700' : '500', transition: 'all 0.2s',
            }}>
                {icon}
                {label}
            </button>
        </Link>
    )
}
