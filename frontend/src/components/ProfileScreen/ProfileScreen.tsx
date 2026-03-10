/**
 * ProfileScreen — user stats, palette, settings.
 * Premium design with glassmorphism and animations.
 */

import { useStore, PALETTES } from '../../store/useStore'
import { haptic } from '../../utils/telegram'

export function ProfileScreen() {
  const { palette, paletteId, setPaletteId, user, setScreen } = useStore()
  const p = palette

  const planColors: Record<string, { bg: string; border: string; color: string }> = {
    free: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', color: '#888' },
    plus: { bg: 'rgba(170,255,0,0.1)', border: 'rgba(170,255,0,0.2)', color: '#aaff00' },
    max: { bg: 'rgba(191,90,242,0.1)', border: 'rgba(191,90,242,0.2)', color: '#bf5af2' },
  }
  const planStyle = planColors[user.plan] || planColors.free

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Avatar & Name — animated */}
      <div style={{
        textAlign: 'center',
        marginBottom: 28,
        animation: 'fadeIn 0.6s ease-out',
      }}>
        {/* Avatar with glow */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          fontSize: 36,
          fontWeight: 700,
          color: '#000',
          boxShadow: `0 0 30px rgba(${p.primaryRgb},0.3), 0 0 60px rgba(${p.primaryRgb},0.1)`,
          animation: 'glow 3s ease-in-out infinite',
          position: 'relative',
        }}>
          {user.firstName?.[0]?.toUpperCase() || '?'}
          {/* Ring */}
          <div style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            border: `2px solid rgba(${p.primaryRgb},0.3)`,
          }} />
        </div>

        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
          {user.firstName || 'User'}
        </h2>
        {user.username && (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 3 }}>@{user.username}</div>
        )}

        {/* Plan badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          padding: '5px 14px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 800,
          background: planStyle.bg,
          color: planStyle.color,
          border: `1px solid ${planStyle.border}`,
          letterSpacing: '0.5px',
          cursor: user.plan === 'free' ? 'pointer' : 'default',
        }}
          onClick={() => {
            if (user.plan === 'free') {
              haptic('light')
              setScreen('plans')
            }
          }}
        >
          {user.plan === 'max' ? '👑' : user.plan === 'plus' ? '⚡' : '🆓'}
          {user.plan.toUpperCase()}
          {user.plan === 'free' && <span style={{ fontSize: 10, opacity: 0.7 }}>→ Upgrade</span>}
        </div>
      </div>

      {/* Stats grid — glass cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 28,
        animation: 'slideUp 0.5s ease-out 0.1s both',
      }}>
        {[
          { label: 'Всего', value: user.totalRequests, icon: '📊' },
          {
            label: 'Lite',
            value: `${user.liteToday}/${user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}`,
            icon: '🆓'
          },
          {
            label: 'Premium',
            value: user.plan === 'free' ? '—' : `${user.premiumToday}/${user.premiumLimitDay === -1 ? '∞' : user.premiumLimitDay}`,
            icon: '💎'
          },
        ].map((s, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              padding: 14,
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 6 }}>{s.icon}</div>
            <div style={{
              color: p.primary,
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 4,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {s.value}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Theme palette selector */}
      <div style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 16 }}>🎨</span>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Тема</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {PALETTES.map((pal) => {
            const active = paletteId === pal.id
            return (
              <button
                key={pal.id}
                onClick={() => { haptic('light'); setPaletteId(pal.id) }}
                className="glass-card"
                style={{
                  flex: 1,
                  padding: '14px 8px 12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: active
                    ? `2px solid ${pal.primary}`
                    : '2px solid rgba(255,255,255,0.06)',
                  background: active
                    ? `rgba(${pal.primaryRgb},0.08)`
                    : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s',
                  boxShadow: active ? `0 0 20px rgba(${pal.primaryRgb},0.15)` : 'none',
                }}
              >
                {/* Color circle with gradient */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})`,
                  margin: '0 auto 8px',
                  boxShadow: active ? `0 0 12px ${pal.primary}40` : 'none',
                  transition: 'box-shadow 0.3s',
                }} />
                <div style={{
                  fontSize: 12,
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontWeight: active ? 700 : 500,
                }}>
                  {pal.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* App info — glass card */}
      <div
        className="glass-card"
        style={{
          padding: 16,
          animation: 'slideUp 0.5s ease-out 0.3s both',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: 24,
            filter: `drop-shadow(0 0 8px rgba(${p.primaryRgb},0.3))`,
          }}>🤖</div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: 14,
              background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Stone AI v1.0</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Мульти-модельный AI чатбот</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Модели</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>11 (6 Lite + 5 Premium)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Оплата</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>Stars • TON • USDT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Поддержка</span>
            <span style={{ color: p.primary, fontWeight: 600 }}>@art_stone</span>
          </div>
        </div>
      </div>
    </div>
  )
}
