import { useState, useRef } from 'react'
import API from '../api/client'
import { Link } from 'react-router-dom'

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
            alert('Error: ' + (e.response?.data?.detail || e.message))
        }
        setLoading(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1625, #251E35)', padding: '0 0 48px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '20px' }}>←</Link>
                    <div>
                        <h1 style={{ fontWeight: '800', fontSize: '22px' }}>📷 <span className="gradient-text">ArtSnap</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Identify any Indian craft from a photo</p>
                    </div>
                </div>

                {/* Upload area */}
                <label htmlFor="artsnap-image-input" style={{ cursor: 'pointer', display: 'block', marginBottom: '20px' }}>
                    <div className="glass-card" style={{
                        minHeight: '240px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '12px',
                        borderStyle: 'dashed',
                        borderColor: preview ? 'rgba(255,107,26,0.4)' : 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                    }}>
                        {preview ? (
                            <img src={preview} alt="craft" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '16px' }} />
                        ) : (
                            <>
                                <div style={{ fontSize: '48px' }}>📷</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
                                    Tap to snap or upload a photo<br />of any Indian handicraft
                                </p>
                                <span className="tag-chip">Warli • Madhubani • Dhokra · Pattachitra…</span>
                            </>
                        )}
                    </div>
                </label>
                <input ref={inputRef} id="artsnap-image-input" type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />

                {/* Identify button */}
                <button
                    id="artsnap-identify-btn"
                    className="btn-saffron"
                    style={{ width: '100%', marginBottom: '24px', opacity: !image ? 0.5 : 1 }}
                    onClick={handleIdentify}
                    disabled={loading || !image}
                >
                    {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Analyzing craft...</> : '🔍 Identify This Craft'}
                </button>

                {/* Results */}
                {result && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Classification result */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identified As</p>
                            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
                                <span className="gradient-text">{result.identified_art_form}</span>
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '12px' }}>
                                <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                                    <div style={{ width: `${(result.confidence * 100).toFixed(0)}%`, height: '100%', background: 'linear-gradient(90deg, var(--saffron), var(--gold))', borderRadius: '999px' }} />
                                </div>
                                <span style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: '600' }}>{(result.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {result.tags?.map(t => <span key={t} className="tag-chip">#{t}</span>)}
                            </div>
                        </div>

                        {/* Artisan recommendations */}
                        {result.artisan_recommendations?.length > 0 && (
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px', fontWeight: '600' }}>
                                    🎨 Artisans Making This Craft
                                </p>
                                {result.artisan_recommendations.map((a, i) => (
                                    <div key={a.id || i} className="glass-card" style={{ padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', marginBottom: '4px' }}>{a.name}</p>
                                            {a.location_lat && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                    📍 {a.location_lat.toFixed(2)}, {a.location_long.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        {a.upi_id && (
                                            <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: '600' }}>UPI ✅</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Try another */}
                        <button
                            id="artsnap-retry-btn"
                            className="btn-teal"
                            style={{ width: '100%' }}
                            onClick={() => { setImage(null); setPreview(null); setResult(null); }}
                        >
                            📷 Try Another Photo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
