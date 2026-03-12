/**
 * PlansScreen — Credit top-up with free amount input.
 * Price: $1.22/credit (standard) | $1.12/credit (VIP, total deposits > $10,000)
 * Lite models: free 20/day. Premium: credits per request.
 */

import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { haptic } from '../../utils/telegram'

// 1 Star ≈ $0.013
const STAR_PRICE_USD = 0.013
const CREDIT_PRICE_STANDARD = 1.22  // $ per credit
const CREDIT_PRICE_VIP = 1.12       // $ per credit (total deposits > $10,000)
const VIP_THRESHOLD_USD = 10000

const PREMIUM_MODELS = [
  { id: 'claude-opus-4',        name: 'Claude Opus 4',   icon: '🧠', company: 'Anthropic', credits: 34 },
  { id: 'gpt-4.1',              name: 'GPT-4.1',         icon: '🤖', company: 'OpenAI',    credits: 15 },
  { id: 'grok-3',               name: 'Grok 3',          icon: '⚡',  company: 'xAI',       credits: 19 },
  { id: 'gemini-2.5-pro',       name: 'Gemini 2.5 Pro',  icon: '🔮', company: 'Google',    credits: 13 },
  { id: 'perplexity-sonar-pro', name: 'Perplexity Pro',  icon: '🔍', company: 'Perplexity',credits: 19 },
]

const QUICK_AMOUNTS_USD = [5, 10, 25, 50]

