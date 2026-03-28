/**
 * ProfileScreen — User info, 2x2 stats, wallet, palette, language, support.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import type { Lang } from '../../i18n/translations'
import { useStore, PALETTES } from '../../store/useStore'
import { Card, Tag, Divider, GlitchTitle } from '../ui'
import { apiGet } from '../../api/client'

const LANGS = [
  { id: 'ru', flag: '🇷🇺', name: 'RU' },
  { id: 'en', flag: '🇬🇧', name: 'EN' },
  { id: 'zh', flag: '🇨🇳', name: 'ZH' },
]

function fmt(n: number) {
  return n.toLocaleString('ru-RU')
}

export function ProfileScreen() {
  const { user, palette, setPaletteId, models, setScreen, lang, setLang } = useStore()
  const { t } = useTranslation()
  const p = palette

  const safeNum = (n: any) => (typeof n === 'number' && !isNaN(n)) ? n : 0

  const stats = [
    { icon: '📊', value: fmt(safeNum(user.liteToday) + safeNum(user.premiumToday)), label: 'Сегодня', color: p.primary },
    { icon: '⚡', value: fmt(safeNum(user.totalRequests)), label: 'Всего запросов', color: p.secondary || p.primary },
    { icon: '⭐', value: user.plan === 'max-pro' ? 'Max Pro' : user.plan === 'max' ? 'Max' : user.plan === 'mini' ? 'Mini' : 'Free', label: 'Подписка', color: '#ff9500' },
    { icon: '📉', value: `$${safeNum(user.totalDepositedUsd).toFixed(2)}`, label: 'Внесено', color: '#bf5af2' },
  ]

  return (
    <div style={{ padding: '0 16px 90px' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: '#fff' }}>PROFILE</span>
          <GlitchTitle text="⚙" size={20} />
        </div>
      </div>

      {/* User card */}
      <Card accent={p.primary} featured>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.15), rgba(${p.primaryRgb},0.05))`,
            border: `1px solid rgba(${p.primaryRgb},0.25)`,
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
          <Tag text={user.plan === 'free' ? 'FREE' : user.plan.toUpperCase()} accent={user.plan === 'free' ? '#5a8a70' : p.primary} />
        </div>
      </Card>

      <div style={{ height: 12 }} />

      {/* ═══ Stats 2x2 grid ═══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(8,16,12,0.95)',
            border: `1px solid rgba(${p.primaryRgb},0.15)`,
            borderRadius: 14, padding: '14px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 90,
          }}>
            <span style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</span>
            <div style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900,
              color: s.color,
              filter: `drop-shadow(0 0 6px ${s.color}40)`,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: '#5a8a70',
              marginTop: 4, textTransform: 'uppercase', textAlign: 'center',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 12 }} />

      {/* ═══ Subscription management ═══ */}
      <div
        onClick={() => window.open('https://stoneai.ru/pricing', '_blank')}
        style={{
          background: 'rgba(8,16,12,0.95)',
          border: `1px solid rgba(${p.primaryRgb},0.2)`,
          borderRadius: 14, padding: '14px 16px',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e0f8ec', marginBottom: 4 }}>
              Управление подпиской
            </div>
            <div style={{ fontSize: 10, color: '#8aaa98' }}>
              {user.plan === 'free' || user.plan === 'per_token' ? 'Подписка от 390₽/мес' : `Тариф: ${user.plan === 'max-pro' ? 'Max Pro' : user.plan === 'max' ? 'Max' : user.plan === 'mini' ? 'Mini' : 'Free'}`}
            </div>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 800, color: p.primary,
            background: `rgba(${p.primaryRgb},0.12)`,
            padding: '6px 12px', borderRadius: 8,
          }}>→</span>
        </div>
      </div>

      <div style={{ height: 12 }} />
      <Divider label={t.profile_settings_label} />
      <div style={{ height: 10 }} />

      {/* Palette selector */}
      <Card accent={p.primary}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70', marginBottom: 10, textTransform: 'uppercase' }}>{t.profile_palette_label}</div>
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
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70', marginBottom: 8, textTransform: 'uppercase' }}>{t.profile_language_label}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANGS.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              background: lang === l.id ? `rgba(${p.primaryRgb},0.1)` : 'rgba(0,255,136,0.02)',
              border: `1px solid ${lang === l.id ? `rgba(${p.primaryRgb},0.3)` : 'rgba(0,255,136,0.06)'}`,
              color: lang === l.id ? p.primary : '#5a8a70',
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
        <div onClick={() => window.open('https://t.me/stoneaisupport', '_blank')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: 'rgba(0,229,255,0.06)',
          borderRadius: 10, border: '1px solid rgba(0,229,255,0.12)', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>{t.profile_write_to} Telegram</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70' }}>@stoneaisupport</div>
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

      {/* Website link */}
      <div onClick={() => window.open('https://stoneai.ru', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'rgba(255,149,0,0.08)', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,149,0,0.15)' }}>
        <span style={{ fontSize: 18 }}>🌐</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e0f8ec' }}>Открыть stoneai.ru</div>
          <div style={{ fontSize: 10, color: '#5a8a70' }}>Веб-чат с полным функционалом</div>
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* Usage history */}
      <UsageHistory palette={p} />

      <div style={{ height: 10 }} />

      {/* App info */}
      <div style={{
        textAlign: 'center', padding: '12px 0',
        fontFamily: 'monospace', fontSize: 10, color: '#3a6a50',
      }}>
        Stone AI v2.0 &bull; 50+ models &bull; stoneai.ru
      </div>
    </div>
  )
}


// ─── Usage History Component ───

interface UsageRecord {
  model_id: string
  tier: string
  tokens_in: number
  tokens_out: number
  cost_usd: number
  created_at: string | null
}

function UsageHistory({ palette }: { palette: any }) {
  const p = palette
  const { models } = useStore()
  const [history, setHistory] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadHistory = async () => {
    if (history.length > 0) return
    setLoading(true)
    try {
      const data = await apiGet<{ history: UsageRecord[] }>('/api/user/usage-history?limit=20')
      setHistory(data.history)
    } catch {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) loadHistory()
  }

  const getModelName = (id: string) => {
    const m = models.find(m => m.id === id)
    return m ? m.name : id
  }

  const formatTime = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(${p.primaryRgb},0.12)`,
      borderRadius: 16, padding: 16, fontFamily: 'monospace',
    }}>
      <div
        onClick={handleToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 20 }}>📊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>История запросов</div>
          <div style={{ fontSize: 10, color: '#5a8a70', marginTop: 2 }}>Последние 20 запросов</div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: 'rgba(255,255,255,0.05)', color: '#5a8a70',
        }}>
          {open ? '▲' : '▼'}
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#5a8a70', fontSize: 11 }}>
              Загрузка...
            </div>
          )}

          {!loading && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#5a8a70', fontSize: 11 }}>
              Нет запросов
            </div>
          )}

          {!loading && history.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 0',
              borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: '#e0f0e8',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {getModelName(h.model_id)}
                </div>
                <div style={{ fontSize: 9, color: '#5a8a70', marginTop: 2 }}>
                  {(h.tokens_in + h.tokens_out).toLocaleString()} tok · {formatTime(h.created_at)}
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 800, flexShrink: 0,
                color: h.tier === 'premium' ? '#bf5af2' : p.primary,
              }}>
                {h.tier === 'premium' ? 'PRO' : 'FREE'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
