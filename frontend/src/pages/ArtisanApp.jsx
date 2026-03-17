import { useState, useRef } from 'react'
import API from '../api/client'

// --- Sub-components ---

function StepLogin({ onNext }) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [upi, setUpi] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        setError('')
        if (!name.trim()) return setError('Please enter your full name.')
        if (!phone.trim()) return setError('Please enter your phone number.')
        setLoading(true)
        try {
            // Try to register (or re-register — backend now upserts on phone)
            const res = await API.post('/artisans/', { name, phone_number: phone, upi_id: upi })
            onNext({ artisanId: res.data.id, artisanName: res.data.name || name })
        } catch (e) {
            // Fallback: look up existing artisan by phone
            try {
                const existing = await API.get(`/artisans/by-phone/${encodeURIComponent(phone)}`)
                onNext({ artisanId: existing.data.id, artisanName: existing.data.name })
            } catch {
                setError('Could not connect to server. Is the backend running at http://localhost:8000?')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Full Name</p>
                <input id="artisan-name-input" className="ks-input" placeholder="e.g., Rekha Devi" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Phone Number (used as login)</p>
                <input id="artisan-phone-input" className="ks-input" placeholder="+91 99999 99999" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>UPI ID (for tips) — Optional</p>
                <input id="artisan-upi-input" className="ks-input" placeholder="rekha@upi" value={upi} onChange={e => setUpi(e.target.value)} />
            </div>
            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px', padding: '12px 14px', color: '#b91c1c', fontSize: '13px',
                }}>
                    ⚠️ {error}
                </div>
            )}
            <button id="artisan-login-btn" className="btn-saffron" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Please wait…</> : '✅ Continue'}
            </button>
        </div>
    )
}


function StepUpload({ artisanId, artisanName, onNext }) {
    const [image, setImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [voice, setVoice] = useState(null)
    const [recording, setRecording] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const mediaRecorder = useRef(null)
    const chunks = useRef([])

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImage(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.current = new MediaRecorder(stream)
        chunks.current = []
        mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data)
        mediaRecorder.current.onstop = () => {
            const blob = new Blob(chunks.current, { type: 'audio/wav' })
            setVoice(blob)
        }
        mediaRecorder.current.start()
        setRecording(true)
    }

    const stopRecording = () => {
        mediaRecorder.current?.stop()
        setRecording(false)
    }

    const handleProcess = async () => {
        if (!image || !voice) return alert('Please capture a photo and record your story.')
        setLoading(true)
        const formData = new FormData()
        formData.append('artisan_id', artisanId)
        formData.append('image', image)
        formData.append('voice_note', voice, 'voice.wav')
        try {
            const res = await API.post('/artifacts/process', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            setResult(res.data)
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message))
        }
        setLoading(false)
    }

    if (result) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                    background: 'rgba(196,92,26,0.06)',
                    border: '1px solid rgba(196,92,26,0.25)',
                    borderRadius: '14px', padding: '20px',
                }}>
                    <p style={{ color: '#C45C1A', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>🤖 AI Story Preview</p>
                    <p style={{ fontSize: '13px', lineHeight: '1.75', color: '#3C2810' }}>{result.story_preview}</p>
                    <p style={{ color: '#B45309', fontSize: '12px', marginTop: '10px', fontWeight: '600' }}>
                        Art Form Detected: <strong>{result.art_form}</strong>
                    </p>
                </div>
                <button id="approve-story-btn" className="btn-saffron" onClick={() => onNext(result.artifact_id)}>
                    ✅ Approve Story &amp; Generate QR
                </button>
                <p style={{ textAlign: 'center', color: '#78614A', fontSize: '12px' }}>
                    By approving, your story will be visible to buyers who scan your tag.
                </p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Image upload */}
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>📸 Photo of your craft</p>
                <label htmlFor="craft-image-input" style={{ cursor: 'pointer' }}>
                    <div style={{
                        minHeight: '140px', borderRadius: '14px',
                        border: `2px dashed ${imagePreview ? '#C45C1A' : '#DDD3C0'}`,
                        background: '#F9F6F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: '8px', textAlign: 'center', padding: '16px',
                        transition: 'border-color 0.2s',
                    }}>
                        {imagePreview
                            ? <img src={imagePreview} alt="craft preview" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                            : <><div style={{ fontSize: '32px' }}>🖼️</div><p style={{ color: '#78614A', fontSize: '13px' }}>Tap to choose a photo</p></>
                        }
                    </div>
                </label>
                <input id="craft-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>

            {/* Voice recording */}
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>🎤 Record your story</p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {!recording ? (
                        <button id="start-record-btn" className="btn-saffron" style={{ flex: 1 }} onClick={startRecording}>
                            🔴 Start Recording
                        </button>
                    ) : (
                        <button id="stop-record-btn" className="btn-saffron recording" style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }} onClick={stopRecording}>
                            ⏹ Stop Recording
                        </button>
                    )}
                    {voice && <span style={{ fontSize: '20px' }}>✅</span>}
                </div>
                {voice && <p style={{ color: '#4D7C0F', fontSize: '12px', marginTop: '8px', fontWeight: '500' }}>Voice note captured! Ready to process.</p>}
            </div>

            <button
                id="process-artifact-btn"
                className="btn-saffron"
                onClick={handleProcess}
                disabled={loading || !image || !voice}
                style={{ opacity: (!image || !voice) ? 0.5 : 1 }}
            >
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Processing with AI…</> : '✨ Generate My Story'}
            </button>
        </div>
    )
}

