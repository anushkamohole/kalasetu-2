import { useState, useRef, useCallback, memo } from 'react'
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from 'react-simple-maps'
import { X, MapPin, Volume2 } from 'lucide-react'

/* ── India GeoJSON ─────────────────────────────────────────────────────────── */
const INDIA_TOPO_URL =
    'https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States'

/* ── State heritage data ──────────────────────────────────────────────────── */
const STATE_HERITAGE = {
    Rajasthan: {
        emoji: '🏰',
        crafts: ['Blue Pottery', 'Bandhani Tie-dye', 'Thewa Jewellery', 'Block Printing'],
        desc: "The land of magnificent forts and vibrant folk traditions. Rajasthan's crafts carry the spirit of the desert.",
        accent: '#C45C1A',
    },
    Gujarat: {
        emoji: '🧵',
        crafts: ['Patola Silk Weaving', 'Kutch Embroidery', 'Bandhani', 'Rogan Art'],
        desc: "Gujarat's textile legacy is unmatched — from the ikat excellence of Patola to the mirror-work of Kutch.",
        accent: '#B45309',
    },
    'West Bengal': {
        emoji: '🎨',
        crafts: ['Kantha Embroidery', 'Dokra Metal Craft', 'Patachitra', 'Terracotta'],
        desc: "A cradle of cultural renaissance. Bengal's artisans have documented epics on terracotta and cloth.",
        accent: '#0F766E',
    },
    Odisha: {
        emoji: '📜',
        crafts: ['Pattachitra', 'Dokra', 'Sambalpuri Ikat', 'Stone Carving'],
        desc: "Odisha's Pattachitra scrolls have told the stories of Lord Jagannath for centuries.",
        accent: '#7C3AED',
    },
    Maharashtra: {
        emoji: '🖌️',
        crafts: ['Warli Painting', 'Paithani Silk Sarees', 'Kolhapuri Chappals', 'Bidriware'],
        desc: "Maharashtra blends tribal artistry with royal weaves. Warli's geometric folk art is iconic worldwide.",
        accent: '#C0392B',
    },
    Bihar: {
        emoji: '🌸',
        crafts: ['Madhubani Painting', 'Sujani Embroidery', 'Tikuli Art', 'Sikki Grass Craft'],
        desc: "The birthplace of Madhubani art. Each painting is an entire cosmos of gods, nature, and womanhood.",
        accent: '#3730A3',
    },
    'Uttar Pradesh': {
        emoji: '🕌',
        crafts: ['Chikankari Embroidery', 'Zari-Zardozi', 'Banaras Silk', 'Brass Craft'],
        desc: "From Lucknow's Chikankari ateliers to Varanasi's looms — UP carries Mughal craft heritage alive.",
        accent: '#166534',
    },
    Karnataka: {
        emoji: '🥻',
        crafts: ['Mysore Silk', 'Bidriware', 'Channapatna Toys', 'Kasuti Embroidery'],
        desc: "Karnataka's Channapatna wooden toys and Bidri inlay work represent a tradition of intricate craftsmanship.",
        accent: '#C45C1A',
    },
    'Tamil Nadu': {
        emoji: '🏺',
        crafts: ['Kanjivaram Silk', 'Tanjore Painting', 'Bronze Casting', 'Kolam Art'],
        desc: "Tamil Nadu's artisans have shaped bronze gods, woven divine silks, and painted celestial panels for millennia.",
        accent: '#C0392B',
    },
    'Madhya Pradesh': {
        emoji: '🐘',
        crafts: ['Gond Painting', 'Chanderi Silk', 'Bagh Print', 'Dhokra'],
        desc: "Home to the Gond tribe's extraordinary tree-of-life paintings. Every dot is a prayer to nature.",
        accent: '#4D7C0F',
    },
    'Himachal Pradesh': {
        emoji: '🏔️',
        crafts: ['Kullu Shawls', 'Thangka Painting', 'Wood Carving', 'Chamba Rumal'],
        desc: "High in the Himalayas, artisans weave warmth into woollens and meditative stillness into Thangka paintings.",
        accent: '#0369A1',
    },
    Assam: {
        emoji: '🦢',
        crafts: ['Muga Silk', 'Mekhela Chador Weaving', 'Bamboo and Cane Craft', 'Xorai'],
        desc: "Assam's Muga silk — the golden thread of the Brahmaputra — is one of the rarest fabrics in the world.",
        accent: '#7C3AED',
    },
    Punjab: {
        emoji: '🌾',
        crafts: ['Phulkari Embroidery', 'Jutti Craft', 'Pottery', 'Durrie Weaving'],
        desc: "Punjab's Phulkari — literally 'flower work' — transforms cloth into explosions of silk-thread color.",
        accent: '#B45309',
    },
    Kerala: {
        emoji: '🥥',
        crafts: ['Kathakali Costumes', 'Coir Weaving', 'Nettoor Petti Lacquerware', 'Keralan Mural'],
        desc: "Kerala's artisans blend ritual, nature, and colour — from resplendent Kathakali headdresses to coconut-shell craft.",
        accent: '#166534',
    },
    Chhattisgarh: {
        emoji: '🔱',
        crafts: ['Dhokra Casting', 'Bell Metal Work', 'Bamboo Craft', 'Godna Tattoo Art'],
        desc: "Chhattisgarh is the heartland of Dhokra — the world's oldest lost-wax metal casting tradition.",
        accent: '#92400E',
    },
}

