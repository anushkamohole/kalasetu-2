import { useState, useRef } from 'react'
import API from '../api/client'

// --- Sub-components for each step ---

function StepLogin({ onNext }) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [upi, setUpi] = useState('')
    const [loading, setLoading] = useState(false)
    const [artisanId, setArtisanId] = useState(null)

    const handleSubmit = async () => {
        if (!name || !phone) return alert('Name and phone are required.')
        setLoading(true)
        try {
            const res = await API.post('/artisans/', { name, phone_number: phone, upi_id: upi })
            setArtisanId(res.data.id)
            onNext({ artisanId: res.data.id, artisanName: name })
        } catch (e) {
            // If artisan already exists, look them up
            try {
                const existing = await API.get(`/artisans/by-phone/${phone}`)
                onNext({ artisanId: existing.data.id, artisanName: existing.data.name })
            } catch {
                alert('Error: ' + (e.response?.data?.detail || e.message))
            }
        }
        setLoading(false)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Full Name</p>
                <input id="artisan-name-input" className="ks-input" placeholder="e.g., Rekha Devi" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Phone Number (used as login)</p>
                <input id="artisan-phone-input" className="ks-input" placeholder="+91 99999 99999" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>UPI ID (for tips) — Optional</p>
                <input id="artisan-upi-input" className="ks-input" placeholder="rekha@upi" value={upi} onChange={e => setUpi(e.target.value)} />
            </div>
            <button id="artisan-login-btn" className="btn-saffron" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : '✅ Continue'}
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
                <div className="glass-card" style={{ padding: '20px', borderColor: 'rgba(13,148,136,0.4)' }}>
                    <p style={{ color: 'var(--teal)', fontWeight: '600', marginBottom: '8px' }}>🤖 AI Story Preview</p>
                    <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-muted)' }}>{result.story_preview}</p>
                    <p style={{ color: 'var(--gold)', fontSize: '12px', marginTop: '8px' }}>Art Form Detected: <strong>{result.art_form}</strong></p>
                </div>
                <button id="approve-story-btn" className="btn-teal" onClick={() => onNext(result.artifact_id)}>
                    ✅ Approve Story & Generate QR
                </button>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    By approving, your story will be visible to buyers who scan your tag.
                </p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Image Upload */}
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>📸 Photo of your craft</p>
                <label htmlFor="craft-image-input" style={{ cursor: 'pointer' }}>
                    <div className="glass-card" style={{
                        padding: '20px',
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        minHeight: '140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {imagePreview
                            ? <img src={imagePreview} alt="craft preview" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                            : <><div style={{ fontSize: '32px' }}>🖼️</div><p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tap to choose a photo</p></>
                        }
                    </div>
                </label>
                <input id="craft-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>

            {/* Voice Recording */}
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>🎤 Record your story</p>
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
                {voice && <p style={{ color: 'var(--teal)', fontSize: '12px', marginTop: '8px' }}>Voice note captured! Ready to process.</p>}
            </div>

            <button id="process-artifact-btn" className="btn-saffron" onClick={handleProcess} disabled={loading || !image || !voice} style={{ opacity: (!image || !voice) ? 0.5 : 1 }}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Processing with AI...</> : '✨ Generate My Story'}
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
                <div className="pulse-glow" style={{ borderRadius: '16px', padding: '16px', background: 'white', display: 'inline-block', margin: '0 auto' }}>
                    <img src={qrData.qr_base64} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
                <p style={{ color: 'var(--teal)', fontWeight: '600' }}>🎉 Your Living Tag is Ready!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Print and attach this QR to your product. Buyers will be taken to your story page.</p>
                <a href={qrData.qr_base64} download="kalasetu-qr.png" style={{ textDecoration: 'none' }}>
                    <button id="download-qr-btn" className="btn-teal" style={{ width: '100%' }}>⬇️ Download QR Code</button>
                </a>
                <button id="add-another-btn" className="btn-saffron" onClick={onDone} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    + Add Another Craft
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px' }}>🏷️</div>
            <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Generate Living Tag</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>
                Approving the story will make it visible to buyers. A unique QR code will be generated for your product.
            </p>
            <button id="generate-qr-btn" className="btn-saffron" onClick={generateQR} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Generating...</> : '🏷️ Approve & Generate QR'}
            </button>
        </div>
    )
}

// --- Main ArtisanApp component ---
const STEPS = ['Register', 'Upload & Process', 'Your Tag']

export default function ArtisanApp() {
    const [step, setStep] = useState(0)
    const [artisanData, setArtisanData] = useState(null)
    const [artifactId, setArtifactId] = useState(null)

    const handleLoginNext = (data) => { setArtisanData(data); setStep(1) }
    const handleUploadNext = (id) => { setArtifactId(id); setStep(2) }
    const handleDone = () => { setStep(1); setArtifactId(null) }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1625, #251E35)' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <p style={{ fontSize: '28px' }}>🎨</p>
                    <h2 style={{ fontWeight: '700', fontSize: '22px' }}>
                        {artisanData ? `Welcome, ${artisanData.artisanName}` : 'Artisan Portal'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{STEPS[step]}</p>
                </div>

                {/* Step indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
                    ))}
                </div>

                {/* Step content */}
                <div className="glass-card" style={{ padding: '28px' }}>
                    {step === 0 && <StepLogin onNext={handleLoginNext} />}
                    {step === 1 && artisanData && <StepUpload artisanId={artisanData.artisanId} artisanName={artisanData.artisanName} onNext={handleUploadNext} />}
                    {step === 2 && artifactId && <StepQR artifactId={artifactId} onDone={handleDone} />}
                </div>
            </div>
        </div>
    )
}
