/**
 * PlansScreen — subscription plans, passes, payment methods.
 * Premium design with animated cards and glow effects.
 */

import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { haptic } from '../../utils/telegram'

// Subscription data
const SUBS: Record<string, any[]> = {
  stars: [
    { id: 'plus_stars', name: 'PLUS', icon: '⚡', price: '699', unit: '⭐/мес', hint: '10 Premium/день (без Opus) • ≈ $11.2/мес', tier: 'plus', popular: true },
    { id: 'max_stars', name: 'MAX', icon: '👑', price: '1999', unit: '⭐/мес', hint: '30 Premium + 5 Opus/день • ≈ $32/мес', tier: 'max' },
  ],
  ton: [
    { id: 'plus_ton_1m', name: 'PLUS 1 мес', icon: '⚡', price: '9', unit: 'TON', hint: '10 Premium/день', tier: 'plus', popular: true },
    { id: 'plus_ton_3m', name: 'PLUS 3 мес', icon: '⚡', price: '22', unit: 'TON', hint: '−18% экономия', tier: 'plus' },
    { id: 'max_ton_1m', name: 'MAX 1 мес', icon: '👑', price: '26', unit: 'TON', hint: '30 Premium + 5 Opus/день', tier: 'max' },
    { id: 'max_ton_3m', name: 'MAX 3 мес', icon: '👑', price: '63', unit: 'TON', hint: '−19% экономия', tier: 'max' },
  ],
  usdt: [
    { id: 'plus_usdt_1m', name: 'PLUS 1 мес', icon: '⚡', price: '11.99', unit: 'USDT', hint: 'TRC-20/TON', tier: 'plus', popular: true },
    { id: 'plus_usdt_3m', name: 'PLUS 3 мес', icon: '⚡', price: '28.99', unit: 'USDT', hint: '−21% экономия', tier: 'plus' },
    { id: 'max_usdt_1m', name: 'MAX 1 мес', icon: '👑', price: '34.99', unit: 'USDT', hint: 'TRC-20/TON', tier: 'max' },
    { id: 'max_usdt_3m', name: 'MAX 3 мес', icon: '👑', price: '84.99', unit: 'USDT', hint: '−20% экономия', tier: 'max' },
  ],
}

const PASSES: Record<string, any[]> = {
  stars: [
    { id: 'day_pass', name: 'Day Pass', icon: '🎫', price: '79', unit: '⭐', hint: '15 Premium • 24 часа' },
    { id: 'week_pass', name: 'Week Pass', icon: '🎟️', price: '299', unit: '⭐', hint: '50 Premium • 7 дней', popular: true },
    { id: 'single_query', name: '1 запрос', icon: '💬', price: '9', unit: '⭐', hint: '1 Premium запрос' },
  ],
  ton: [
    { id: 'day_pass_ton', name: 'Day Pass', icon: '🎫', price: '0.65', unit: 'TON', hint: '15 Premium • 24 часа' },
    { id: 'week_pass_ton', name: 'Week Pass', icon: '🎟️', price: '2.4', unit: 'TON', hint: '50 Premium • 7 дней', popular: true },
  ],
  usdt: [
    { id: 'day_pass_usdt', name: 'Day Pass', icon: '🎫', price: '1.29', unit: 'USDT', hint: '15 Premium • 24 часа' },
    { id: 'week_pass_usdt', name: 'Week Pass', icon: '🎟️', price: '4.79', unit: 'USDT', hint: '50 Premium • 7 дней', popular: true },
  ],
}

const PAY_TABS = [
  { id: 'stars', label: '⭐ Stars', desc: 'Telegram' },
  { id: 'ton', label: '💎 TON', desc: 'Wallet' },
  { id: 'usdt', label: '💲 USDT', desc: 'CryptoBot' },
]