/* ── Map fill colours ─────────────────────────────────────────────────────── */
const DEFAULT_FILL = '#E5E0D8'   // warm beige for unselected states
const DEFAULT_STROKE = '#C8BCA8'  // subtle warm border

/* ── Chime via Web Audio API ─────────────────────────────────────────────── */
let audioCtx = null
function playChime(accentHex) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const ctx = audioCtx
        if (ctx.state === 'suspended') ctx.resume()
        const hueVal = parseInt(accentHex.replace('#', '').slice(0, 2), 16)
        const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]
        const freq = pentatonic[hueVal % pentatonic.length]
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const now = ctx.currentTime
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12)
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.16, now + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.1)
    } catch (_) { }
}

/* ── Memoised StateGeo ────────────────────────────────────────────────────── */
const StateGeo = memo(function StateGeo({ geo, accent, isSelected, isHovered, onEnter, onLeave, onClick }) {
    // Heritage fills: beige default → warm saffron hover → full accent selected
    const fill = isSelected
        ? (accent || '#C45C1A')
        : isHovered
            ? (accent ? accent + 'BB' : '#C45C1ABB')
            : DEFAULT_FILL

    const strokeColor = isHovered || isSelected
        ? (accent || '#C45C1A')
        : DEFAULT_STROKE

    return (
        <Geography
            geography={geo}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onClick={onClick}
            style={{
                default: {
                    fill,
                    stroke: strokeColor,
                    strokeWidth: isHovered || isSelected ? 1.5 : 0.8,
                    outline: 'none',
                    transition: 'fill 0.18s ease, stroke 0.18s ease',
                    cursor: 'pointer',
                },
                hover: {
                    fill: accent ? accent + 'BB' : '#C45C1ABB',
                    stroke: accent || '#C45C1A',
                    strokeWidth: 1.5,
                    outline: 'none',
                    cursor: 'pointer',
                },
                pressed: {
                    fill: accent || '#C45C1A',
                    stroke: accent || '#C45C1A',
                    strokeWidth: 1.5,
                    outline: 'none',
                },
            }}
        />
    )
})

