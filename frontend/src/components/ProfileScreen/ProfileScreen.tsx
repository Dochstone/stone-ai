/**
 * ProfileScreen — User info, 2x2 stats, wallet, palette, language, support.
 */
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import type { Lang } from '../../i18n/translations'
import { useStore, PALETTES } from '../../store/useStore'
import { Card, Tag, Divider, GlitchTitle } from '../ui'
import { apiGet, apiPost } from '../../api/client'

const LANGS = [
  { id: 'ru', flag: '🇷🇺', name: 'RU' },
  { id: 'en', flag: '🇬🇧', name: 'EN' },
  { id: 'zh', flag: '🇨🇳', name: 'ZH' },
]

function fmt(n: number) {
  return n.toLocaleString('ru-RU')
}

export function ProfileScreen() {
  const { user, palette, setPaletteId, models, setScreen, lang, setLang, setUser } = useStore()
  const { t } = useTranslation()
  const p = palette

  const safeNum = (n: unknown) => (typeof n === 'number' && !isNaN(n)) ? n : 0

  const stats = [
    { icon: '📊', value: fmt(safeNum(user.liteToday) + safeNum((user as Record<string, unknown>).premiumToday)), label: 'Сегодня', color: p.primary },
    { icon: '⚡', value: fmt(safeNum(user.totalRequests)), label: 'Всего запросов', color: p.secondary || p.primary },
    { icon: '⭐', value: user.plan === 'max-pro' ? 'Elite' : user.plan === 'max' ? 'Pro' : user.plan === 'mini' ? 'Start' : 'Free', label: 'Подписка', color: '#ff9500' },
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
          <ProfileAvatar
            avatarUrl={user.avatarUrl}
            firstName={user.firstName}
            username={user.username}
            palette={p}
            onAvatarChange={(url) => setUser({ avatarUrl: url })}
          />
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
              {user.plan === 'free' || user.plan === 'per_token' ? 'Подписка от 590₽/мес' : `Тариф: ${user.plan === 'max-pro' ? 'Elite' : user.plan === 'max' ? 'Pro' : user.plan === 'mini' ? 'Start' : 'Free'}`}
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


// ─── Profile Avatar Component ───

const API_BASE = import.meta.env.VITE_API_URL || 'https://stone-ai-production.up.railway.app'

function getAvatarInitials(firstName: string, username: string): string {
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  if (username) return username.slice(0, 2).toUpperCase()
  return 'U'
}

function getAvatarColor(str: string): string {
  const colors = ['#C4623D', '#0E9A83', '#4285f4', '#7c3aed', '#ec4899', '#f59e0b', '#06b6d4', '#10a37f']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

interface ProfileAvatarProps {
  avatarUrl: string | null
  firstName: string
  username: string
  palette: { primary: string; primaryRgb: string }
  onAvatarChange: (url: string | null) => void
}

function ProfileAvatar({ avatarUrl, firstName, username, palette: p, onAvatarChange }: ProfileAvatarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const showAvatar = avatarUrl && !imgError

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) return

    setUploading(true)
    try {
      const dataUrl = await readFileAsBase64(file)
      const resized = await resizeAvatar(dataUrl, 256)
      const result = await apiPost<{ ok: boolean; avatar_url: string }>('/api/user/avatar', {
        image_base64: resized,
      })
      const fullUrl = result.avatar_url.startsWith('http')
        ? result.avatar_url
        : `${API_BASE}${result.avatar_url}`
      onAvatarChange(fullUrl)
      setImgError(false)
    } catch (err) {
      console.error('Avatar upload failed:', err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    try {
      const { getInitData, getStartParam } = await import('../../utils/telegram')
      const initData = getInitData()
      const startParam = getStartParam()
      await fetch(`${API_BASE}/api/user/avatar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { Authorization: `tma ${initData}` } : {}),
          ...(startParam ? { 'X-Start-Param': startParam } : {}),
        },
      })
      onAvatarChange(null)
      setImgError(false)
    } catch (err) {
      console.error('Avatar delete failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Avatar circle */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          width: 56, height: 56, borderRadius: 16,
          overflow: 'hidden', cursor: 'pointer',
          border: `2px solid rgba(${p.primaryRgb},0.3)`,
          background: showAvatar
            ? '#0a1a10'
            : getAvatarColor(username || firstName || 'user'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transition: 'border-color 0.2s',
        }}
      >
        {showAvatar ? (
          <img
            src={avatarUrl}
            alt="avatar"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{
            fontFamily: "'Orbitron',sans-serif",
            fontSize: 18, fontWeight: 900, color: '#fff',
          }}>
            {getAvatarInitials(firstName, username)}
          </span>
        )}

        {/* Upload spinner */}
        {uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 20, height: 20, border: '2px solid transparent',
              borderTopColor: p.primary, borderRadius: '50%',
              animation: 'avatar-spin 0.8s linear infinite',
            }} />
          </div>
        )}
      </div>

      {/* Camera badge */}
      {!uploading && (
        <div
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
          style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 22, height: 22, borderRadius: '50%',
            background: p.primary,
            border: '2px solid #0a1a10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#0a1a10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      )}

      {/* Remove button */}
      {showAvatar && !uploading && (
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove() }}
          style={{
            position: 'absolute', top: -4, left: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(255,60,60,0.9)',
            border: '2px solid #0a1a10',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1,
          }}
        >
          ×
        </button>
      )}

      <style>{`@keyframes avatar-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function resizeAvatar(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = maxSize
      canvas.height = maxSize
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }

      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
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
