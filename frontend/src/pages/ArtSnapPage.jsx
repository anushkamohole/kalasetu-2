import { useState, useRef } from 'react'
import API from '../api/client'
import { Link } from 'react-router-dom'
import { Camera, ArrowLeft, Search, RotateCcw, CheckCircle2 } from 'lucide-react'

export default function ArtSnapPage() {
    const [image, setImage] = useState(null)
    const [preview, setPreview] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null)

    const handleImage = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImage(file)
        setPreview(URL.createObjectURL(file))
        setResult(null)
    }

    const handleIdentify = async () => {
        if (!image) return
        setLoading(true)
        const formData = new FormData()
        formData.append('image', image)
        try {
            const res = await API.post('/artsnap/identify', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            setResult(res.data)
        } catch (e) {
            console.error('[ArtSnap] Backend API failed:', e)
            alert('Error: ' + (e.response?.data?.detail || e.message))
        }
        setLoading(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F9F6F0', paddingBottom: '56px' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 24px' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <Link to="/" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#fff', border: '1px solid #DDD3C0',
                        color: '#78614A', textDecoration: 'none',
                        boxShadow: '0 1px 4px rgba(80,40,10,0.08)',
                        flexShrink: 0,
                    }}>
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: '800', fontSize: '24px', color: '#2C1A0E', lineHeight: 1.1,
                        }}>
                            📷 <span className="gradient-text">ArtSnap</span>
                        </h1>
                        <p style={{ color: '#78614A', fontSize: '13px', marginTop: '2px' }}>
                            Identify any Indian craft from a photo
                        </p>
                    </div>
                </div>

                {/* ── Upload area ── */}
                <label htmlFor="artsnap-image-input" style={{ cursor: 'pointer', display: 'block', marginBottom: '16px' }}>
                    <div style={{
                        minHeight: '260px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '14px',
                        borderRadius: '20px',
                        border: `2px dashed ${preview ? '#C45C1A' : '#DDD3C0'}`,
                        background: preview ? '#fff' : 'rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                        boxShadow: '0 2px 12px rgba(80,40,10,0.06)',
                    }}>
                        {preview ? (
                            <img
                                src={preview}
                                alt="craft"
                                style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }}
                            />
                        ) : (
                            <>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: 'rgba(196,92,26,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Camera size={32} color="#C45C1A" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: '#2C1A0E', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                                        Tap to snap or upload a photo
                                    </p>
                                    <p style={{ color: '#78614A', fontSize: '13px' }}>of any Indian handicraft</p>
                                </div>
                                <span className="tag-chip">Warli · Madhubani · Dhokra · Pattachitra…</span>
                            </>
                        )}
                    </div>
                </label>
                <input
                    ref={inputRef}
                    id="artsnap-image-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImage}
                    style={{ display: 'none' }}
                />

                {/* ── Identify button ── */}
                <button
                    id="artsnap-identify-btn"
                    onClick={handleIdentify}
                    disabled={loading || !image}
                    style={{
                        width: '100%',
                        marginBottom: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        padding: '15px 24px',
                        borderRadius: '999px',
                        border: 'none',
                        background: !image ? '#E8E0D0' : 'linear-gradient(135deg, #C45C1A, #A04814)',
                        color: !image ? '#B09070' : 'white',
                        cursor: !image ? 'not-allowed' : 'pointer',
                        fontSize: '16px', fontWeight: '700',
                        boxShadow: image ? '0 4px 18px rgba(196,92,26,0.32)' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {loading
                        ? <><span className="spinner" style={{ width: 20, height: 20 }} />Analysing craft…</>
                        : <><Search size={18} />Identify This Craft</>
                    }
                </button>

                {/* ── Results ── */}
                {result && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Classification card */}
                        <div style={{
                            background: '#fff',
                            border: '1px solid #DDD3C0',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 2px 12px rgba(80,40,10,0.07)',
                        }}>
                            {/* "Identified As" label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <CheckCircle2 size={14} color="#4D7C0F" />
                                <p style={{ color: '#4D7C0F', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                    Identified As
                                </p>
                            </div>

                            <h2 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '30px', fontWeight: '800',
                                marginBottom: '14px',
                            }}>
                                <span className="gradient-text">{result.identified_art_form}</span>
                            </h2>

                            {/* Cultural Story (Gemini Live) */}
                            {result.cultural_story && (
                                <p style={{ color: '#3C2810', fontSize: '15px', lineHeight: '1.6', marginBottom: '10px' }}>
                                    {result.cultural_story}
                                </p>
                            )}
                        </div>

                        {/* Artisan recommendations */}
                        {result.artisan_recommendations && (
                            <div>
                                <p style={{ color: '#2C1A0E', fontSize: '13px', marginBottom: '10px', fontWeight: '700' }}>
                                    🎨 Artisans Making This Craft
                                </p>
                                {(() => {
                                    const allArtisans = result.artisan_recommendations;
                                    const filteredArtisans = allArtisans.filter(artisan =>
                                        (artisan.craft_type || artisan.art_form || '').toLowerCase() === result.identified_art_form.toLowerCase()
                                    );

                                    if (filteredArtisans.length === 0) {
                                        return (
                                            <div style={{ background: '#fff', border: '1px dashed #DDD3C0', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                                <p style={{ color: '#78614A', fontSize: '14px', margin: 0 }}>We are currently onboarding artisans for this specific craft.</p>
                                            </div>
                                        );
                                    }

                                    return filteredArtisans.map((a, i) => (
                                        <Link to={`/artisan/${a.id}`} key={a.id || i} style={{ textDecoration: 'none', display: 'block' }}>
                                            <div style={{
                                                background: '#fff',
                                                border: '1px solid #DDD3C0',
                                                borderRadius: '14px',
                                                padding: '16px',
                                                marginBottom: '10px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                boxShadow: '0 1px 6px rgba(80,40,10,0.05)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(80,40,10,0.1)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(80,40,10,0.05)'; }}
                                            >
                                                <div>
                                                    <p style={{ fontWeight: '700', color: '#2C1A0E', marginBottom: '4px' }}>{a.name}</p>
                                                    {a.location_lat && (
                                                        <p style={{ color: '#78614A', fontSize: '12px' }}>
                                                            📍 {a.location_lat.toFixed(2)}, {a.location_long.toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                                {a.upi_id && (
                                                    <span style={{
                                                        background: 'rgba(77,124,15,0.1)',
                                                        border: '1px solid rgba(77,124,15,0.3)',
                                                        color: '#4D7C0F',
                                                        borderRadius: '999px',
                                                        padding: '3px 10px',
                                                        fontSize: '12px', fontWeight: '600',
                                                    }}>
                                                        UPI ✅
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ));
                                })()}
                            </div>
                        )}

                        {/* Try another */}
                        <button
                            id="artsnap-retry-btn"
                            onClick={() => { setImage(null); setPreview(null); setResult(null) }}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '14px 24px',
                                borderRadius: '999px',
                                border: '1.5px solid #DDD3C0',
                                background: '#fff',
                                color: '#78614A', cursor: 'pointer',
                                fontSize: '15px', fontWeight: '600',
                                boxShadow: '0 1px 6px rgba(80,40,10,0.06)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C45C1A'; e.currentTarget.style.color = '#C45C1A' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD3C0'; e.currentTarget.style.color = '#78614A' }}
                        >
                            <RotateCcw size={16} />
                            Try Another Photo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
