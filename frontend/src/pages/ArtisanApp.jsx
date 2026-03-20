import { useState, useRef, useEffect } from 'react'
import API from '../api/client'
import DialectBadge from '../components/DialectBadge'

// ── Story Strength Meter
function StrengthMeter({ score, grade }) {
    const getColor = (s) => s >= 80 ? '#4D7C0F' : s >= 60 ? '#C45C1A' : s >= 40 ? '#B45309' : '#9CA3AF'
    const color = getColor(score)
    const label = grade || (score >= 80 ? 'Master' : score >= 60 ? 'Expert' : score >= 40 ? 'Rising' : 'Beginner')
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#78614A', fontWeight: '600' }}>Story Strength</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color }}>{score}/100 · {label}</span>
            </div>
            <div style={{ height: '8px', background: '#F0EAE0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${score}%`, background: color,
                    borderRadius: '999px', transition: 'width 1s ease-out'
                }} />
            </div>
        </div>
    )
}

// ── Mentor Card
function MentorCard({ mentor }) {
    const [lang, setLang] = useState('hi')
    if (!mentor) return null

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FFF8F0, #FFF3E0)',
            border: '1px solid rgba(196,92,26,0.2)',
            borderRadius: '16px', padding: '20px', marginTop: '16px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🤖</span>
                    <p style={{ fontWeight: '800', color: '#C45C1A', fontSize: '14px' }}>
                        {lang === 'hi' ? 'AI मेंटर फीडबैक' : 'AI Mentor Feedback'}
                    </p>
                </div>
                <button onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')} style={{
                    background: 'rgba(196,92,26,0.1)', border: '1px solid rgba(196,92,26,0.2)',
                    color: '#C45C1A', borderRadius: '999px', padding: '4px 10px',
                    fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                }}>
                    {lang === 'hi' ? 'English' : 'हिंदी'}
                </button>
            </div>

            <p style={{ color: '#2C1A0E', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
                {lang === 'hi' ? mentor.praise_hi : mentor.praise_en}
            </p>

            <StrengthMeter score={mentor.story_strength} grade={lang === 'hi' ? mentor.grade_hi : mentor.grade} />

            {mentor.tips.slice(0, 3).map((tip, i) => (
                <div key={i} style={{
                    background: 'white', borderRadius: '10px', padding: '12px',
                    marginBottom: '8px', border: '1px solid #F0EAE0',
                    display: 'flex', gap: '10px', alignItems: 'flex-start'
                }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{tip.icon}</span>
                    <div>
                        <p style={{ fontWeight: '700', fontSize: '12px', color: '#2C1A0E', marginBottom: '2px' }}>
                            {lang === 'hi' ? tip.title_hi : tip.title_en}
                        </p>
                        <p style={{ fontSize: '12px', color: '#78614A', lineHeight: '1.5' }}>
                            {lang === 'hi' ? tip.message_hi : tip.message_en}
                        </p>
                        {tip.score_boost > 0 && (
                            <span style={{
                                display: 'inline-block', marginTop: '4px',
                                background: 'rgba(77,124,15,0.1)', color: '#4D7C0F',
                                fontSize: '11px', fontWeight: '700', padding: '2px 8px',
                                borderRadius: '999px'
                            }}>
                                {lang === 'hi' ? `+${tip.score_boost} अंक मिलेंगे` : `+${tip.score_boost} pts if you do this`}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            <div style={{
                background: 'rgba(196,92,26,0.06)', borderRadius: '10px',
                padding: '10px 12px', marginTop: '4px'
            }}>
                <p style={{ fontSize: '12px', color: '#C45C1A', fontWeight: '700' }}>
                    🎯 {lang === 'hi' ? 'अगला लक्ष्य: ' : 'Next Goal: '}
                    {lang === 'hi' ? mentor.next_goal_hi : mentor.next_goal_en}
                </p>
            </div>
        </div>
    )
}

// ── Impact Dashboard
function ImpactDashboard() {
    const [stats, setStats] = useState(null)
    const [lang, setLang] = useState('en')

    useEffect(() => {
        API.get('/artisans/').then(res => {
            const artisans = res.data || []
            setStats({
                artisans: artisans.length,
                crafts: artisans.length * 2,
                states: Math.min(artisans.length, 8),
                stories: artisans.length * 2,
            })
        }).catch(() => {
            setStats({ artisans: 3, crafts: 7, states: 4, stories: 6 })
        })
    }, [])

    const t = {
        en: {
            title: 'KalaSetu Impact',
            sub: 'Bridging artisans and the world',
            artisans: 'Artisans Registered',
            crafts: 'Crafts Digitized',
            states: 'States Reached',
            stories: 'Stories Told',
            toggle: 'हिंदी में देखें',
        },
        hi: {
            title: 'कलासेतु का प्रभाव',
            sub: 'कारीगरों और दुनिया के बीच सेतु',
            artisans: 'पंजीकृत कारीगर',
            crafts: 'डिजिटल कृतियाँ',
            states: 'राज्यों तक पहुँच',
            stories: 'कहानियाँ सुनाई गईं',
            toggle: 'View in English',
        }
    }[lang]

    const metrics = stats ? [
        { icon: '👨‍🎨', value: stats.artisans, label: t.artisans, color: '#C45C1A' },
        { icon: '🎨', value: stats.crafts, label: t.crafts, color: '#7C3AED' },
        { icon: '📍', value: stats.states, label: t.states, color: '#0369A1' },
        { icon: '📖', value: stats.stories, label: t.stories, color: '#4D7C0F' },
    ] : []

    return (
        <div style={{
            background: 'linear-gradient(135deg, #2C1A0E, #4A2C14)',
            borderRadius: '20px', padding: '24px', marginBottom: '24px', color: 'white'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
                        {t.title}
                    </h2>
                    <p style={{ fontSize: '12px', opacity: 0.7 }}>{t.sub}</p>
                </div>
                <button onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')} style={{
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white', borderRadius: '999px', padding: '6px 12px',
                    fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                }}>{t.toggle}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {metrics.map((m, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
                        padding: '14px', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{m.icon}</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{m.label}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Growth Score
function GrowthScore({ artisanId }) {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        if (!artisanId) return
        API.get(`/mentor/stats/${artisanId}`).then(res => setStats(res.data)).catch(() => {
            setStats({ total_artifacts: 1, approved_stories: 1, average_story_strength: 55, total_tips_received: 0 })
        })
    }, [artisanId])

    if (!stats) return null

    const growthPct = Math.min(
        ((stats.total_artifacts * 10) + (stats.approved_stories * 15) + (stats.average_story_strength * 0.5)), 100
    )

    return (
        <div style={{
            background: 'white', border: '1px solid #DDD3C0', borderRadius: '14px',
            padding: '16px', marginBottom: '16px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontWeight: '800', fontSize: '13px', color: '#2C1A0E' }}>📈 Your Growth Score</p>
                <span style={{
                    background: 'rgba(196,92,26,0.1)', color: '#C45C1A',
                    fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px'
                }}>{Math.round(growthPct)}%</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                    { label: 'Crafts', value: stats.total_artifacts, icon: '🎨' },
                    { label: 'Stories', value: stats.approved_stories, icon: '📖' },
                    { label: 'Avg Score', value: stats.average_story_strength, icon: '⭐' },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: '#F9F6F0', borderRadius: '10px', padding: '10px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '18px' }}>{s.icon}</div>
                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#2C1A0E' }}>{s.value}</div>
                        <div style={{ fontSize: '10px', color: '#78614A' }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Step Login
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
            const res = await API.post('/artisans/', { name, phone_number: phone, upi_id: upi })
            localStorage.setItem('kalasetu_artisan_id', res.data.id)
            localStorage.setItem('kalasetu_artisan_name', res.data.name)
            onNext({ artisanId: res.data.id, artisanName: res.data.name || name })
        } catch {
            try {
                const existing = await API.get(`/artisans/by-phone/${encodeURIComponent(phone)}`)
                localStorage.setItem('kalasetu_artisan_id', existing.data.id)
                localStorage.setItem('kalasetu_artisan_name', existing.data.name)
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
                <input className="ks-input" placeholder="e.g., Rekha Devi" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Phone Number</p>
                <input className="ks-input" placeholder="+91 99999 99999" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>UPI ID (for tips) — Optional</p>
                <input className="ks-input" placeholder="rekha@upi" value={upi} onChange={e => setUpi(e.target.value)} />
            </div>
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 14px', color: '#b91c1c', fontSize: '13px' }}>
                    ⚠️ {error}
                </div>
            )}
            <button className="btn-saffron" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Please wait…</> : '✅ Continue'}
            </button>
        </div>
    )
}

// ── Step Upload
function StepUpload({ artisanId, artisanName, onNext }) {
    const [image, setImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [voice, setVoice] = useState(null)
    const [recording, setRecording] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [mentor, setMentor] = useState(null)
    const [dialectData, setDialectData] = useState(null)  // ← Dialect state here at top
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
            const blob = new Blob(chunks.current, { type: 'audio/webm' })
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
        formData.append('voice_note', voice, 'voice.webm')
        try {
            const res = await API.post('/artifacts/process', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

            // Fetch real transcript from DB
            const storyRes = await API.get(`/artifacts/${res.data.artifact_id}`)
            const transcript = storyRes.data?.story?.raw_transcript || ''
            const storyEnglish = storyRes.data?.story?.generated_narrative_english || res.data.story_preview

            // Show AI generated story, with transcript as fallback only
            setResult({ ...res.data, story_preview: storyEnglish || transcript })

            // ── Dialect Intelligence — capture from API response
            if (res.data.dialect_intelligence) {
                setDialectData(res.data.dialect_intelligence)
            }

            // ── AI Mentor
            try {
                const mentorRes = await API.post('/mentor/analyze', {
                    transcript: transcript,
                    art_form: res.data.art_form || 'Indian Craft',
                    story_english: storyEnglish,
                    artisan_id: artisanId,
                })
                setMentor(mentorRes.data)
            } catch (e) {
                console.warn('Mentor failed:', e)
            }

        } catch (e) {
            alert('Error: ' + (e.response?.data?.detail || e.message))
        }
        setLoading(false)
    }

    if (result) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Story Preview */}
                <div style={{
                    background: 'rgba(196,92,26,0.06)', border: '1px solid rgba(196,92,26,0.25)',
                    borderRadius: '14px', padding: '20px',
                }}>
                    <p style={{ color: '#C45C1A', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>🎤 Your Story (Transcribed by AI)</p>
                    <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#3C2810' }}>{result.story_preview}</p>
                    <p style={{ color: '#B45309', fontSize: '12px', marginTop: '10px', fontWeight: '600' }}>
                        Art Form: <strong>{result.art_form}</strong>
                    </p>
                </div>

                {/* Dialect Intelligence Badge ← NEW */}
                <DialectBadge dialectIntelligence={dialectData} />

                {/* AI Mentor */}
                <MentorCard mentor={mentor} />

                <button className="btn-saffron" onClick={() => onNext(result.artifact_id)}>
                    ✅ Approve Story & Generate QR
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>📸 Photo of your craft</p>
                <label htmlFor="craft-image-input" style={{ cursor: 'pointer' }}>
                    <div style={{
                        minHeight: '140px', borderRadius: '14px',
                        border: `2px dashed ${imagePreview ? '#C45C1A' : '#DDD3C0'}`,
                        background: '#F9F6F0', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexDirection: 'column', gap: '8px',
                        textAlign: 'center', padding: '16px',
                    }}>
                        {imagePreview
                            ? <img src={imagePreview} alt="craft preview" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                            : <><div style={{ fontSize: '32px' }}>🖼️</div><p style={{ color: '#78614A', fontSize: '13px' }}>Tap to choose a photo</p></>
                        }
                    </div>
                </label>
                <input id="craft-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>

            <div>
                <p style={{ color: '#78614A', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>🎤 Record your story</p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {!recording ? (
                        <button className="btn-saffron" style={{ flex: 1 }} onClick={startRecording}>🔴 Start Recording</button>
                    ) : (
                        <button className="btn-saffron" style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }} onClick={stopRecording}>⏹ Stop Recording</button>
                    )}
                    {voice && <span style={{ fontSize: '20px' }}>✅</span>}
                </div>
                {voice && <p style={{ color: '#4D7C0F', fontSize: '12px', marginTop: '8px', fontWeight: '500' }}>Voice note captured! Ready to process.</p>}
            </div>

            <button className="btn-saffron" onClick={handleProcess} disabled={loading || !image || !voice} style={{ opacity: (!image || !voice) ? 0.5 : 1 }}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Processing with AI…</> : '✨ Generate My Story'}
            </button>
        </div>
    )
}

// ── Step QR
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
                <a href={qrData.qr_base64} download="kalasetu-qr.png" style={{ textDecoration: 'none' }}>
                    <button className="btn-saffron" style={{ width: '100%' }}>⬇️ Download QR Code</button>
                </a>
                <button onClick={onDone} style={{
                    width: '100%', padding: '12px 24px', borderRadius: '999px',
                    border: '1.5px solid #DDD3C0', background: '#fff',
                    color: '#78614A', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
                }}>+ Add Another Craft</button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px' }}>🏷️</div>
            <p style={{ fontFamily: "'Playfair Display', serif", color: '#2C1A0E', fontSize: '17px', fontWeight: '700' }}>Generate Living Tag</p>
            <button className="btn-saffron" onClick={generateQR} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 20, height: 20 }} />Generating…</> : '🏷️ Approve & Generate QR'}
            </button>
        </div>
    )
}

// ── Main
const STEPS = ['Register', 'Upload & Process', 'Your Tag']

export default function ArtisanApp() {
    const [step, setStep] = useState(0)
    const [artisanData, setArtisanData] = useState(null)
    const [artifactId, setArtifactId] = useState(null)

    return (
        <div style={{ minHeight: '100vh', background: '#F9F6F0', paddingBottom: '48px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }}>

                {step === 0 && <ImpactDashboard />}

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>🎨</p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: '800', fontSize: '24px', color: '#2C1A0E' }}>
                        {artisanData ? `Welcome, ${artisanData.artisanName}` : 'Artisan Portal'}
                    </h2>
                    <p style={{ color: '#78614A', fontSize: '13px', marginTop: '4px' }}>{STEPS[step]}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
                    ))}
                </div>

                {step === 1 && artisanData && <GrowthScore artisanId={artisanData.artisanId} />}

                <div style={{
                    background: '#fff', border: '1px solid #DDD3C0',
                    borderRadius: '20px', padding: '28px',
                    boxShadow: '0 2px 16px rgba(80,40,10,0.07)',
                }}>
                    {step === 0 && <StepLogin onNext={d => { setArtisanData(d); setStep(1) }} />}
                    {step === 1 && artisanData && <StepUpload artisanId={artisanData.artisanId} artisanName={artisanData.artisanName} onNext={id => { setArtifactId(id); setStep(2) }} />}
                    {step === 2 && artifactId && <StepQR artifactId={artifactId} onDone={() => { setStep(1); setArtifactId(null) }} />}
                </div>
            </div>
        </div>
    )
}