function StepQR({ artifactId, onDone }) {
    const [loading, setLoading] = useState(false)
    const [qrData, setQrData] = useState(null)

    const generateQR = async () => {
        setLoading(true)
        try {
            await API.post(`/artifacts/${artifactId}/approve`)
            const res = await API.post(`/artifacts/${artifactId}/generate-qr`)
            setQrData(res.data)
        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message))
        }
        setLoading(false)
    }

    if (qrData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
                <div className="pulse-glow" style={{ borderRadius: '16px', padding: '16px', background: 'white', border: '1px solid #DDD3C0', display: 'inline-block', margin: '0 auto' }}>
                    <img src={qrData.qr_base64} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
                <p style={{ color: '#4D7C0F', fontWeight: '700', fontSize: '16px' }}>🎉 Your Living Tag is Ready!</p>
                <p style={{ color: '#78614A', fontSize: '13px' }}>
                    Print and attach this QR to your product. Buyers will be taken to your story page.
                </p>
                <a href={qrData.qr_base64} download="kalasetu-qr.png" style={{ textDecoration: 'none' }}>
                    <button id="download-qr-btn" className="btn-saffron" style={{ width: '100%' }}>⬇️ Download QR Code</button>
                </a>
                <button
                    id="add-another-btn"
                    onClick={onDone}
                    style={{
                        width: '100%', padding: '12px 24px', borderRadius: '999px',
                        border: '1.5px solid #DDD3C0', background: '#fff',
                        color: '#78614A', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C45C1A'; e.currentTarget.style.color = '#C45C1A' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD3C0'; e.currentTarget.style.color = '#78614A' }}
                >
                    + Add Another Craft
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px' }}>🏷️</div>
            <p style={{ fontFamily: "'Playfair Display', serif", color: '#2C1A0E', fontSize: '17px', fontWeight: '700' }}>Generate Living Tag</p>
            <p style={{ color: '#78614A', fontSize: '13px', lineHeight: '1.7' }}>
                Approving the story will make it visible to buyers. A unique QR code will be generated for your product.
            </p>
            <button id="generate-qr-btn" className="btn-saffron" onClick={generateQR} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Generating…</> : '🏷️ Approve & Generate QR'}
            </button>
        </div>
    )
}

// --- Main ArtisanApp ---
const STEPS = ['Register', 'Upload & Process', 'Your Tag']

export default function ArtisanApp() {
    const [step, setStep] = useState(0)
    const [artisanData, setArtisanData] = useState(null)
    const [artifactId, setArtifactId] = useState(null)

    const handleLoginNext = (data) => { setArtisanData(data); setStep(1) }
    const handleUploadNext = (id) => { setArtifactId(id); setStep(2) }
    const handleDone = () => { setStep(1); setArtifactId(null) }

    return (
        <div style={{ minHeight: '100vh', background: '#F9F6F0', paddingBottom: '48px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>🎨</p>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: '800', fontSize: '24px', color: '#2C1A0E',
                    }}>
                        {artisanData ? `Welcome, ${artisanData.artisanName}` : 'Artisan Portal'}
                    </h2>
                    <p style={{ color: '#78614A', fontSize: '13px', marginTop: '4px' }}>{STEPS[step]}</p>
                </div>

                {/* Step dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
                    ))}
                </div>

                {/* Card */}
                <div style={{
                    background: '#fff', border: '1px solid #DDD3C0',
                    borderRadius: '20px', padding: '28px',
                    boxShadow: '0 2px 16px rgba(80,40,10,0.07)',
                }}>
                    {step === 0 && <StepLogin onNext={handleLoginNext} />}
                    {step === 1 && artisanData && <StepUpload artisanId={artisanData.artisanId} artisanName={artisanData.artisanName} onNext={handleUploadNext} />}
                    {step === 2 && artifactId && <StepQR artifactId={artifactId} onDone={handleDone} />}
                </div>
            </div>
        </div>
    )
}
