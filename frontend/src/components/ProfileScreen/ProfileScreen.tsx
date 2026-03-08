/**
 * ProfileScreen — User info, stats, palette selector, language, TON wallet, channel link.
 */

import { useState } from 'react'
import { useStore, PALETTES } from '../../store/useStore'
import { Card, Tag, Divider, GlowBtn, GlitchTitle, TonIcon } from '../ui'

const LANGS = [
  { id: 'ru', flag: '🇷🇺', name: 'RU' },
  { id: 'en', flag: '🇬🇧', name: 'EN' },
  { id: 'zh', flag: '🇨🇳', name: 'ZH' },
]

const FAQ_DATA = [
  { q: 'Какие модели бесплатно?', a: '6 Lite моделей бесплатно: GPT-4o mini, Claude Haiku 4.5, Gemini 2.0 Flash, DeepSeek R1, Llama 4, Mistral Large. 20 запросов/день.' },
  { q: 'Что такое Premium модели?', a: '5 топовых моделей: GPT-4.1, Claude Opus 4, Grok 3, Gemini 2.5 Pro, Perplexity Pro. Доступны по подписке PLUS или MAX, либо через Pass.' },
  { q: 'Чем PLUS отличается от MAX?', a: 'PLUS: 10 Premium/день, без Opus. MAX: 30 Premium/день + 5 Opus/день, API доступ.' },
  { q: 'Что такое Day Pass / Week Pass?', a: 'Разовые пакеты. Day Pass (79⭐) = 15 Premium на 24 часа. Week Pass (299⭐) = 50 Premium на 7 дней.' },
  { q: 'Как оплатить?', a: '3 способа: ⭐ Stars, 💎 TON, 💲 USDT TRC-20/TON.' },
  { q: 'Данные сохраняются?', a: 'FREE: 24ч. PLUS: 30 дней. MAX: бессрочно + экспорт.' },
]

export function ProfileScreen() {
  const { user, palette, setPaletteId, models, setScreen } = useStore()
  const [lang, setLang] = useState('ru')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const p = palette

  return (
    <div style={{ padding: '0 18px 90px' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: '#fff' }}>PROFILE</span>
          <GlitchTitle text="⚙" size={20} />
        </div>
      </div>

      {/* User card */}
      <Card accent="#00ff88" featured>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,229,255,0.1))',
            border: '1px solid rgba(0,255,136,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 16, fontWeight: 700, color: '#e0f0e8' }}>
              {user.firstName || 'User'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50' }}>
              @{user.username || 'anonymous'}
            </div>
          </div>
          <Tag
            text={user.plan === 'free' ? 'FREE' : user.plan.toUpperCase()}
            accent={user.plan === 'free' ? '#3a6a50' : '#aaff00'}
          />
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 0,
        border: '1px solid rgba(0,255,136,0.12)', borderRadius: 12, overflow: 'hidden',
      }}>
        {[
          { value: user.totalRequests, label: 'requests' },
          { value: user.liteToday, label: 'lite today' },
          { value: user.premiumToday, label: 'premium' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', padding: '12px 8px',
            borderRight: i < 2 ? '1px solid rgba(0,255,136,0.08)' : 'none',
            background: 'rgba(0,255,136,0.02)',
          }}>
            <div style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: '#00ff88',
            }}>{s.value}</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: '#3a6a50', marginTop: 3, textTransform: 'uppercase',
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 10 }} />
      <Divider label="settings" />
      <div style={{ height: 8 }} />

      {/* Palette selector */}
      <Card accent={p.primary}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', marginBottom: 10, textTransform: 'uppercase' }}>
          🎨 palette
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {PALETTES.map(pl => (
            <button key={pl.id} onClick={() => setPaletteId(pl.id)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
              background: palette.id === pl.id ? `rgba(${pl.primaryRgb},0.1)` : 'rgba(0,255,136,0.02)',
              border: `2px solid ${palette.id === pl.id ? pl.primary : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: pl.primary }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, background: pl.secondary }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, background: pl.accent3 }} />
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                color: palette.id === pl.id ? pl.primary : '#3a6a50', textAlign: 'center',
              }}>{pl.name}</div>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* Language selector */}
      <Card accent={p.primary}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', marginBottom: 8, textTransform: 'uppercase' }}>
          🌐 language
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANGS.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              background: lang === l.id ? 'rgba(0,255,136,0.1)' : 'rgba(0,255,136,0.02)',
              border: `1px solid ${lang === l.id ? 'rgba(0,255,136,0.3)' : 'rgba(0,255,136,0.06)'}`,
              color: lang === l.id ? '#00ff88' : '#3a6a50',
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{l.flag}</div>
              {l.name}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* FAQ section */}
      <Divider label="FAQ" />
      <div style={{ height: 8 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQ_DATA.map((item, i) => (
          <Card key={i} accent="#00ff88" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#00ff88',
              }}>{faqOpen === i ? '−' : '+'}</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8', flex: 1 }}>
                {item.q}
              </div>
            </div>
            <div style={{
              maxHeight: faqOpen === i ? 120 : 0,
              opacity: faqOpen === i ? 1 : 0,
              marginTop: faqOpen === i ? 10 : 0,
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{
                padding: '10px 12px', background: 'rgba(0,255,136,0.03)',
                borderRadius: 10, border: '1px solid rgba(0,255,136,0.06)',
                fontFamily: 'sans-serif', fontSize: 12, color: '#5a8a70', lineHeight: 1.6,
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
            Не нашёл ответ?
          </div>
        </div>
        <div onClick={() => window.open('https://t.me/stonemvp', '_blank')} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          background: 'rgba(0,229,255,0.06)', borderRadius: 10,
          border: '1px solid rgba(0,229,255,0.12)', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>Написать в Telegram</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>@stonemvp</div>
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
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>@stoneAIC</div>
          </div>
          <Tag text="join →" accent="#39ff14" />
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* App info */}
      <div style={{
        textAlign: 'center', padding: '12px 0',
        fontFamily: 'monospace', fontSize: 10, color: '#1a3a28',
      }}>
        Stone AI v1.1 &bull; 11 models &bull; Stars / TON / USDT
      </div>
    </div>
  )
}
