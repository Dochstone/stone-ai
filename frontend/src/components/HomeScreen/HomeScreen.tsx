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

  const liteUsedPct = user.liteLimitDay > 0
    ? Math.min((user.liteToday / user.liteLimitDay) * 100, 100)
    : 0

  return (
    <div style={{ padding: '16px 16px 80px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, margin: 0,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Stone AI
        </h1>
        <p style={{ color: '#568877', fontSize: 18, marginTop: 5 }}>
          Весь мировой AI · прямо в Telegram
        </p>
      </div>

      {/* Promo Banner */}
      <PromoBanner palette={p} onPlansClick={() => { haptic('light'); setScreen('plans') }} />

      {/* Usage card */}
      <div style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid rgba(${p.primaryRgb},0.25)`,
        borderRadius: 16, padding: 16, marginBottom: 20,
      }}>
        {/* Lite usage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#aab8aa', fontSize: 13 }}>Бесплатных сегодня</span>
          <span style={{
            color: liteUsedPct >= 100 ? '#ff6666' : p.primary,
            fontWeight: 700, fontSize: 14,
          }}>
            {user.liteToday}/{user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}
          </span>
        </div>
        <div style={{
          height: 5, background: 'rgba(255,255,255,0.08)',
          borderRadius: 3, overflow: 'hidden', marginBottom: 14,
        }}>
          <div style={{
            height: '100%',
            width: `${liteUsedPct}%`,
            background: liteUsedPct >= 100
              ? 'linear-gradient(90deg, #ff6666, #ff4444)'
              : `linear-gradient(90deg, ${p.primary}, ${p.secondary})`,
            borderRadius: 3, transition: 'width 0.3s',
            boxShadow: `0 0 8px rgba(${p.primaryRgb},0.5)`,
          }} />
        </div>

        {/* Credits */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `rgba(${p.primaryRgb},0.06)`,
          border: `1px solid rgba(${p.primaryRgb},0.15)`,
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💎</span>
            <span style={{ color: '#aab8aa', fontSize: 13 }}>Кредиты</span>
          </div>
          {user.credits > 0 ? (
            <span style={{
              color: p.primary, fontWeight: 800, fontSize: 16,
              filter: `drop-shadow(0 0 6px rgba(${p.primaryRgb},0.5))`,
            }}>
              {user.credits.toLocaleString()} кр.
            </span>
          ) : (
            <span
              onClick={() => { haptic('light'); setScreen('plans') }}
              style={{
                background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Пополнить →
            </span>
          )}
        </div>
      </div>

      {/* Lite models */}
      <h3 style={{ color: '#c0e8d0', fontSize: 14, marginBottom: 10, fontWeight: 700, letterSpacing: 0.5 }}>
        🆓 {t.home_lite_free}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {liteModels.map((m) => (
          <ModelCard key={m.id} model={m} palette={p} onClick={() => handleModelClick(m)} />
        ))}
      </div>

      {/* Premium models */}
      <h3 style={{ color: '#c0e8d0', fontSize: 14, marginBottom: 10, fontWeight: 700, letterSpacing: 0.5 }}>
        💎 {t.home_premium_sub}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {premiumModels.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            palette={p}
            creditCost={user.creditCosts?.[m.id] || 0}
            canAfford={user.credits >= (user.creditCosts?.[m.id] || 0)}
            onClick={() => {
              if (user.credits < (user.creditCosts?.[m.id] || 0)) {
                haptic('light'); setScreen('plans')
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
    { icon: '🤖', text: 'Плати сколько хочешь - никаких подписок' },
    { icon: '⚡', text: 'GPT-4.1 · Claude Opus 4 · Grok 3 · Liama' },
    { icon: '🔍', text: 'Gemini 2.5 Pro · Perplexity · DeepSeek, Sonnet 4.6' },
    { icon: '🆓', text: '6 бесплатных модели и 20 запросов каждый день' },
    { icon: '🚀', text: 'Без VPN · Без регистраций на сервисах · Без блокировок' },
    { icon: '💎', text: 'Пополняй баланс звездами, картой или криптокошельком' },
  ]

  return (
    <div style={{
      background: 'rgba(8,16,12,0.95)',
      border: `1px solid rgba(${p.primaryRgb},0.3)`,
      borderRadius: 16, padding: 16, marginBottom: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${p.primaryRgb},0.12), transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: 11, fontWeight: 700, color: p.primary,
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
      }}>
        ✦ Stone AI — топ 11 AI моделей в одном приложении
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
        Забудь о vpn, блокировках аккаунта и десятках регистраций! 
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 10px', marginBottom: 14 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{f.icon}</span>
            <span style={{ fontSize: 11, color: '#99bbaa', lineHeight: 1.4 }}>{f.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onPlansClick}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          boxShadow: `0 4px 20px rgba(${p.primaryRgb},0.4)`,
          letterSpacing: 0.5,
        }}
      >
        ⚡ Пополнить баланс
      </button>
    </div>
  )
}

function ModelCard({
  model, palette, locked, creditCost, canAfford, onClick,
}: {
  model: any; palette: any; locked?: boolean
  creditCost?: number; canAfford?: boolean; onClick: () => void
}) {
  const p = palette
  const isLocked = locked ?? (creditCost !== undefined && creditCost > 0 && !canAfford)
  const isPremium = model.tier === 'premium'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid ${isLocked
          ? 'rgba(255,255,255,0.1)'
          : isPremium
            ? 'rgba(191,90,242,0.3)'
            : `rgba(${p.primaryRgb},0.25)`}`,
        borderRadius: 14, padding: '14px 8px',
        textAlign: 'center', cursor: 'pointer',
        opacity: isLocked ? 0.55 : 1,
        transition: 'transform 0.15s',
        position: 'relative',
      }}
    >
      {/* Badge */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
        background: isPremium ? 'rgba(191,90,242,0.2)' : `rgba(${p.primaryRgb},0.15)`,
        color: isPremium ? '#bf5af2' : p.primary,
      }}>
        {isPremium ? 'PRO' : 'FREE'}
      </div>

      <div style={{ fontSize: 28, marginBottom: 6 }}>{model.icon}</div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#e0f8ec', marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {model.name}
      </div>
      <div style={{ fontSize: 9, color: '#4a7a5a' }}>{model.company}</div>
      {creditCost !== undefined && creditCost > 0 && (
        <div style={{
          fontSize: 9, fontWeight: 800, marginTop: 5,
          color: canAfford ? '#bf5af2' : '#445544',
          background: canAfford ? 'rgba(191,90,242,0.1)' : 'rgba(255,255,255,0.04)',
          padding: '2px 6px', borderRadius: 5, display: 'inline-block',
        }}>
          {creditCost} кр.
        </div>
      )}
    </div>
  )
}
