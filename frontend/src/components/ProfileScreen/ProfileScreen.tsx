/**
 * ProfileScreen — User info, stats, palette selector, language, TON wallet, channel link.
 * FAQ moved to separate FaqScreen.
 */
import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { LANG_LABELS } from '../../i18n/translations'
import type { Lang } from '../../i18n/translations'
import { useStore, PALETTES } from '../../store/useStore'
import { Card, Tag, Divider, GlowBtn, GlitchTitle, TonIcon } from '../ui'

const LANGS = [
  { id: 'ru', flag: '🇷🇺', name: 'RU' },
  { id: 'en', flag: '🇬🇧', name: 'EN' },
  { id: 'zh', flag: '🇨🇳', name: 'ZH' },
]

export function ProfileScreen() {
  const { user, palette, setPaletteId, models, setScreen, lang, setLang } = useStore()
  const { t } = useTranslation()
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
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a8a70' }}>
              @{user.username || 'anonymous'}
            </div>
          </div>
          <Tag text={user.plan === 'free' ? 'FREE' : user.plan.toUpperCase()} accent={user.plan === 'free' ? '#5a8a70' : '#aaff00'} />
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
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: '#00ff88' }}>{s.value}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#5a8a70', marginTop: 3, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 10 }} />
      <Divider label="settings" />
      <div style={{ height: 8 }} />

      {/* Palette selector */}
      <Card accent={p.primary}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70', marginBottom: 10, textTransform: 'uppercase' }}>
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
                color: palette.id === pl.id ? pl.primary : '#5a8a70', textAlign: 'center',
              }}>{pl.name}</div>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* Language selector */}
      <Card accent={p.primary}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70', marginBottom: 8, textTransform: 'uppercase' }}>
          🌐 language
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANGS.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              background: lang === l.id ? 'rgba(0,255,136,0.1)' : 'rgba(0,255,136,0.02)',
              border: `1px solid ${lang === l.id ? 'rgba(0,255,136,0.3)' : 'rgba(0,255,136,0.06)'}`,
              color: lang === l.id ? '#00ff88' : '#5a8a70',
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{l.flag}</div>
              {l.name}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* Support card */}
      <Card accent="#00e5ff" featured>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>🛟</span>
          <div style={{ fontFamily: 'sans-serif', fontSize: 16, fontWeight: 700, color: '#e0f0e8', marginTop: 6 }}>
            {t.profile_need_help}?
          </div>
        </div>
        <div onClick={() => window.open('https://t.me/stonemvp', '_blank')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: 'rgba(0,229,255,0.06)',
          borderRadius: 10, border: '1px solid rgba(0,229,255,0.12)', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>{t.profile_write_to} Telegram</div>
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
          <Tag text="join →" accent="#39ff14" />
        </div>
      </Card>

      <div style={{ height: 10 }} />

      {/* App info */}
      <div style={{
        textAlign: 'center', padding: '12px 0',
        fontFamily: 'monospace', fontSize: 10, color: '#3a6a50',
      }}>
        Stone AI v1.1 &bull; 11 models &bull; Stars / TON / USDT
      </div>
    </div>
  )
                }
