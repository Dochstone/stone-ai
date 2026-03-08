/**
 * HomeScreen — welcome, limits display, model grid.
 * Premium design with glassmorphism and glow effects.
 */

import { useStore } from '../../store/useStore'
import { haptic } from '../../utils/telegram'

export function HomeScreen() {
  const { palette, user, models, setModelId, setScreen } = useStore()
  const p = palette

  const liteModels = models.filter((m) => m.tier === 'lite')
  const premiumModels = models.filter((m) => m.tier === 'premium')

  const handleModelClick = (model: typeof models[0]) => {
    haptic('medium')
    setModelId(model.id)
    setScreen('chat')
  }

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Header with animated logo */}
      <div style={{
        textAlign: 'center',
        marginBottom: 28,
        animation: 'fadeIn 0.6s ease-out',
      }}>
        <div style={{
          fontSize: 42,
          marginBottom: 8,
          animation: 'float 4s ease-in-out infinite',
          filter: `drop-shadow(0 0 20px rgba(${p.primaryRgb},0.4))`,
        }}>
          🤖
        </div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 900,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary}, ${p.accent3})`,
          backgroundSize: '200% 200%',
          animation: 'gradientMove 4s ease infinite',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          Stone AI
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          {liteModels.length} Lite бесплатно • {premiumModels.length} Premium по подписке
        </p>
      </div>

      {/* Usage card — glass effect */}
      <div
        className="glass-card-accent"
        style={{
          padding: '18px 16px',
          marginBottom: 24,
          animation: 'slideUp 0.5s ease-out 0.1s both',
        }}
      >
        {/* Lite usage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 16,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,255,136,0.1)',
              borderRadius: 8,
            }}>🆓</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 }}>Lite сегодня</span>
          </div>
          <span style={{
            color: p.primary,
            fontWeight: 800,
            fontSize: 15,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {user.liteToday}/{user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}
          </span>
        </div>

        <div className="progress-bar" style={{ marginBottom: 14 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${user.liteLimitDay > 0 ? Math.min((user.liteToday / user.liteLimitDay) * 100, 100) : 0}%`,
            }}
          />
        </div>

        {/* Premium usage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 16,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(191,90,242,0.1)',
              borderRadius: 8,
            }}>💎</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 }}>Premium</span>
          </div>
          {user.plan === 'free' ? (
            <span
              onClick={() => { haptic('light'); setScreen('plans') }}
              style={{
                color: p.primary,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 700,
                padding: '4px 10px',
                background: `rgba(${p.primaryRgb},0.1)`,
                borderRadius: 8,
                border: `1px solid rgba(${p.primaryRgb},0.2)`,
                transition: 'all 0.2s',
              }}
            >
              PLUS / MAX →
            </span>
          ) : (
            <span style={{ color: '#bf5af2', fontWeight: 800, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
              {user.premiumToday}/{user.premiumLimitDay === -1 ? '∞' : user.premiumLimitDay}
            </span>
          )}
        </div>
      </div>

      {/* Lite models section */}
      <div style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 14,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,255,136,0.1)',
            borderRadius: 8,
          }}>🆓</span>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Lite — бесплатно</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 'auto' }}>20/день</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 28,
        }}>
          {liteModels.map((m, i) => (
            <ModelCard
              key={m.id}
              model={m}
              palette={p}
              delay={i * 0.05}
              onClick={() => handleModelClick(m)}
            />
          ))}
        </div>
      </div>

      {/* Premium models section */}
      <div style={{ animation: 'slideUp 0.5s ease-out 0.35s both' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 14,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(191,90,242,0.1)',
            borderRadius: 8,
          }}>💎</span>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Premium — подписка</span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(191,90,242,0.12)',
            color: '#bf5af2',
            border: '1px solid rgba(191,90,242,0.2)',
            marginLeft: 'auto',
          }}>PRO</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}>
          {premiumModels.map((m, i) => (
            <ModelCard
              key={m.id}
              model={m}
              palette={p}
              locked={user.plan === 'free' && !user.hasPass}
              delay={i * 0.05}
              onClick={() => {
                if (user.plan === 'free' && !user.hasPass) {
                  haptic('light')
                  setScreen('plans')
                } else {
                  handleModelClick(m)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ModelCard({
  model,
  palette,
  locked,
  delay = 0,
  onClick,
}: {
  model: any
  palette: any
  locked?: boolean
  delay?: number
  onClick: () => void
}) {
  const isLite = model.tier === 'lite'

  return (
    <div
      onClick={onClick}
      className={`model-card ${!locked ? 'model-card-accent' : ''} ${locked ? 'model-card-locked' : ''}`}
      style={{
        animation: `scaleIn 0.4s ease-out ${delay}s both`,
      }}
    >
      {/* Top glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: 1,
        background: `linear-gradient(90deg, transparent, ${isLite ? palette.primary : '#bf5af2'}, transparent)`,
        opacity: locked ? 0.1 : 0.4,
      }} />

      {/* Badge */}
      <div style={{
        position: 'absolute',
        top: 6,
        right: 6,
        fontSize: 8,
        fontWeight: 800,
        padding: '2px 6px',
        borderRadius: 5,
        background: isLite ? 'rgba(0,255,136,0.12)' : 'rgba(191,90,242,0.12)',
        color: isLite ? '#00ff88' : '#bf5af2',
        border: `1px solid ${isLite ? 'rgba(0,255,136,0.2)' : 'rgba(191,90,242,0.2)'}`,
        letterSpacing: '0.5px',
      }}>
        {isLite ? 'FREE' : 'PRO'}
      </div>

      {/* Lock icon */}
      {locked && (
        <div style={{
          position: 'absolute',
          top: 6,
          left: 6,
          fontSize: 10,
          opacity: 0.5,
        }}>🔒</div>
      )}

      {/* Model icon */}
      <div style={{
        fontSize: 32,
        marginBottom: 8,
        filter: locked ? 'grayscale(0.5)' : `drop-shadow(0 0 12px rgba(${palette.primaryRgb},0.3))`,
        transition: 'filter 0.3s',
      }}>
        {model.icon}
      </div>

      {/* Model name */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: locked ? '#666' : '#fff',
        marginBottom: 3,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.2,
      }}>
        {model.name}
      </div>

      {/* Company */}
      <div style={{
        fontSize: 9,
        color: locked ? '#555' : 'rgba(255,255,255,0.4)',
        fontWeight: 500,
      }}>
        {model.company}
      </div>
    </div>
  )
}
