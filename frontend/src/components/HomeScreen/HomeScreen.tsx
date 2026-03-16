/**
 * HomeScreen — model grid with filters, usage stats, balance.
 * Supports 50+ models with horizontal filter tabs.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'
import { AdBanner } from '../AdBanner/AdBanner'
import { RewardedAdButton } from '../RewardedAdButton/RewardedAdButton'

type FilterId = 'all' | 'free' | 'openai' | 'anthropic' | 'google' | 'meta' | 'xai' | 'image' | 'search' | 'reason' | 'deepseek' | 'alibaba'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'free', label: '🆓 Бесплатные' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'meta', label: 'Meta' },
  { id: 'xai', label: 'xAI' },
  { id: 'alibaba', label: 'Alibaba' },
  { id: 'image', label: '🎨 Картинки' },
  { id: 'search', label: '🔍 Поиск' },
  { id: 'reason', label: '🧠 Reasoning' },
]

function applyFilter(models: any[], filter: FilterId) {
  switch (filter) {
    case 'all': return models
    case 'free': return models.filter(m => m.tier === 'lite')
    case 'image': return models.filter(m => m.category === 'image')
    case 'search': return models.filter(m => m.category === 'search')
    case 'reason': return models.filter(m => m.category === 'reason')
    case 'openai': return models.filter(m => m.company === 'OpenAI')
    case 'anthropic': return models.filter(m => m.company === 'Anthropic')
    case 'google': return models.filter(m => m.company === 'Google')
    case 'meta': return models.filter(m => m.company === 'Meta')
    case 'xai': return models.filter(m => m.company === 'xAI')
    case 'deepseek': return models.filter(m => m.company === 'DeepSeek')
    case 'alibaba': return models.filter(m => m.company === 'Alibaba')
    default: return models
  }
}

export function HomeScreen() {
  const { palette, user, models, setModelId, setScreen, setSelectedModel } = useStore()
  const { t } = useTranslation()
  const p = palette
  const [filter, setFilter] = useState<FilterId>('all')

  const filteredModels = useMemo(() => applyFilter(models, filter), [models, filter])

  const handleModelClick = (model: typeof models[0]) => {
    haptic('medium')
    if (model.tier === 'premium') {
      setSelectedModel(model)
      setScreen('model_detail')
    } else {
      setModelId(model.id)
      setScreen('chat')
    }
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
        <p style={{ color: '#568877', fontSize: 14, marginTop: 5 }}>
          50+ AI-моделей · прямо в Telegram
        </p>
      </div>

      {/* ═══ Usage card ═══ */}
      <div style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid rgba(${p.primaryRgb},0.25)`,
        borderRadius: 16, padding: 16, marginBottom: 16,
      }}>
        {/* Lite usage row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: '#aab8aa', fontSize: 13 }}>Бесплатных сегодня</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              color: liteUsedPct >= 100 ? '#ff6666' : p.primary,
              fontWeight: 700, fontSize: 14,
            }}>
              {user.liteToday}/{user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}
            </span>
            {user.liteLimitDay <= 10 && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#f5a623',
                background: 'rgba(245,166,35,0.12)', padding: '2px 6px',
                borderRadius: 4, whiteSpace: 'nowrap',
              }}>
                +5 за рекламу
              </span>
            )}
          </div>
        </div>
        <div style={{
          height: 5, background: 'rgba(255,255,255,0.08)',
          borderRadius: 3, overflow: 'hidden', marginBottom: 14,
        }}>
          <div style={{
            height: '100%', width: `${liteUsedPct}%`,
            background: liteUsedPct >= 100
              ? 'linear-gradient(90deg, #ff6666, #ff4444)'
              : `linear-gradient(90deg, ${p.primary}, ${p.secondary})`,
            borderRadius: 3, transition: 'width 0.3s',
            boxShadow: `0 0 8px rgba(${p.primaryRgb},0.5)`,
          }} />
        </div>

        {/* Balance row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `rgba(${p.primaryRgb},0.06)`,
          border: `1px solid rgba(${p.primaryRgb},0.15)`,
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💰</span>
            <span style={{ color: '#aab8aa', fontSize: 13 }}>Баланс</span>
          </div>
          {user.balanceUsd > 0 ? (
            <span style={{
              color: p.primary, fontWeight: 800, fontSize: 16,
              filter: `drop-shadow(0 0 6px rgba(${p.primaryRgb},0.5))`,
            }}>
              ${user.balanceUsd.toFixed(2)}
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

      {/* Rewarded ad button */}
      <RewardedAdButton />

      {/* ═══ Payment methods strip ═══ */}
      <div
        onClick={() => { haptic('light'); setScreen('plans') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(8,16,12,0.95)',
          border: `1px solid rgba(${p.primaryRgb},0.2)`,
          borderRadius: 14, padding: '12px 14px', marginBottom: 16,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f8ec', marginBottom: 3 }}>
            Пополнить баланс
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { icon: '⭐', label: 'Stars' },
              { icon: '💎', label: 'TON' },
              { icon: '💳', label: 'Карта/СБП' },
              { icon: '🪙', label: 'Крипто' },
            ].map(m => (
              <span key={m.label} style={{
                fontSize: 10, color: '#8aaa98',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 7px', borderRadius: 5,
              }}>
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 800, color: p.primary,
          background: `rgba(${p.primaryRgb},0.12)`,
          padding: '6px 12px', borderRadius: 8, flexShrink: 0,
        }}>
          →
        </span>
      </div>

      {/* ═══ Filter tabs (horizontal scroll) ═══ */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
        marginBottom: 14, WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); haptic('light') }}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 10,
                border: 'none',
                background: active
                  ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                  : 'rgba(255,255,255,0.06)',
                color: active ? '#000' : '#8aa898',
                fontSize: 12, fontWeight: active ? 800 : 600,
                cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ═══ Model count ═══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <span style={{ color: '#668877', fontSize: 11, fontWeight: 600 }}>
          {filteredModels.length} {filteredModels.length === 1 ? 'модель' : filteredModels.length < 5 ? 'модели' : 'моделей'}
        </span>
        {filter !== 'all' && (
          <span
            onClick={() => setFilter('all')}
            style={{ color: p.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Показать все →
          </span>
        )}
      </div>

      {/* ═══ Model grid ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {filteredModels.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            palette={p}
            priceWeighted={m.price_weighted || 0}
            onClick={() => handleModelClick(m)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredModels.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#556655' }}>
          Нет моделей для этого фильтра
        </div>
      )}

      {/* Ad banner at bottom for free users */}
      <div style={{ marginTop: 16 }}>
        <AdBanner placement="home_banner" />
      </div>
    </div>
  )
}


/* ═══ Model Card ═══ */

function ModelCard({
  model, palette, priceWeighted, onClick,
}: {
  model: any; palette: any; priceWeighted?: number; onClick: () => void
}) {
  const p = palette
  const isPremium = model.tier === 'premium'

  // Category badge color
  const catColors: Record<string, string> = {
    image: '#f5a623',
    search: '#4a90d9',
    reason: '#bf5af2',
    code: '#00cc88',
  }
  const catColor = catColors[model.category]

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid ${isPremium
          ? 'rgba(191,90,242,0.25)'
          : `rgba(${p.primaryRgb},0.25)`}`,
        borderRadius: 14, padding: '14px 8px',
        textAlign: 'center', cursor: 'pointer',
        transition: 'transform 0.15s',
        position: 'relative',
      }}
    >
      {/* Tier badge */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
        background: isPremium ? 'rgba(191,90,242,0.2)' : `rgba(${p.primaryRgb},0.15)`,
        color: isPremium ? '#bf5af2' : p.primary,
      }}>
        {isPremium ? 'PRO' : 'FREE'}
      </div>

      {/* Category badge (for non-chat) */}
      {catColor && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          fontSize: 7, fontWeight: 700, padding: '2px 4px', borderRadius: 3,
          background: `${catColor}20`, color: catColor, textTransform: 'uppercase',
        }}>
          {model.category}
        </div>
      )}

      <div style={{ fontSize: 28, marginBottom: 6 }}>{model.icon}</div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#e0f8ec', marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {model.name}
      </div>
      <div style={{ fontSize: 9, color: '#4a7a5a' }}>{model.company}</div>

      {/* Price */}
      <div style={{
        fontSize: 9, fontWeight: 800, marginTop: 5,
        color: isPremium ? '#bf5af2' : '#00cc66',
        background: isPremium ? 'rgba(191,90,242,0.1)' : `rgba(${p.primaryRgb},0.1)`,
        padding: '2px 6px', borderRadius: 5, display: 'inline-block',
      }}>
        {isPremium
          ? (priceWeighted && priceWeighted > 0 ? `$${priceWeighted.toFixed(1)}/M` : 'PRO')
          : 'FREE'}
      </div>
    </div>
  )
}
