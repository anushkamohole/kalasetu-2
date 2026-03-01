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
        accent: '#FF6B1A',
    },
    Gujarat: {
        emoji: '🧵',
        crafts: ['Patola Silk Weaving', 'Kutch Embroidery', 'Bandhani', 'Rogan Art'],
        desc: "Gujarat's textile legacy is unmatched — from the ikat excellence of Patola to the mirror-work of Kutch.",
        accent: '#F59E0B',
    },
    'West Bengal': {
        emoji: '🎨',
        crafts: ['Kantha Embroidery', 'Dokra Metal Craft', 'Patachitra', 'Terracotta'],
        desc: "A cradle of cultural renaissance. Bengal's artisans have documented epics on terracotta and cloth.",
        accent: '#0D9488',
    },
    Odisha: {
        emoji: '📜',
        crafts: ['Pattachitra', 'Dokra', 'Sambalpuri Ikat', 'Stone Carving'],
        desc: "Odisha's Pattachitra scrolls have told the stories of Lord Jagannath for centuries.",
        accent: '#8B5CF6',
    },
    Maharashtra: {
        emoji: '🖌️',
        crafts: ['Warli Painting', 'Paithani Silk Sarees', 'Kolhapuri Chappals', 'Bidriware'],
        desc: "Maharashtra blends tribal artistry with royal weaves. Warli's geometric folk art is iconic worldwide.",
        accent: '#EC4899',
    },
    Bihar: {
        emoji: '🌸',
        crafts: ['Madhubani Painting', 'Sujani Embroidery', 'Tikuli Art', 'Sikki Grass Craft'],
        desc: "The birthplace of Madhubani art. Each painting is an entire cosmos of gods, nature, and womanhood.",
        accent: '#3B82F6',
    },
    'Uttar Pradesh': {
        emoji: '🕌',
        crafts: ['Chikankari Embroidery', 'Zari-Zardozi', 'Banaras Silk', 'Brass Craft'],
        desc: "From Lucknow's Chikankari ateliers to Varanasi's looms — UP carries Mughal craft heritage alive.",
        accent: '#10B981',
    },
    Karnataka: {
        emoji: '🥻',
        crafts: ['Mysore Silk', 'Bidriware', 'Channapatna Toys', 'Kasuti Embroidery'],
        desc: "Karnataka's Channapatna wooden toys and Bidri inlay work represent a tradition of intricate craftsmanship.",
        accent: '#F97316',
    },
    'Tamil Nadu': {
        emoji: '🏺',
        crafts: ['Kanjivaram Silk', 'Tanjore Painting', 'Bronze Casting', 'Kolam Art'],
        desc: "Tamil Nadu's artisans have shaped bronze gods, woven divine silks, and painted celestial panels for millennia.",
        accent: '#EF4444',
    },
    'Madhya Pradesh': {
        emoji: '🐘',
        crafts: ['Gond Painting', 'Chanderi Silk', 'Bagh Print', 'Dhokra'],
        desc: "Home to the Gond tribe's extraordinary tree-of-life paintings. Every dot is a prayer to nature.",
        accent: '#84CC16',
    },
    'Himachal Pradesh': {
        emoji: '🏔️',
        crafts: ['Kullu Shawls', 'Thangka Painting', 'Wood Carving', 'Chamba Rumal'],
        desc: "High in the Himalayas, artisans weave warmth into woollens and meditative stillness into Thangka paintings.",
        accent: '#06B6D4',
    },
    Assam: {
        emoji: '🦢',
        crafts: ['Muga Silk', 'Mekhela Chador Weaving', 'Bamboo and Cane Craft', 'Xorai'],
        desc: "Assam's Muga silk — the golden thread of the Brahmaputra — is one of the rarest fabrics in the world.",
        accent: '#A78BFA',
    },
    Punjab: {
        emoji: '🌾',
        crafts: ['Phulkari Embroidery', 'Jutti Craft', 'Pottery', 'Durrie Weaving'],
        desc: "Punjab's Phulkari — literally 'flower work' — transforms cloth into explosions of silk-thread color.",
        accent: '#FBBF24',
    },
    Kerala: {
        emoji: '🥥',
        crafts: ['Kathakali Costumes', 'Coir Weaving', 'Nettoor Petti Lacquerware', 'Keralan Mural'],
        desc: "Kerala's artisans blend ritual, nature, and colour — from resplendent Kathakali headdresses to coconut-shell craft.",
        accent: '#22C55E',
    },
    Chhattisgarh: {
        emoji: '🔱',
        crafts: ['Dhokra Casting', 'Bell Metal Work', 'Bamboo Craft', 'Godna Tattoo Art'],
        desc: "Chhattisgarh is the heartland of Dhokra — the world's oldest lost-wax metal casting tradition.",
        accent: '#B45309',
    },
}

const DEFAULT_FILL = '#2D2545'

/* ── Ambient chime via Web Audio API (no file required) ───────────────────── */
let audioCtx = null
function playChime(accentHex) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const ctx = audioCtx
        if (ctx.state === 'suspended') ctx.resume()

        // Convert hex to a frequency offset for a pleasant pentatonic chime
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
        gain.gain.linearRampToValueAtTime(0.18, now + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.1)
    } catch (_) { /* AudioContext unavailable — silent fail */ }
}

/* ── SVG drop-shadow filter injected once ─────────────────────────────────── */
const MAP_FILTER_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
    <defs>
      <filter id="state-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feColorMatrix in="blur" mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  </svg>