/* ── CulturalMap ──────────────────────────────────────────────────────────── */
export default function CulturalMap() {
    const [hoveredState, setHoveredState] = useState(null)
    const [selectedState, setSelectedState] = useState(null)
    const lastChimeState = useRef(null)

    const getStateName = (geo) =>
        geo.properties.NAME_1 || geo.properties.st_nm || geo.properties.name || ''

    const handleEnter = useCallback((name) => {
        setHoveredState(name)
        if (name !== lastChimeState.current && STATE_HERITAGE[name]) {
            lastChimeState.current = name
            playChime(STATE_HERITAGE[name]?.accent || '#C45C1A')
        }
    }, [])

    const handleLeave = useCallback(() => setHoveredState(null), [])

    const info = selectedState ? STATE_HERITAGE[selectedState] : null

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', flexWrap: 'wrap' }}>

                {/* ── SVG India Map ──────────────────────────────────────── */}
                <div style={{ flex: '1 1 340px', minWidth: '300px', position: 'relative' }}>

                    {/* Hover tooltip */}
                    {hoveredState && !selectedState && (
                        <div style={{
                            position: 'absolute', top: '12px', left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(255,252,248,0.97)',
                            border: `1.5px solid ${STATE_HERITAGE[hoveredState]?.accent || '#C45C1A'}55`,
                            borderRadius: '10px', padding: '6px 16px',
                            fontSize: '13px', fontWeight: '600',
                            color: STATE_HERITAGE[hoveredState]?.accent || '#C45C1A',
                            pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 4px 18px rgba(80,40,10,0.12)',
                        }}>
                            <MapPin size={11} />
                            {hoveredState}
                            {STATE_HERITAGE[hoveredState] && (
                                <>
                                    <span style={{ color: '#B09070', fontWeight: '400', marginLeft: '2px' }}>·</span>
                                    <span style={{ color: '#B09070', fontWeight: '400', fontSize: '12px' }}>click to explore</span>
                                </>
                            )}
                        </div>
                    )}

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 950, center: [80, 22] }}
                        style={{ width: '100%', height: 'auto' }}
                    >
                        <ZoomableGroup zoom={1} minZoom={1} maxZoom={4}>
                            <Geographies geography={INDIA_TOPO_URL}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const name = getStateName(geo)
                                        const accent = STATE_HERITAGE[name]?.accent
                                        return (
                                            <StateGeo
                                                key={geo.rsmKey}
                                                geo={geo}
                                                accent={accent}
                                                isSelected={selectedState === name}
                                                isHovered={hoveredState === name}
                                                onEnter={() => handleEnter(name)}
                                                onLeave={handleLeave}
                                                onClick={() => setSelectedState(
                                                    STATE_HERITAGE[name]
                                                        ? (selectedState === name ? null : name)
                                                        : null
                                                )}
                                            />
                                        )
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>

                    <p style={{
                        textAlign: 'center', color: '#B09070',
                        fontSize: '11px', paddingBottom: '10px', userSelect: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                        <Volume2 size={10} style={{ opacity: 0.5 }} />
                        Scroll to zoom · Drag to pan · Hover for chime · Click to explore
                    </p>
                </div>

                {/* ── Side Panel ────────────────────────────────────────── */}
                <div style={{
                    flex: '0 0 268px', minWidth: '230px',
                    padding: '24px 20px',
                    borderLeft: '1px solid #EDE7DC',
                    minHeight: '420px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: info ? 'flex-start' : 'center',
                    background: '#FDFAF6',
                }}>
                    {info ? (
                        <>
                            {/* Accent stripe */}
                            <div style={{
                                height: '3px', borderRadius: '99px', marginBottom: '16px',
                                background: `linear-gradient(90deg, ${info.accent}, transparent)`,
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{ fontSize: '36px' }}>{info.emoji}</span>
                                <button onClick={() => setSelectedState(null)} style={{
                                    background: '#F1EBE0', border: '1px solid #DDD3C0',
                                    borderRadius: '8px', cursor: 'pointer',
                                    color: '#78614A', padding: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}>
                                    <X size={14} />
                                </button>
                            </div>

                            <h3 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontWeight: '800', fontSize: '22px', marginBottom: '6px',
                                color: info.accent,
                            }}>{selectedState}</h3>
                            <p style={{ color: '#78614A', fontSize: '12px', lineHeight: '1.75', marginBottom: '18px' }}>
                                {info.desc}
                            </p>

                            <p style={{
                                color: info.accent, fontSize: '10px', fontWeight: '700',
                                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px',
                            }}>
                                Famous Crafts
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                {info.crafts.map(craft => (
                                    <div key={craft} style={{
                                        padding: '9px 12px',
                                        background: info.accent + '10',
                                        borderRadius: '10px',
                                        border: `1px solid ${info.accent}28`,
                                        fontSize: '13px', color: '#2C1A0E',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: info.accent, flexShrink: 0 }} />
                                        {craft}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: '600', fontSize: '14px', color: '#2C1A0E', marginBottom: '6px' }}>
                                Explore by State
                            </p>
                            <p style={{ color: '#78614A', fontSize: '12px', lineHeight: '1.7' }}>
                                Click any state on the map to discover its traditional crafts and cultural heritage.
                            </p>
                            {hoveredState && STATE_HERITAGE[hoveredState] && (
                                <div style={{ marginTop: '16px' }}>
                                    <span className="tag-chip" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        borderColor: STATE_HERITAGE[hoveredState].accent + '55',
                                        color: STATE_HERITAGE[hoveredState].accent,
                                        background: STATE_HERITAGE[hoveredState].accent + '12',
                                    }}>
                                        <MapPin size={10} />
                                        {hoveredState}
                                    </span>
                                    <p style={{ color: '#B09070', fontSize: '11px', marginTop: '8px' }}>
                                        🔔 Chime played
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
