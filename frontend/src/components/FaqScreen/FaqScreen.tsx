/**
 * FaqScreen — Standalone FAQ screen with expandable Q&A cards and support link.
 * Uses i18n translations for EN/RU/ZH support.
 */
import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { useTranslation } from '../../i18n/useTranslation'
import { Card, Tag, Divider, GlitchTitle } from '../ui'

export function FaqScreen() {
  const { palette } = useStore()
  const { t } = useTranslation()
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const p = palette

  const FAQ_DATA = [
    { q: t.faq_q1, a: t.faq_a1 },
    { q: t.faq_q2, a: t.faq_a2 },
    { q: t.faq_q3, a: t.faq_a3 },
    { q: t.faq_q4, a: t.faq_a4 },
    { q: t.faq_q5, a: t.faq_a5 },
    { q: t.faq_q6, a: t.faq_a6 },
  ]

  return (
    <div style={{ padding: '0 18px 90px' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: '#fff' }}>FAQ</span>
          <GlitchTitle text="❓" size={20} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a8a70', marginTop: 4 }}>
          {t.faq_subtitle}
        </div>
      </div>

      <Divider label="questions" />
      <div style={{ height: 8 }} />

      {/* FAQ items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQ_DATA.map((item, i) => (
          <Card key={i} accent={p.primary} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `rgba(${p.primaryRgb},0.08)`,
                border: `1px solid rgba(${p.primaryRgb},0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: p.primary,
              }}>{faqOpen === i ? '−' : '+'}</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8', flex: 1 }}>
                {item.q}
              </div>
            </div>
            <div style={{
              maxHeight: faqOpen === i ? 150 : 0,
              opacity: faqOpen === i ? 1 : 0,
              marginTop: faqOpen === i ? 10 : 0,
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{
                padding: '10px 12px',
                background: `rgba(${p.primaryRgb},0.03)`,
                borderRadius: 10,
                border: `1px solid rgba(${p.primaryRgb},0.06)`,
                fontFamily: 'sans-serif', fontSize: 12, color: '#7aa090', lineHeight: 1.6,
              }}>{item.a}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ height: 16 }} />

      {/* Support card */}
      <Card accent="#00e5ff" featured>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>🛟</span>
          <div style={{ fontFamily: 'sans-serif', fontSize: 16, fontWeight: 700, color: '#e0f0e8', marginTop: 6 }}>
            {t.faq_support_title}
          </div>
        </div>
        <div onClick={() => window.open('https://t.me/stonemvp', '_blank')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: 'rgba(0,229,255,0.06)',
          borderRadius: 10, border: '1px solid rgba(0,229,255,0.12)', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>{t.faq_support_tg}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70' }}>@stonemvp</div>
          </div>
          <Tag text="→" accent="#00e5ff" />
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* Channel link */}
      <Card accent="#39ff14" onClick={() => window.open('https://t.me/stoneAIC', '_blank')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, color: '#e0f0e8' }}>Stone AI Channel</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70' }}>@stoneAIC</div>
          </div>
          <Tag text={t.faq_join + ' →'} accent="#39ff14" />
        </div>
      </Card>
    </div>
  )
}
