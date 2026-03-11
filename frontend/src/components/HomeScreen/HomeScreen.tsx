/**
 * HomeScreen — 3-column card grid with Lite/Premium sections.
 * Click on model card opens ModelDetailScreen.
 */

import { useStore } from '../../store/useStore'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'

export function HomeScreen() {
  const { palette, user, models, setScreen, setSelectedModel } = useStore()
  const { t } = useTranslation()
  const p = palette

  const liteModels = models.filter((m) => m.tier === 'lite')
  const premiumModels = models.filter((m) => m.tier === 'premium')

  const handleModelClick = (model: typeof models[0]) => {
    haptic('medium')
    setSelectedModel(model)
    setScreen('model_detail')
  }

  return (
    <div style={{ padding: '20px 12px 100px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Lite section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: 6,
          background: 'rgba(0,255,136,0.15)',
          color: '#00ff88',
          border: '1px solid rgba(0,255,136,0.25)',
          letterSpacing: '0.5px',
        }}>FREE</span>
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#fff',
        }}>{t.home_lite_free}</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          fontWeight: 500,
        }}>{t.home_per_day}</span>
      </div>

      {/* Lite model grid — 3 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 32,
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

      {/* Premium section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        animation: 'fadeIn 0.5s ease-out 0.3s both',
      }}>
        <span style={{ fontSize: 22 }}>💎</span>
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#fff',
        }}>{t.home_premium_sub}</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: 6,
          background: 'rgba(191,90,242,0.12)',
          color: '#bf5af2',
          border: '1px solid rgba(191,90,242,0.25)',
          letterSpacing: '0.5px',
        }}>PRO</span>
      </div>

      {/* Premium model grid — 3 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 28,
      }}>
        {premiumModels.map((m, i) => (
          <ModelCard
            key={m.id}
            model={m}
            palette={p}
            locked={user.plan === 'free' && !user.hasPass}
            delay={i * 0.05}
            onClick={() => handleModelClick(m)}
          />
        ))}
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
      style={{
        position: 'relative',
        padding: '14px 8px 12px',
        borderRadius: 16,
        background: locked
          ? 'rgba(255,255,255,0.02)'
          : isLite
            ? `rgba(${palette.primaryRgb},0.04)`
            : 'rgba(191,90,242,0.03)',
        border: locked
          ? '1px solid rgba(255,255,255,0.06)'
          : isLite
            ? `1px solid rgba(${palette.primaryRgb},0.15)`
            : '1px solid rgba(191,90,242,0.12)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.25s',
        animation: `scaleIn 0.4s ease-out ${delay}s both`,
        overflow: 'hidden',
      }}
    >
      {/* Top glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '15%',
        right: '15%',
        height: 1,
        background: `linear-gradient(90deg, transparent, ${isLite ? palette.primary : '#bf5af2'}, transparent)`,
        opacity: locked ? 0.08 : 0.35,
      }} />

      {/* Badge (FREE / PRO) */}
      <div style={{
        position: 'absolute',
        top: 7,
        right: 7,
        fontSize: 8,
        fontWeight: 800,
        padding: '2px 7px',
        borderRadius: 5,
        background: isLite ? 'rgba(0,255,136,0.15)' : 'rgba(191,90,242,0.15)',
        color: isLite ? '#00ff88' : '#bf5af2',
        border: `1px solid ${isLite ? 'rgba(0,255,136,0.25)' : 'rgba(191,90,242,0.25)'}`,
        letterSpacing: '0.5px',
      }}>
        {isLite ? 'FREE' : 'PRO'}
      </div>

      {/* Lock icon for premium */}
      {locked && (
        <div style={{
          position: 'absolute',
          top: 7,
          left: 7,
          fontSize: 11,
          opacity: 0.45,
        }}>🔒</div>
      )}

      {/* Model icon — LARGE */}
      <div style={{
        fontSize: 42,
        marginBottom: 8,
        marginTop: 6,
        filter: locked
          ? 'grayscale(0.5) brightness(0.7)'
          : `drop-shadow(0 0 12px rgba(${palette.primaryRgb},0.25))`,
        transition: 'filter 0.3s',
        lineHeight: 1,
      }}>
        {model.icon}
      </div>

      {/* Model name */}
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: locked ? 'rgba(255,255,255,0.35)' : '#fff',
        marginBottom: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.3,
      }}>
        {model.name}
      </div>

      {/* Company */}
      <div style={{
        fontSize: 10,
        color: locked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)',
        fontWeight: 500,
      }}>
        {model.company}
      </div>
    </div>
  )
}
