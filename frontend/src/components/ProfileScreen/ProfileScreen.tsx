/**
 * ProfileScreen — User info, stats, palette selector, language, TON wallet, channel link.
 * FAQ moved to separate FaqScreen.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { LANG_LABELS } from '../../i18n/translations'
import type { Lang } from '../../i18n/translations'
import { useStore, PALETTES } from '../../store/useStore'
import { Card, Tag, Divider, GlowBtn, GlitchTitle, TonIcon } from '../ui'
import { apiGet, apiPost } from '../../api/client'

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
          { value: user.totalRequests, label: t.profile_requests_stat },
          { value: user.liteToday, label: t.profile_lite_today_stat },
          { value: user.premiumToday, label: t.profile_premium_stat },
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
      <Divider label={t.profile_settings_label} />
      <div style={{ height: 8 }} />

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

      {/* BYOK — Bring Your Own Key */}
      <ByokCard palette={palette} />

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

      {/* Usage history */}
      <UsageHistory palette={p} />

      <div style={{ height: 10 }} />

      {/* App info */}
      <div style={{
        textAlign: 'center', padding: '12px 0',
        fontFamily: 'monospace', fontSize: 10, color: '#3a6a50',
      }}>
        Stone AI v2.0 &bull; 50 models &bull; Stars / TON / Card / Crypto
      </div>
    </div>
  )
}

// ─── BYOK Component ───

function ByokCard({ palette }: { palette: any }) {
  const p = palette
  const [status, setStatus] = useState<{ enabled: boolean; key_masked: string | null } | null>(null)
  const [inputKey, setInputKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    apiGet('/api/byok/status').then(setStatus).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!inputKey.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      const res = await apiPost('/api/byok/key', { key: inputKey.trim() })
      setMsg({ text: res.message, ok: true })
      setStatus({ enabled: true, key_masked: res.key_masked })
      setInputKey('')
    } catch (e: any) {
      const detail = e.detail?.detail || e.message || 'Ошибка'
      setMsg({ text: typeof detail === 'string' ? detail : 'Ошибка сохранения', ok: false })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const { getInitData } = await import('../../utils/telegram')
      const initData = getInitData()
      const API_BASE = (import.meta as any).env?.VITE_API_URL || ''
      const r = await fetch(`${API_BASE}/api/byok/key`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { Authorization: `tma ${initData}` } : {}),
        },
      })
      const res = await r.json()
      setMsg({ text: res.message || 'Ключ удалён', ok: true })
      setStatus({ enabled: false, key_masked: null })
    } catch {
      setMsg({ text: 'Ошибка удаления', ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: status?.enabled
        ? `rgba(${p.primaryRgb},0.07)`
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${status?.enabled ? `rgba(${p.primaryRgb},0.25)` : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16,
      padding: 16,
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 22 }}>🔑</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>
            Свой API ключ
          </div>
          <div style={{ fontSize: 10, color: '#5a8a70', marginTop: 2 }}>
            {status?.enabled
              ? `✅ Подключён · ${status.key_masked}`
              : 'Используй свой OpenRouter ключ'}
          </div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: status?.enabled ? `rgba(${p.primaryRgb},0.15)` : 'rgba(255,255,255,0.05)',
          color: status?.enabled ? p.primary : '#5a8a70',
        }}>
          {status?.enabled ? 'BYOK' : open ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: '#5a8a70', marginBottom: 8, lineHeight: 1.5 }}>
            Подключи ключ с <span style={{ color: p.primary }}>openrouter.ai</span> — запросы пойдут через твою квоту.
            Лимиты платформы отключатся. Доступны все Premium-модели.
          </div>

          {status?.enabled ? (
            <div>
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: `rgba(${p.primaryRgb},0.06)`,
                border: `1px solid rgba(${p.primaryRgb},0.15)`,
                fontSize: 11, color: p.primary, marginBottom: 10,
              }}>
                🔐 {status.key_masked}
              </div>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 10,
                  border: '1px solid rgba(255,80,80,0.3)',
                  background: 'rgba(255,80,80,0.08)',
                  color: '#ff5050', fontWeight: 700, fontSize: 12,
                  cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '...' : '🗑 Удалить ключ'}
              </button>
            </div>
          ) : (
            <div>
              <input
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="sk-or-v1-..."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid rgba(${p.primaryRgb},0.2)`,
                  color: '#e0f0e8', fontSize: 12, fontFamily: 'monospace',
                  outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                }}
              />
              <button
                onClick={handleSave}
                disabled={loading || !inputKey.trim()}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  border: 'none',
                  background: inputKey.trim()
                    ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                    : 'rgba(255,255,255,0.05)',
                  color: inputKey.trim() ? '#000' : '#444',
                  fontWeight: 800, fontSize: 13,
                  cursor: loading || !inputKey.trim() ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '⏳ Проверка...' : '✅ Подключить'}
              </button>
            </div>
          )}

          {msg && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 11,
              background: msg.ok ? `rgba(${p.primaryRgb},0.1)` : 'rgba(255,80,80,0.1)',
              color: msg.ok ? p.primary : '#ff5050',
              border: `1px solid ${msg.ok ? `rgba(${p.primaryRgb},0.2)` : 'rgba(255,80,80,0.2)'}`,
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ fontSize: 10, color: '#3a5a4a', marginTop: 8, lineHeight: 1.4 }}>
            Получи ключ на openrouter.ai → Keys → Create key
          </div>
        </div>
      )}
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
    return m ? `${m.icon} ${m.name}` : id
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
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>История расходов</div>
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
                color: h.cost_usd > 0 ? '#bf5af2' : p.primary,
              }}>
                {h.cost_usd > 0 ? `-$${h.cost_usd.toFixed(4)}` : 'FREE'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
