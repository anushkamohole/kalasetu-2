import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, ChevronLeft, Palette } from 'lucide-react'
import API from '../api/client'

const ART_FORM_DATA = {
    warli: {
        name: 'Warli Painting',
        origin: 'Maharashtra (Nasik, Palghar districts)',
        emoji: '🌿',
        gradient: 'linear-gradient(135deg, #7c2d12, #9a3412)',
        description: `Warli is among the oldest art traditions in the world — dating back to at least 2,500 BCE. 
    Practiced by the Warli tribe of Maharashtra's northern districts, these paintings use a stark white pigment 
    (made from rice paste) on mud-coloured backgrounds. The imagery is geometric and narrative: circles represent 
    the sun and moon, triangles the mountains and peaked roofs, and squares the sacred enclosures.
    Warli is never decorative for its own sake — every painting documents a community event, a harvest, 
    a wedding, or a prayer.`,
        techniques: ['Rice paste on dried cow dung walls', 'Bamboo stick as brush', 'Circle, triangle, square motifs'],
        gi_tag: 'Yes — Warli Painting, Maharashtra',
    },
    madhubani: {
        name: 'Madhubani (Mithila) Painting',
        origin: 'Bihar (Mithila region: Darbhanga, Madhubani, Sitamarhi)',
        emoji: '🌸',
        gradient: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)',
        description: `Madhubani paintings were originally created by women on the walls and floors of homes in the 
    Mithila region of Bihar. They centre around Hindu deities — Durga, Rama, Krishna — as well as nature, the 
    sun, moon, fish, turtles, and bamboo groves. The characteristic double-line border and the refusal to leave 
    any space empty (every gap is filled with flowers or dots) are its visual signature.
    After the 1934 earthquake devastated Mithila, artists began painting on paper and cloth to sell, 
    gradually bringing this private home practice into the global art world.`,
        techniques: ['Natural dyes from plants and minerals', 'Fingers, matchsticks, and brushes', 'No blank space — every gap filled'],
        gi_tag: 'Yes — Madhubani Painting, Bihar',
    },
    gond: {
        name: 'Gond Art',
        origin: 'Madhya Pradesh (Mandla, Dindori, Balaghat)',
        emoji: '🌳',
        gradient: 'linear-gradient(135deg, #14532d, #166534)',
        description: `The Gond people, one of India's largest tribal communities, believe that a good image brings 
    good luck. Their paintings are filled with trees, animals, birds, and the whole natural world — rendered in 
    dense dot-and-dash texture that gives their art its mesmerizing rhythmic quality. Every element — the scales 
    of a fish, the leaves of a tree — is filled with a different pattern.
    Gond art exploded into global consciousness through the work of Jangarh Singh Shyam in the 1980s, who with 
    simple paper and pen created a new visual language from tribal memory.`,
        techniques: ['Dot and dash fill patterns', 'Acrylic and natural pigments', 'Tree-of-life as central motif'],
        gi_tag: 'Under process',
    },
    pattachitra: {
        name: 'Pattachitra',
        origin: 'Odisha (Puri, Raghurajpur village)',
        emoji: '📜',
        gradient: 'linear-gradient(135deg, #581c87, #7e22ce)',
        description: `Pattachitra — literally "cloth picture" in Sanskrit — are sacred narrative paintings from 
    Odisha, traditionally created by the Chitrakar community of Raghurajpur village. They depict the stories 
    of Lord Jagannath, Vaishnava mythology, and the Panchatantra fables.
    The paintings are layered: first a canvas made from old cloth coated with chalk and gum, then 
    painted in vivid natural pigments (conch shell white, lamp black, yellow orpiment), and finished with 
    a lacquer made from kerosene lamp soot and tree resin. The border — called "Nali" — is mandatory.`,
        techniques: ['Tamarind seed paste canvas preparation', 'Natural stone and plant pigments', 'Lamp-black lacquer finish'],
        gi_tag: 'Yes — Pattachitra, Odisha',
    },
    dhokra: {
        name: 'Dhokra Metal Casting',
        origin: 'Chhattisgarh, West Bengal, Odisha, Jharkhand',
        emoji: '🔱',
        gradient: 'linear-gradient(135deg, #78350f, #b45309)',
        description: `Dhokra is among the world's oldest metal-casting traditions — the same lost-wax (cire perdue) 
    technique used to create the famous Dancing Girl of Mohenjo-daro over 4,000 years ago is still practised today 
    in tribal villages of Central India. Artisans build a wax sculpture, coat it in clay, melt the wax out, 
    and pour molten bronze in its place. The result is a unique, slightly rough-surfaced figure full of life.
    Dhokra figures — horses, elephants, deities, musicians — carry a raw energy unlike any refined metal craft.`,
        techniques: ['Lost-wax (cire perdue) casting', 'Brass and bronze alloy', 'Clay-and-dung mould'],
        gi_tag: 'Under process (state-level)',
    },
    kalamkari: {
        name: 'Kalamkari',
        origin: 'Andhra Pradesh (Srikalahasti, Machilipatnam)',
        emoji: '✒️',
        gradient: 'linear-gradient(135deg, #0f766e, #0d9488)',
        description: `Kalamkari means "pen work" — kalam (pen) + kari (craft). On cloth treated with myrobalan 
    and buffalo milk, artisans draw mythological stories using a bamboo pen dipped in fermented jaggery and iron 
    solution. The lines resist dye and create vivid narrative compositions.
    There are two styles: Srikalahasti (freehand, temple hanging) and Machilipatnam (block printed). 
    The natural dyes — indigo, turmeric, pomegranate rind, madder root — give Kalamkari its immortal earthy palette.`,
        techniques: ['Hand-drawn with bamboo pen', 'Natural dyes: indigo, turmeric, madder', 'Mordant resist printing'],
        gi_tag: 'Yes — Kalamkari, Andhra Pradesh',
    },
}

