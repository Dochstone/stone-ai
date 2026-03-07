/**
 * ProfileScreen — user stats, wallet, palette, settings.
 */

import { useStore, PALETTES } from '../../store/useStore'
import { haptic } from '../../utils/telegram'

export function ProfileScreen() {
  const { palette, paletteId, setPaletteId, user } = useStore()
  const p = palette

  return (
    <div style={{ padding: '16px 16px 80px', minHeight: '100vh' }}>
      {/* Avatar & Name */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: 32,
        }}>
          {user.firstName?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>
          {user.firstName || 'User'}
        </h2>
        {user.username && (
          <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>@{user.username}</div>
        )}
        <div style={{
          display: 'inline-block',
          marginTop: 8,
          padding: '4px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          background: user.plan === 'max' ? 'rgba(191,90,242,0.15)' :
            user.plan === 'plus' ? 'rgba(170,255,0,0.15)' :
              'rgba(255,255,255,0.08)',
          color: user.plan === 'max' ? '#bf5af2' :
            user.plan === 'plus' ? '#aaff00' : '#888',
        }}>
          {user.plan.toUpperCase()}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 24,
      }}>
        {[
          { label: 'Всего запросов', value: user.totalRequests },
          { label: 'Lite сегодня', value: `${user.liteToday}/${user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}` },
          { label: 'Premium сегодня', value: user.plan === 'free' ? '—' : `${user.premiumToday}/${user.premiumLimitDay === -1 ? '∞' : user.premiumLimitDay}` },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
            textAlign: 'center',
          }}>
            <div style={{ color: p.primary, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ color: '#888', fontSize: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Palette selector */}
      <h3 style={{ color: '#fff', fontSize: 14, marginBottom: 10 }}>🎨 Тема</h3>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {PALETTES.map((pal) => (
          <button
            key={pal.id}
            onClick={() => { haptic('light'); setPaletteId(pal.id) }}
            style={{
              flex: 1,
              padding: '12px 8px',
              borderRadius: 12,
              border: paletteId === pal.id
                ? `2px solid ${pal.primary}`
                : '2px solid rgba(255,255,255,0.08)',
              background: paletteId === pal.id
                ? `rgba(${pal.primaryRgb},0.1)`
                : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})`,
              margin: '0 auto 6px',
            }} />
            <div style={{
              fontSize: 11,
              color: paletteId === pal.id ? '#fff' : '#888',
              fontWeight: paletteId === pal.id ? 600 : 400,
            }}>
              {pal.name}
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 14,
      }}>
        <div style={{ color: '#888', fontSize: 12, lineHeight: 1.6 }}>
          <b style={{ color: '#fff' }}>Stone AI v1.0</b>
          <br />11 AI-моделей • 3 способа оплаты
          <br />Поддержка: @art_stone
        </div>
      </div>
    </div>
  )
}
