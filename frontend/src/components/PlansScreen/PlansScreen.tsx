/**
 * PlansScreen — subscription plans, passes, payment methods.
 */

import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { haptic } from '../../utils/telegram'

// Subscription data
const SUBS: Record<string, any[]> = {
  stars: [
    { id: 'plus_stars', name: 'PLUS', icon: '⚡', price: '469', unit: '⭐/мес', hint: '≈ $7.5/мес', tier: 'plus', popular: true },
    { id: 'max_stars', name: 'MAX', icon: '👑', price: '1499', unit: '⭐/мес', hint: '≈ $24/мес', tier: 'max' },
  ],
  ton: [
    { id: 'plus_ton_1m', name: 'PLUS 1 мес', icon: '⚡', price: '6', unit: 'TON', hint: '≈ $8', tier: 'plus', popular: true },
    { id: 'plus_ton_3m', name: 'PLUS 3 мес', icon: '⚡', price: '14.5', unit: 'TON', hint: '−20%', tier: 'plus' },
    { id: 'max_ton_1m', name: 'MAX 1 мес', icon: '👑', price: '19', unit: 'TON', hint: '≈ $25', tier: 'max' },
    { id: 'max_ton_3m', name: 'MAX 3 мес', icon: '👑', price: '46', unit: 'TON', hint: '−19%', tier: 'max' },
  ],
  usdt: [
    { id: 'plus_usdt_1m', name: 'PLUS 1 мес', icon: '⚡', price: '7.99', unit: 'USDT', hint: 'TRC-20/TON', tier: 'plus', popular: true },
    { id: 'plus_usdt_3m', name: 'PLUS 3 мес', icon: '⚡', price: '18.99', unit: 'USDT', hint: '−21%', tier: 'plus' },
    { id: 'max_usdt_1m', name: 'MAX 1 мес', icon: '👑', price: '24.99', unit: 'USDT', hint: 'TRC-20/TON', tier: 'max' },
    { id: 'max_usdt_3m', name: 'MAX 3 мес', icon: '👑', price: '59.99', unit: 'USDT', hint: '−20%', tier: 'max' },
  ],
}

const PASSES: Record<string, any[]> = {
  stars: [
    { id: 'day_pass', name: 'Day Pass', icon: '🎫', price: '59', unit: '⭐', hint: '15 Premium • 24ч' },
    { id: 'week_pass', name: 'Week Pass', icon: '🎟️', price: '229', unit: '⭐', hint: '80 Premium • 7 дней', popular: true },
    { id: 'single_query', name: '1 запрос', icon: '💬', price: '6', unit: '⭐', hint: '1 Premium запрос' },
  ],
  ton: [
    { id: 'day_pass_ton', name: 'Day Pass', icon: '🎫', price: '0.5', unit: 'TON', hint: '15 Premium • 24ч' },
    { id: 'week_pass_ton', name: 'Week Pass', icon: '🎟️', price: '1.8', unit: 'TON', hint: '80 Premium • 7 дней', popular: true },
  ],
  usdt: [
    { id: 'day_pass_usdt', name: 'Day Pass', icon: '🎫', price: '0.99', unit: 'USDT', hint: '15 Premium • 24ч' },
    { id: 'week_pass_usdt', name: 'Week Pass', icon: '🎟️', price: '3.49', unit: 'USDT', hint: '80 Premium • 7 дней', popular: true },
  ],
}

const PAY_TABS = [
  { id: 'stars', label: '⭐ Stars' },
  { id: 'ton', label: '💎 TON' },
  { id: 'usdt', label: '💲 USDT' },
]

export function PlansScreen() {
  const { palette } = useStore()
  const p = palette

  const [view, setView] = useState<'subs' | 'passes'>('subs')
  const [payMethod, setPayMethod] = useState('stars')

  const items = view === 'subs' ? (SUBS[payMethod] || []) : (PASSES[payMethod] || [])

  return (
    <div style={{ padding: '16px 16px 80px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          margin: 0,
        }}>
          Тарифы Stone AI
        </h2>
        <p style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          6 Lite бесплатно • Premium по подписке
        </p>
      </div>

      {/* How it works card */}
      <div style={{
        background: `rgba(${p.primaryRgb},0.06)`,
        border: `1px solid rgba(${p.primaryRgb},0.12)`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        fontSize: 13,
        color: '#ccc',
        lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 700, color: p.primary, marginBottom: 6 }}>
          💡 Как это работает?
        </div>
        <b style={{ color: '#fff' }}>Lite модели</b> (GPT-4o mini, Haiku, Flash, DeepSeek, Llama, Mistral) —
        бесплатно, 20 запросов/день.
        <br /><br />
        <b style={{ color: '#fff' }}>Premium модели</b> (GPT-4.1, Claude Opus 4, Grok 3, Gemini 2.5 Pro, Perplexity) —
        подписка PLUS или MAX, либо купи Pass.
      </div>

      {/* Subs / Passes toggle */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 3,
        marginBottom: 16,
      }}>
        {(['subs', 'passes'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { haptic('light'); setView(v) }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 10,
              background: view === v
                ? `rgba(${p.primaryRgb},0.15)`
                : 'transparent',
              color: view === v ? p.primary : '#888',
              fontWeight: view === v ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {v === 'subs' ? '📋 Подписки' : '🎫 Пассы'}
          </button>
        ))}
      </div>

      {/* Payment method tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
      }}>
        {PAY_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { haptic('light'); setPayMethod(t.id) }}
            style={{
              flex: 1,
              padding: '8px 0',
              border: payMethod === t.id
                ? `1px solid rgba(${p.primaryRgb},0.3)`
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              background: payMethod === t.id
                ? `rgba(${p.primaryRgb},0.1)`
                : 'rgba(255,255,255,0.03)',
              color: payMethod === t.id ? '#fff' : '#888',
              fontSize: 12,
              fontWeight: payMethod === t.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: item.popular
                ? `rgba(${p.primaryRgb},0.08)`
                : 'rgba(255,255,255,0.03)',
              border: item.popular
                ? `1px solid rgba(${p.primaryRgb},0.25)`
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 16,
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => haptic('medium')}
          >
            {item.popular && (
              <div style={{
                position: 'absolute',
                top: -8,
                right: 12,
                background: p.primary,
                color: '#000',
                fontSize: 9,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
              }}>
                POPULAR
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                <div style={{ color: '#888', fontSize: 11 }}>{item.hint}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  color: p.primary,
                  fontWeight: 800,
                  fontSize: 18,
                }}>
                  {item.price}
                </div>
                <div style={{ color: '#888', fontSize: 10 }}>{item.unit}</div>
              </div>
            </div>

            <button style={{
              width: '100%',
              padding: '10px 0',
              border: 'none',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
              color: '#000',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}>
              Купить
            </button>
          </div>
        ))}
      </div>

      {/* Upsell for passes */}
      {view === 'passes' && (
        <div style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 12,
          background: 'rgba(170,255,0,0.06)',
          border: '1px solid rgba(170,255,0,0.15)',
          fontSize: 12,
          color: '#ccc',
          textAlign: 'center',
        }}>
          💡 <b style={{ color: '#aaff00' }}>Подписка выгоднее!</b>
          <br />PLUS за 469⭐/мес = всего 15.6⭐/день vs Day Pass 59⭐/день
        </div>
      )}
    </div>
  )
}