export function PlansScreen() {
  const { user, palette: p } = useStore()
  const { buyWithStars, paymentLoading, resetPayment } = usePayment()
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [amountUsd, setAmountUsd] = useState('')
  const [payMethod, setPayMethod] = useState<'stars' | 'fiat'>('stars')
  const [buying, setBuying] = useState(false)

  // VIP if total deposits > $10k
  const isVip = (user.totalDepositedUsd ?? 0) >= VIP_THRESHOLD_USD
  const creditPrice = isVip ? CREDIT_PRICE_VIP : CREDIT_PRICE_STANDARD

  const usd = parseFloat(amountUsd) || 0
  const creditsToReceive = usd > 0 ? Math.floor(usd / creditPrice) : 0
  const starsNeeded = usd > 0 ? Math.ceil(usd / STAR_PRICE_USD) : 0

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBuyStars = async () => {
    if (usd < 1) return showToast('Минимум $1', false)
    haptic('medium')
    setBuying(true)
    const result = await buyWithStars({ usd_amount: usd, credits: creditsToReceive, method: 'stars' })
    if (result.status === 'success') {
      showToast('✅ Кредиты зачислены!', true)
      setTimeout(() => window.location.reload(), 1200)
    } else if (result.status === 'cancelled') {
      showToast('Отменено', false)
    } else {
      showToast(result.error || 'Ошибка оплаты', false)
    }
    setBuying(false)
    resetPayment()
  }

  const handleBuyFiat = () => {
    if (usd < 1) return showToast('Минимум $1', false)
    haptic('medium')
    // TODO: open YooKassa payment
    showToast('Скоро: оплата картой', false)
  }

  return (
    <div style={{ padding: '16px 16px 90px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{
          fontSize: 26, fontWeight: 800, margin: 0,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Кредиты
        </h1>
        <p style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          Lite модели бесплатно · Premium за кредиты
        </p>
      </div>

      {/* Balance */}
      <div style={{
        background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.12), rgba(${p.secondaryRgb},0.06))`,
        border: `1px solid rgba(${p.primaryRgb},0.25)`,
        borderRadius: 16, padding: 16, marginBottom: 20, textAlign: 'center',
      }}>
        {isVip && (
          <div style={{
            display: 'inline-block', marginBottom: 6,
            background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
            color: '#000', fontSize: 9, fontWeight: 900,
            padding: '2px 10px', borderRadius: 6, letterSpacing: 1,
          }}>
            👑 VIP · $1.12 за кредит
          </div>
        )}
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Твой баланс</div>
        <div style={{
          fontSize: 42, fontWeight: 900,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {user.credits.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>кредитов</div>
      </div>

      {/* Top-up block */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>
          ⚡ ПОПОЛНИТЬ БАЛАНС
        </div>

        {/* Price per credit */}
        <div style={{
          fontSize: 12, color: p.primary, marginBottom: 14, fontWeight: 600,
        }}>
          1 кредит = ${creditPrice.toFixed(2)}
          {!isVip && <span style={{ color: '#555', fontWeight: 400 }}> · скидка VIP от $10,000</span>}
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {QUICK_AMOUNTS_USD.map(a => (
            <button
              key={a}
              onClick={() => { setAmountUsd(String(a)); haptic('light') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                background: amountUsd === String(a)
                  ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                  : 'rgba(255,255,255,0.07)',
                color: amountUsd === String(a) ? '#000' : '#aaa',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              ${a}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: '#666', fontSize: 16, fontWeight: 700,
          }}>$</span>
          <input
            type="number"
            min="1"
            placeholder="Своя сумма"
            value={amountUsd}
            onChange={e => setAmountUsd(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px 12px 28px', borderRadius: 12,
              border: `1px solid rgba(${p.primaryRgb},0.2)`,
              background: 'rgba(255,255,255,0.05)', color: '#e0f0e8',
              fontSize: 16, fontWeight: 700, boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Preview */}
        {creditsToReceive > 0 && (
          <div style={{
            background: `rgba(${p.primaryRgb},0.08)`,
            border: `1px solid rgba(${p.primaryRgb},0.15)`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 12, color: '#888' }}>Получишь кредитов</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: p.primary }}>
              {creditsToReceive.toLocaleString()}
            </div>
          </div>
        )}

        {/* Payment method toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['stars', 'fiat'] as const).map(method => (
            <button
              key={method}
              onClick={() => { setPayMethod(method); haptic('light') }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                background: payMethod === method
                  ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                  : 'rgba(255,255,255,0.07)',
                color: payMethod === method ? '#000' : '#aaa',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {method === 'stars' ? '⭐ Telegram Stars' : '💳 Картой'}
            </button>
          ))}
        </div>

        {/* Buy button */}
        <button
          onClick={payMethod === 'stars' ? handleBuyStars : handleBuyFiat}
          disabled={buying || !!paymentLoading || usd < 1}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: usd >= 1
              ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
              : 'rgba(255,255,255,0.06)',
            color: usd >= 1 ? '#000' : '#444',
            fontWeight: 900, fontSize: 16, cursor: usd >= 1 ? 'pointer' : 'default',
            opacity: buying ? 0.7 : 1,
          }}
        >
          {buying ? '⏳ Обрабатываем...' : payMethod === 'stars'
            ? (creditsToReceive > 0 ? `Оплатить ${starsNeeded} ⭐` : 'Введи сумму')
            : (creditsToReceive > 0 ? `Оплатить $${usd}` : 'Введи сумму')}
        </button>
      </div>

      {/* Premium model costs */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 14, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, fontWeight: 700, letterSpacing: 1 }}>
          💎 СТОИМОСТЬ PREMIUM МОДЕЛЕЙ
        </div>
        {PREMIUM_MODELS.map(m => {
          const canAfford = user.credits >= m.credits
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 18, width: 28 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f0e8' }}>{m.name}</div>
                <div style={{ fontSize: 10, color: '#5a8a70' }}>{m.company}</div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800,
                color: canAfford ? p.primary : '#666',
                background: canAfford ? `rgba(${p.primaryRgb},0.1)` : 'rgba(255,255,255,0.05)',
                padding: '3px 10px', borderRadius: 8,
              }}>
                {m.credits} кр.
              </div>
            </div>
          )
        })}
        <div style={{ fontSize: 10, color: '#3a5a4a', marginTop: 8 }}>
          🆓 Lite модели (GPT-4o mini, Haiku, Gemini Flash, DeepSeek, Llama, Mistral) — 20 запросов/день бесплатно
        </div>
      </div>

      {/* FAQ */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: 14,
      }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 10 }}>❓ КАК ЭТО РАБОТАЕТ</div>
        {[
          ['💳', 'Пополни на любую сумму', 'Минимум $1, максимума нет — покупаешь сколько нужно'],
          ['♾️', 'Кредиты не сгорают', 'Остаток на балансе хранится бессрочно'],
          ['🆓', 'Lite модели всегда бесплатно', '20 запросов в день без списания кредитов'],
          ['⚡', 'Кредиты списываются мгновенно', 'Только при успешном ответе от AI'],
          ['👑', 'VIP цена от $10,000', 'Суммарный депозит свыше $10,000 — цена $1.12 за кредит навсегда'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c0d8c8' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#5a8a70', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? `rgba(${p.primaryRgb},0.15)` : 'rgba(255,80,80,0.15)',
          border: `1px solid ${toast.ok ? `rgba(${p.primaryRgb},0.3)` : 'rgba(255,80,80,0.3)'}`,
          color: toast.ok ? p.primary : '#ff5050',
          padding: '10px 20px', borderRadius: 12,
          fontSize: 13, fontWeight: 700, zIndex: 1000,
          backdropFilter: 'blur(10px)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