export function PlansScreen() {
  const { palette } = useStore()
  const p = palette

  const [view, setView] = useState<'subs' | 'passes'>('subs')
  const [payMethod, setPayMethod] = useState('stars')

  const items = view === 'subs' ? (SUBS[payMethod] || []) : (PASSES[payMethod] || [])

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 24,
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <div style={{
          fontSize: 36,
          marginBottom: 8,
          filter: `drop-shadow(0 0 16px rgba(${p.primaryRgb},0.4))`,
        }}>💎</div>
        <h2 style={{
          fontSize: 24,
          fontWeight: 900,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>
          Тарифы Stone AI
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
          Разблокируй лучшие AI-модели мира
        </p>
      </div>

      {/* How it works — glass card */}
      <div
        className="glass-card-accent"
        style={{
          padding: 16,
          marginBottom: 20,
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.6,
          animation: 'slideUp 0.5s ease-out 0.1s both',
        }}
      >
        <div style={{
          fontWeight: 800,
          color: p.primary,
          marginBottom: 8,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          💡 Как это работает?
        </div>
        <div style={{ marginBottom: 6 }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(0,255,136,0.1)',
            color: '#00ff88',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            marginRight: 6,
          }}>FREE</span>
          <b style={{ color: '#fff' }}>Lite</b> — GPT-4o mini, Haiku, Flash, DeepSeek, Llama, Mistral — 20/день
        </div>
        <div>
          <span style={{
            display: 'inline-block',
            background: 'rgba(191,90,242,0.1)',
            color: '#bf5af2',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            marginRight: 6,
          }}>PRO</span>
          <b style={{ color: '#fff' }}>Premium</b> — GPT-4.1, Opus 4, Grok 3, Gemini 2.5 Pro, Perplexity
        </div>
      </div>

      {/* Subs / Passes toggle */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
        animation: 'slideUp 0.5s ease-out 0.15s both',
      }}>
        {(['subs', 'passes'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { haptic('light'); setView(v) }}
            style={{
              flex: 1,
              padding: '11px 0',
              border: 'none',
              borderRadius: 11,
              background: view === v
                ? `linear-gradient(135deg, rgba(${p.primaryRgb},0.15), rgba(${p.secondaryRgb},0.1))`
                : 'transparent',
              color: view === v ? '#fff' : 'rgba(255,255,255,0.4)',
              fontWeight: view === v ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.25s',
              boxShadow: view === v ? `0 0 12px rgba(${p.primaryRgb},0.1)` : 'none',
            }}
          >
            {v === 'subs' ? '📋 Подписки' : '🎫 Пассы'}
          </button>
        ))}
      </div>

      {/* Payment method tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        animation: 'slideUp 0.5s ease-out 0.2s both',
      }}>
        {PAY_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { haptic('light'); setPayMethod(t.id) }}
            style={{
              flex: 1,
              padding: '10px 0 8px',
              border: payMethod === t.id
                ? `1px solid rgba(${p.primaryRgb},0.3)`
                : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              background: payMethod === t.id
                ? `rgba(${p.primaryRgb},0.08)`
                : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'all 0.25s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{
              fontSize: 13,
              color: payMethod === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontWeight: payMethod === t.id ? 700 : 500,
            }}>{t.label}</span>
            <span style={{
              fontSize: 9,
              color: payMethod === t.id ? p.primary : 'rgba(255,255,255,0.25)',
            }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="glass-card"
            style={{
              padding: 18,
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
              border: item.popular
                ? `1px solid rgba(${p.primaryRgb},0.25)`
                : '1px solid rgba(255,255,255,0.06)',
              background: item.popular
                ? `rgba(${p.primaryRgb},0.06)`
                : 'rgba(255,255,255,0.02)',
              animation: `slideUp 0.4s ease-out ${0.25 + i * 0.08}s both`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onClick={() => haptic('medium')}
          >
            {/* Popular tag */}
            {item.popular && <div className="popular-tag">POPULAR</div>}

            {/* Tier glow line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${item.tier === 'max' ? '#bf5af2' : p.primary}, transparent)`,
              opacity: 0.3,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                fontSize: 28,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: item.tier === 'max' ? 'rgba(191,90,242,0.1)' : `rgba(${p.primaryRgb},0.1)`,
                borderRadius: 14,
                border: `1px solid ${item.tier === 'max' ? 'rgba(191,90,242,0.2)' : `rgba(${p.primaryRgb},0.15)`}`,
              }}>{item.icon}</div>

              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  {item.name}
                  <span style={{
                    fontSize: 8,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: item.tier === 'max' ? 'rgba(191,90,242,0.12)' : 'rgba(170,255,0,0.12)',
                    color: item.tier === 'max' ? '#bf5af2' : '#aaff00',
                  }}>
                    {item.tier?.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{item.hint}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  color: p.primary,
                  fontWeight: 900,
                  fontSize: 22,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {item.price}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>{item.unit}</div>
              </div>
            </div>

            <button
              className="btn-gradient"
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: 14,
                letterSpacing: '0.5px',
              }}
            >
              Купить
            </button>
          </div>
        ))}
      </div>

      {/* Upsell for passes */}
      {view === 'passes' && (
        <div
          className="glass-card"
          style={{
            marginTop: 18,
            padding: 16,
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            border: '1px solid rgba(170,255,0,0.12)',
            background: 'rgba(170,255,0,0.03)',
            animation: 'fadeIn 0.5s ease-out',
          }}
        >
          <span style={{ fontSize: 16, marginRight: 4 }}>💡</span>
          <b style={{ color: '#aaff00' }}>Подписка выгоднее!</b>
          <br /><span style={{ color: 'rgba(255,255,255,0.4)' }}>
            PLUS за 699⭐/мес = 23.3⭐/день vs Day Pass 79⭐/день
          </span>
        </div>
      )}
    </div>
  )
}
