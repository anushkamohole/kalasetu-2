// DialectBadge.jsx
// Drop this component anywhere in ArtisanApp.jsx (after story result)
// or in ScanPage.jsx (on the buyer side)
// Props: dialectIntelligence (the dialect_intelligence object from API response)

import { useState } from 'react'

export default function DialectBadge({ dialectIntelligence }) {
    const [expanded, setExpanded] = useState(false)

    if (!dialectIntelligence) return null

    const {
        language_detected,
        authenticity_score,
        verdict,
        verdict_color,
        dialect_region,
        craft_origin_region,
        is_geographic_match,
        gi_tagged,
        explanation,
    } = dialectIntelligence

    const getScoreBar = (score) => {
        if (score >= 90) return { width: `${score}%`, color: '#4D7C0F' }
        if (score >= 75) return { width: `${score}%`, color: '#0369A1' }
        if (score >= 60) return { width: `${score}%`, color: '#B45309' }
        return { width: `${score}%`, color: '#DC2626' }
    }

    const bar = getScoreBar(authenticity_score)

    return (
        <div style={{
            background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
            border: `1.5px solid ${verdict_color}40`,
            borderRadius: '16px',
            padding: '16px',
            marginTop: '12px',
        }}>
            {/* Header Row */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpanded(e => !e)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: `${verdict_color}15`,
                        border: `1.5px solid ${verdict_color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px',
                    }}>
                        {authenticity_score >= 90 ? '🛡️' : authenticity_score >= 75 ? '✅' : authenticity_score >= 60 ? '⚠️' : '🔍'}
                    </div>
                    <div>
                        <p style={{ fontWeight: '800', fontSize: '13px', color: '#2C1A0E', marginBottom: '1px' }}>
                            Dialect Intelligence
                        </p>
                        <p style={{ fontSize: '11px', color: '#78614A' }}>
                            🗣️ {language_detected} · {dialect_region}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        background: `${verdict_color}15`,
                        border: `1px solid ${verdict_color}40`,
                        borderRadius: '999px',
                        padding: '3px 10px',
                        display: 'inline-block',
                    }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: verdict_color }}>
                            {verdict}
                        </p>
                    </div>
                    <p style={{ fontSize: '10px', color: '#78614A', marginTop: '2px' }}>
                        {expanded ? '▲ Less' : '▼ Details'}
                    </p>
                </div>
            </div>

            {/* Score Bar */}
            <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#78614A', fontWeight: '600' }}>
                        Linguistic Authenticity Score
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: bar.color }}>
                        {authenticity_score}/100
                    </span>
                </div>
                <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: bar.width,
                        background: bar.color,
                        borderRadius: '999px',
                        transition: 'width 1.2s ease-out',
                    }} />
                </div>
            </div>

            {/* Match indicator */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                marginTop: '10px', padding: '8px 10px',
                background: is_geographic_match ? 'rgba(77,124,15,0.08)' : 'rgba(180,83,9,0.06)',
                borderRadius: '8px',
                border: `1px solid ${is_geographic_match ? 'rgba(77,124,15,0.2)' : 'rgba(180,83,9,0.15)'}`,
            }}>
                <span style={{ fontSize: '14px' }}>{is_geographic_match ? '📍' : '🗺️'}</span>
                <p style={{ fontSize: '11px', fontWeight: '600', color: is_geographic_match ? '#365314' : '#92400E' }}>
                    {is_geographic_match
                        ? `Dialect matches craft origin: ${craft_origin_region}`
                        : `Craft origin: ${craft_origin_region} · Dialect: ${dialect_region}`
                    }
                </p>
            </div>

            {/* GI Tag badge */}
            {gi_tagged && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    marginTop: '8px',
                    background: 'rgba(3,105,161,0.08)',
                    border: '1px solid rgba(3,105,161,0.25)',
                    borderRadius: '999px', padding: '3px 10px',
                }}>
                    <span style={{ fontSize: '12px' }}>🏛️</span>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#0369A1' }}>
                        GI Tagged Craft
                    </p>
                </div>
            )}

            {/* Expanded details */}
            {expanded && (
                <div style={{
                    marginTop: '12px', padding: '12px',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '10px', border: '1px solid #E5E7EB',
                }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#2C1A0E', marginBottom: '6px' }}>
                        🔬 How We Verified This
                    </p>
                    <p style={{ fontSize: '12px', color: '#78614A', lineHeight: '1.6', marginBottom: '8px' }}>
                        {explanation}
                    </p>
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px', marginTop: '8px' }}>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: '1.5' }}>
                            🛡️ KalaSetu's Dialect Intelligence cross-references the artisan's spoken
                            language with the geographic origin of the craft tradition. A Bihar artisan's
                            dialect cannot be faked by someone in another state — making this an
                            unforgeable layer of cultural authentication.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
