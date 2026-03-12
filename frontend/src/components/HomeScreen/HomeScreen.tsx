/**
 * HomeScreen — welcome, limits display, model grid.
 */

import { useStore } from '../../store/useStore'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'

export function HomeScreen() {
  const { palette, user, models, setModelId, setScreen } = useStore()
  const { t } = useTranslation()
  const p = palette

  const liteModels = models.filter((m) => m.tier === 'lite')
  const premiumModels = models.filter((m) => m.tier === 'premium')

  const handleModelClick = (model: typeof models[0]) => {
    haptic('medium')
    setModelId(model.id)
    setScreen('chat')
  }

  return (
    <div style={{ padding: '16px 16px 80px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>
          Stone AI
        </h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
          {t.home_subtitle(liteModels.length, premiumModels.length)}
        </p>
      </div>

      {/* Promo Banner */}
      <PromoBanner palette={p} onPlansClick={() => { haptic('light'); setScreen('plans') }} />

      {/* Usage card */}
      <div style={{
        background: `rgba(${p.primaryRgb},0.06)`,
        border: `1px solid rgba(${p.primaryRgb},0.15)`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#aaa', fontSize: 13 }}>{t.home_lite_today}</span>
          <span style={{ color: p.primary, fontWeight: 700, fontSize: 14 }}>
            {user.liteToday}/{user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}
          </span>
        </div>
        <div style={{
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          <div style={{
            height: '100%',
            width: `${user.liteLimitDay > 0 ? Math.min((user.liteToday / user.liteLimitDay) * 100, 100) : 0}%`,
            background: `linear-gradient(90deg, ${p.primary}, ${p.secondary})`,
            borderRadius: 2,
            transition: 'width 0.3s',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#aaa', fontSize: 13 }}>{t.home_premium}</span>
          {user.plan === 'free' ? (
            <span
              onClick={() => { haptic('light'); setScreen('plans') }}
              style={{ color: '#aaff00', fontSize: 13, cursor: 'pointer' }}
            >
              PLUS / MAX →
            </span>
          ) : (
            <span style={{ color: '#bf5af2', fontWeight: 700, fontSize: 14 }}>
              {user.premiumToday}/{user.premiumLimitDay === -1 ? '∞' : user.premiumLimitDay}
            </span>
          )}
        </div>
      </div>

      {/* Lite models */}
      <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 10 }}>
        🆓 {t.home_lite_free}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 24,
      }}>
        {liteModels.map((m) => (
          <ModelCard key={m.id} model={m} palette={p} onClick={() => handleModelClick(m)} />
        ))}
      </div>

      {/* Premium models */}
      <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 10 }}>
        💎 {t.home_premium_sub}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}>
        {premiumModels.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            palette={p}
            locked={user.plan === 'free' && !user.hasPass}
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
  )
}

function PromoBanner({ palette, onPlansClick }: { palette: any; onPlansClick: () => void }) {
  const p = palette
  const features = [
    { icon: '🤖', text: '11 топовых AI-моделей' },
    { icon: '⚡', text: 'GPT-4.1 · Claude Opus 4 · Grok 3' },
    { icon: '🔍', text: 'Gemini 2.5 Pro · Perplexity · DeepSeek' },
    { icon: '🆓', text: '6 моделей бесплатно каждый день' },
    { icon: '🚀', text: 'Без VPN · Без регистраций · Внутри TG' },
    { icon: '💼', text: 'API-доступ для бизнеса на тарифе MAX' },
  ]

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.08), rgba(${p.secondaryRgb},0.05))`,
      border: `1px solid rgba(${p.primaryRgb},0.2)`,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${p.primaryRgb},0.15), transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: p.primary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        ✦ Stone AI — всё в одном
      </div>

      <div style={{
        fontSize: 15,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 12,
        lineHeight: 1.3,
      }}>
        Весь мировой AI<br />
        <span style={{
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>прямо в Telegram</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px 8px',
        marginBottom: 14,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13 }}>{f.icon}</span>
            <span style={{ fontSize: 11, color: '#bbb', lineHeight: 1.3 }}>{f.text}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onPlansClick}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
            color: '#000',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ⚡ Тарифы
        </button>
        <div style={{
          padding: '9px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 11,
          color: '#888',
          display: 'flex',
          alignItems: 'center',
        }}>
          от 469₽/мес
        </div>
      </div>
    </div>
  )
}

function ModelCard({
  model,
  palette,
  locked,
  onClick,
}: {
  model: any
  palette: any
  locked?: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: locked
          ? 'rgba(255,255,255,0.03)'
          : `rgba(${palette.primaryRgb},0.06)`,
        border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : `rgba(${palette.primaryRgb},0.15)`}`,
        borderRadius: 14,
        padding: '14px 8px',
        textAlign: 'center',
        cursor: 'pointer',
        opacity: locked ? 0.6 : 1,
        transition: 'transform 0.15s, opacity 0.15s',
        position: 'relative',
      }}
    >
      {/* Badge */}
      <div style={{
        position: 'absolute',
        top: 6,
        right: 6,
        fontSize: 8,
        fontWeight: 700,
        padding: '2px 5px',
        borderRadius: 4,
        background: model.tier === 'lite'
          ? 'rgba(0,255,136,0.15)'
          : 'rgba(191,90,242,0.15)',
        color: model.tier === 'lite' ? '#00ff88' : '#bf5af2',
      }}>
        {model.tier === 'lite' ? 'FREE' : 'PRO'}
      </div>

      <div style={{ fontSize: 28, marginBottom: 6 }}>{model.icon}</div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#fff',
        marginBottom: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {model.name}
      </div>
      <div style={{ fontSize: 9, color: '#888' }}>{model.company}</div>
    </div>
  )
}