`

let mapFilterInjected = false
function ensureMapFilter() {
    if (mapFilterInjected) return
    const div = document.createElement('div')
    div.innerHTML = MAP_FILTER_SVG
    document.body.appendChild(div.firstElementChild)
    mapFilterInjected = true
}

/* ── Memoised StateGeo ────────────────────────────────────────────────────── */
const StateGeo = memo(function StateGeo({ geo, accent, isSelected, isHovered, onEnter, onLeave, onClick }) {
    const fill = isSelected
        ? (accent || '#FF6B1A')
        : isHovered
            ? (accent ? accent + 'BB' : '#3D3060')
            : DEFAULT_FILL

    return (
        <Geography
            geography={geo}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onClick={onClick}
            style={{
                default: {
                    fill,
                    stroke: isHovered || isSelected ? (accent || '#FF6B1A') : '#5A5075',
                    strokeWidth: isHovered || isSelected ? 1.2 : 0.6,
                    outline: 'none',
                    transition: 'fill 0.15s ease, stroke 0.15s ease',
                    filter: isHovered || isSelected ? 'url(#state-glow)' : 'none',
                    cursor: 'pointer',
                },
                hover: {
                    fill: accent ? accent + 'BB' : '#3D3060',
                    stroke: accent || '#FF6B1A',
                    strokeWidth: 1.2,
                    outline: 'none',
                    filter: 'url(#state-glow)',
                    cursor: 'pointer',
                },
                pressed: {
                    fill: accent || '#FF6B1A',
                    outline: 'none',
                    filter: 'url(#state-glow)',
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

    ensureMapFilter()

    const getStateName = (geo) =>
        geo.properties.NAME_1 || geo.properties.st_nm || geo.properties.name || ''

    const handleEnter = useCallback((name) => {
        setHoveredState(name)
        // Play chime only once per new state-hover (not on re-hover)
        if (name !== lastChimeState.current && STATE_HERITAGE[name]) {
            lastChimeState.current = name
            playChime(STATE_HERITAGE[name]?.accent || '#FF6B1A')
        }
    }, [])

    const handleLeave = useCallback(() => setHoveredState(null), [])

    const info = selectedState ? STATE_HERITAGE[selectedState] : null

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', flexWrap: 'wrap' }}>

                {/* ── SVG India Map ─────────────────────────────────── */}
                <div style={{ flex: '1 1 340px', minWidth: '300px', position: 'relative' }}>

                    {/* Hover tooltip */}
                    {hoveredState && !selectedState && (
                        <div style={{
                            position: 'absolute', top: '10px', left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(26,22,37,0.94)',
                            border: `1px solid ${STATE_HERITAGE[hoveredState]?.accent || 'rgba(255,107,26,0.45)'}55`,
                            borderRadius: '10px', padding: '6px 16px',
                            fontSize: '13px', fontWeight: '600',
                            color: STATE_HERITAGE[hoveredState]?.accent || 'var(--saffron)',
                            pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: `0 4px 20px ${STATE_HERITAGE[hoveredState]?.accent || '#FF6B1A'}33`,
                            backdropFilter: 'blur(8px)',
                        }}>
                            <MapPin size={11} />
                            {hoveredState}
                            {STATE_HERITAGE[hoveredState] && (
                                <>
                                    <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '400', marginLeft: '2px' }}>·</span>
                                    <Volume2 size={10} style={{ opacity: 0.5 }} />
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '400' }}>click to explore</span>
                                </>
                            )}
                        </div>
                    )}

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 1050, center: [82.8, 22.5] }}
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
                        textAlign: 'center', color: 'rgba(255,255,255,0.2)',
                        fontSize: '11px', paddingBottom: '8px', userSelect: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                        <Volume2 size={10} style={{ opacity: 0.4 }} />
                        Scroll to zoom · Drag to pan · Hover for chime · Click to explore
                    </p>
                </div>

                {/* ── Side Panel ──────────────────────────────────── */}
                <div style={{
                    flex: '0 0 268px', minWidth: '230px',
                    padding: '24px 20px',
                    borderLeft: '1px solid rgba(255,255,255,0.07)',
                    minHeight: '420px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: info ? 'flex-start' : 'center',
                }}>
                    {info ? (
                        <>
                            {/* Close + accent stripe */}
                            <div style={{
                                height: '3px', borderRadius: '99px', marginBottom: '16px',
                                background: `linear-gradient(90deg, ${info.accent}, transparent)`,
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{ fontSize: '36px' }}>{info.emoji}</span>
                                <button onClick={() => setSelectedState(null)} style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', cursor: 'pointer',
                                    color: 'var(--text-muted)', padding: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <X size={14} />
                                </button>
                            </div>

                            <h3 style={{
                                fontWeight: '800', fontSize: '21px', marginBottom: '6px',
                                color: info.accent,
                            }}>{selectedState}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.75', marginBottom: '18px' }}>
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
                                        background: info.accent + '12',
                                        borderRadius: '10px',
                                        border: `1px solid ${info.accent}28`,
                                        fontSize: '13px', color: 'var(--text-primary)',
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
                            <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                                Explore by State
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.7' }}>
                                Click any state on the map to discover its traditional crafts and cultural heritage.
                            </p>
                            {hoveredState && STATE_HERITAGE[hoveredState] && (
                                <div style={{ marginTop: '16px' }}>
                                    <span className="tag-chip" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        borderColor: STATE_HERITAGE[hoveredState].accent + '55',
                                        color: STATE_HERITAGE[hoveredState].accent,
                                    }}>
                                        <MapPin size={10} />
                                        {hoveredState}
                                    </span>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '8px' }}>
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
