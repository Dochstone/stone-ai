/**
 * PlansScreen — Credit packages for premium models.
 * Lite models: free (20/day). Premium: credits per request.
 */

import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { haptic } from '../../utils/telegram'

const CREDIT_PACKAGES = [
  { id: 'credits_100',  credits: 100,  price: 99,   popular: false },
  { id: 'credits_350',  credits: 350,  price: 349,  popular: false },
  { id: 'credits_1000', credits: 1000, price: 990,  popular: true  },
  { id: 'credits_3000', credits: 3000, price: 2490, popular: false },
]

const CREDIT_COSTS: Record<string, number> = {
  'claude-opus-4':        34,
  'gpt-4.1':              15,
  'grok-3':               19,
  'gemini-2.5-pro':       13,
  'perplexity-sonar-pro': 19,
}

const PREMIUM_MODELS = [
  { id: 'claude-opus-4',        name: 'Claude Opus 4',   icon: '🧠', company: 'Anthropic' },
  { id: 'gpt-4.1',              name: 'GPT-4.1',         icon: '🤖', company: 'OpenAI'    },
  { id: 'grok-3',               name: 'Grok 3',          icon: '⚡',  company: 'xAI'       },
  { id: 'gemini-2.5-pro',       name: 'Gemini 2.5 Pro',  icon: '🔮', company: 'Google'    },
  { id: 'perplexity-sonar-pro', name: 'Perplexity Pro',  icon: '🔍', company: 'Perplexity'},
]

export function PlansScreen() {
  const { user, palette: p } = useStore()
  const { buyWithStars, paymentLoading, resetPayment } = usePayment()
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [buying, setBuying] = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBuy = async (pkgId: string) => {
    haptic('medium')
    setBuying(pkgId)
    const result = await buyWithStars(pkgId)
    if (result.status === 'success') {
      showToast('✅ Кредиты зачислены!', true)
      setTimeout(() => window.location.reload(), 1200)
    } else if (result.status === 'cancelled') {
      showToast('Отменено', false)
    } else {
      showToast(result.error || 'Ошибка оплаты', false)
    }
    setBuying(null)
    resetPayment()
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

      {/* Balance card */}
      <div style={{
        background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.12), rgba(${p.secondaryRgb},0.06))`,
        border: `1px solid rgba(${p.primaryRgb},0.25)`,
        borderRadius: 16, padding: 16, marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Твой баланс</div>
        <div style={{
          fontSize: 42, fontWeight: 900,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {user.credits}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>кредитов</div>
      </div>

      {/* Premium model costs */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 14, marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, fontWeight: 700, letterSpacing: 1 }}>
          💎 СТОИМОСТЬ PREMIUM МОДЕЛЕЙ
        </div>
        {PREMIUM_MODELS.map(m => {
          const cost = CREDIT_COSTS[m.id] || 0
          const canAfford = user.credits >= cost
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
                {cost} кр.
              </div>
            </div>
          )
        })}
        <div style={{ fontSize: 10, color: '#3a5a4a', marginTop: 8 }}>
          🆓 Lite модели (GPT-4o mini, Haiku, Gemini Flash, DeepSeek, Llama, Mistral) — 20 запросов/день бесплатно
        </div>
      </div>

      {/* Packages */}
      <div style={{ fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
        ⚡ КУПИТЬ КРЕДИТЫ
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CREDIT_PACKAGES.map(pkg => {
          const pricePerCredit = (pkg.price / pkg.credits).toFixed(2)
          const isBuying = buying === pkg.id
          return (
            <div
              key={pkg.id}
              style={{
                background: pkg.popular
                  ? `linear-gradient(135deg, rgba(${p.primaryRgb},0.1), rgba(${p.secondaryRgb},0.06))`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${pkg.popular ? `rgba(${p.primaryRgb},0.3)` : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                position: 'relative',
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute', top: -8, right: 12,
                  background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
                  color: '#000', fontSize: 9, fontWeight: 900,
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  ВЫГОДНО
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 20, fontWeight: 900,
                  color: pkg.popular ? p.primary : '#e0f0e8',
                }}>
                  {pkg.credits.toLocaleString()} кр.
                </div>
                <div style={{ fontSize: 10, color: '#5a8a70', marginTop: 2 }}>
                  {pricePerCredit}₽ за кредит · ~{Math.floor(pkg.credits / 34)} Opus запросов
                </div>
              </div>

              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={isBuying || paymentLoading}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: pkg.popular
                    ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                    : 'rgba(255,255,255,0.08)',
                  color: pkg.popular ? '#000' : '#e0f0e8',
                  fontWeight: 800, fontSize: 14,
                  cursor: isBuying ? 'default' : 'pointer',
                  opacity: isBuying ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {isBuying ? '⏳' : `${pkg.price} ⭐`}
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div style={{
        marginTop: 20,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: 14,
      }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 8 }}>❓ КАК ЭТО РАБОТАЕТ</div>
        <div style={{ fontSize: 11, color: '#5a8a70', lineHeight: 1.6 }}>
          • Кредиты не сгорают — используй когда удобно{'\n'}
          • Lite модели всегда бесплатно (20 в день){'\n'}
          • Premium списывают кредиты только при успешном ответе{'\n'}
          • Оплата через Telegram Stars
        </div>
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