export default function ArtformDetails() {
    const { slug } = useParams()
    const art = ART_FORM_DATA[slug]
    const [artisans, setArtisans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchArtisans = async () => {
            try {
                const res = await API.get(`/artisans/?art_form=${art?.name || slug}`)
                setArtisans(res.data || [])
            } catch {
                setArtisans([])
            }
            setLoading(false)
        }
        if (art) fetchArtisans()
        else setLoading(false)
    }, [slug])

    if (!art) {
        return (
            <div style={{ minHeight: '100vh', background: '#1A1625', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎨</p>
                    <p style={{ fontWeight: '700', marginBottom: '8px' }}>Art form not found</p>
                    <Link to="/" style={{ color: 'var(--saffron)', textDecoration: 'none', fontSize: '14px' }}>← Back to Discover</Link>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#1A1625' }}>
            {/* Hero Banner */}
            <div style={{
                background: art.gradient,
                padding: '48px 24px 40px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <Link to="/" id="artform-back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px', marginBottom: '20px' }}>
                        <ChevronLeft size={14} /> Discover All Crafts
                    </Link>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{art.emoji}</div>
                    <h1 style={{ fontWeight: '900', fontSize: 'clamp(28px, 5vw, 44px)', color: 'white', marginBottom: '8px', lineHeight: '1.1' }}>
                        {art.name}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <MapPin size={13} /> {art.origin}
                    </p>
                    {art.gi_tag !== 'Under process' && art.gi_tag !== 'Under process (state-level)' && (
                        <div style={{ marginTop: '14px' }}>
                            <span className="tag-chip" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                                🏷️ GI Tagged
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.06, fontSize: '200px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '40px', lineHeight: 1 }}>
                    {art.emoji}
                </div>
            </div>

            {/* Body */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
                {/* Description */}
                <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                    <h2 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--gold)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        The Story of {art.name}
                    </h2>
                    <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.9', whiteSpace: 'pre-line' }}>
                        {art.description}
                    </p>
                </div>

                {/* Techniques */}
                <div className="glass-card" style={{ padding: '28px', marginBottom: '32px' }}>
                    <h2 style={{ fontWeight: '700', fontSize: '15px', color: 'var(--gold)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Palette size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Distinctive Techniques
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {art.techniques.map((t, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                padding: '12px 16px',
                                background: 'rgba(255,107,26,0.07)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,107,26,0.15)',
                            }}>
                                <span style={{ color: 'var(--saffron)', marginTop: '1px' }}>◆</span>
                                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Registered Artisans */}
                <h2 style={{ fontWeight: '800', fontSize: '20px', marginBottom: '16px' }}>
                    🎨 Registered Artisans
                </h2>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                        <div className="spinner" />
                    </div>
                ) : artisans.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {artisans.map((a) => (
                            <div key={a.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{a.name}</p>
                                    {a.state && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={11} /> {a.state}
                                        </p>
                                    )}
                                </div>
                                {a.upi_id && <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: '600' }}>UPI ✅</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                        <p style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            No artisans registered for {art.name} yet.<br />
                            Know a {art.name} artist? Share KalaSetu with them!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
