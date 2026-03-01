import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Camera, Palette, User, Map } from 'lucide-react'

// ── localStorage badge helpers ────────────────────────────────────────────────
const BADGE_KEY = 'kalasetu_badges'
function getBadges() {
    try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]') } catch { return [] }
}

// State → flag emoji map (best-effort)
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

    // Poll localStorage on mount + whenever window regains focus
    useEffect(() => {
        const refresh = () => setBadges(getBadges())
        refresh()
        window.addEventListener('focus', refresh)
        // Also re-check every 2s so toast-unlocked badges appear without reload
        const interval = setInterval(refresh, 2000)
        return () => { window.removeEventListener('focus', refresh); clearInterval(interval) }
    }, [])

    // Close dropdown on outside click
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
                    padding: '8px 14px', borderRadius: '10px',
                    border: hasBadges ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: hasBadges ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                    color: hasBadges ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    transition: 'all 0.2s', position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = hasBadges ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = hasBadges ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)' }}
            >
                <Map size={14} />
                Passport

                {/* Notification dot */}
                {hasBadges && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: 'var(--saffron)',
                        border: '2px solid rgba(26,22,37,0.95)',
                        animation: 'pulse 2s infinite',
                    }} />
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    minWidth: '220px', zIndex: 200,
                    background: 'rgba(30,24,46,0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <p style={{ fontWeight: '800', fontSize: '13px', color: 'var(--gold)' }}>🗺️ Cultural Passport</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                            {hasBadges ? `${badges.length} state${badges.length > 1 ? 's' : ''} explored` : 'No badges yet'}
                        </p>
                    </div>

                    {hasBadges ? (
                        <div style={{ padding: '8px 0', maxHeight: '200px', overflowY: 'auto' }}>
                            {badges.map((state, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 16px',
                                    borderBottom: i < badges.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                }}>
                                    <span style={{ fontSize: '18px' }}>{stateEmoji(state)}</span>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>{state}</p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{state} Explorer 🏅</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', marginBottom: '6px' }}>🔍</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
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

    // Minimal scan-page navbar — still show Passport so user sees badge earned
    if (isScan) {
        return (
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(26, 22, 37, 0.85)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 20px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🪡</span>
                    <span className="gradient-text" style={{ fontWeight: '800', fontSize: '16px' }}>KalaSetu</span>
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
            background: 'rgba(26, 22, 37, 0.88)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            padding: '0 24px', height: '60px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
            {/* Logo */}
            <Link to="/" id="nav-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🪡</span>
                <span className="gradient-text" style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.3px' }}>KalaSetu</span>
            </Link>

            {/* Center nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <NavLink to="/" icon={<Palette size={15} />} label="Discover" active={location.pathname === '/'} />
                <NavLink to="/artsnap" icon={<Camera size={15} />} label="ArtSnap" active={location.pathname === '/artsnap'} />
            </div>

            {/* Right: Passport + Artisan Portal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PassportButton />
                <Link to="/artisan" id="navbar-artisan-portal-btn" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '10px',
                        border: '1px solid rgba(255, 107, 26, 0.5)',
                        background: 'rgba(255, 107, 26, 0.1)',
                        color: 'var(--saffron)', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,26,0.22)'; e.currentTarget.style.borderColor = 'var(--saffron)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,26,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,107,26,0.5)' }}
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
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: active ? '600' : '400', transition: 'all 0.2s',
            }}>
                {icon}
                {label}
            </button>
        </Link>
    )
}
