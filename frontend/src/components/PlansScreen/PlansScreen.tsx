/**
 * PlansScreen — USD balance top-up + per-token model pricing.
 *
 * Shows: balance in $, quick top-up buttons, model price list with
 * per-1M-token weighted price, expandable details (input/output/context),
 * request cost estimator, and FAQ.
 */

import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { useTonPayment } from '../../hooks/useTonPayment'
import { haptic } from '../../utils/telegram'
import { apiGet, apiPost } from '../../api/client'
import { useTranslation } from '../../i18n/useTranslation'

const STAR_PRICE_USD = 0.013
const QUICK_AMOUNTS = [1, 5, 10, 25]
const AVG_TOKENS_PER_REQUEST = 2000

function SolidCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(8,16,12,0.95)',
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 16, padding: 16, marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function PlansScreen() {
  const { user, models, palette: p, setUser } = useStore()
  const { t } = useTranslation()
  const { buyWithStars, paymentLoading, resetPayment } = usePayment()
  const {
    isWalletConnected, connectWallet,
    buyWithTon, tonPaymentStatus, tonPaymentLoading, resetTonPayment,
  } = useTonPayment()

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [amountUsd, setAmountUsd] = useState('')
  const [buying, setBuying] = useState(false)
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [modelFilter, setModelFilter] = useState<'all' | 'lite' | 'premium'>('all')
  const [tonPrice, setTonPrice] = useState(0)
  const [showPayModal, setShowPayModal] = useState(false)
  const [calcModel, setCalcModel] = useState('gpt-4.1')
  const [calcRequests, setCalcRequests] = useState('10')

  useEffect(() => {
    if (showPayModal && tonPrice === 0) {
      apiGet<{ ton_usd: number }>('/api/payment/ton/price')
        .then(data => setTonPrice(data.ton_usd))
        .catch(() => setTonPrice(3.5))
    }
  }, [showPayModal])

  const usd = parseFloat(amountUsd) || 0
  const starsNeeded = usd > 0 ? Math.ceil(usd / STAR_PRICE_USD) : 0
  const tonNeeded = usd > 0 && tonPrice > 0 ? +(usd / tonPrice).toFixed(2) : 0

  // Estimate how many requests the balance covers for popular models
  const estimateRequests = (modelId: string, balance: number) => {
    const price = user.modelPrices[modelId]
    if (!price || price.weighted <= 0) return Infinity
    const costPerReq = price.weighted * AVG_TOKENS_PER_REQUEST / 1_000_000
    return costPerReq > 0 ? Math.floor(balance / costPerReq) : Infinity
  }

  const gptEstimate = estimateRequests('gpt-4.1', user.balanceUsd)
  const opusEstimate = estimateRequests('claude-opus-4', user.balanceUsd)

  // Filter models
  const filteredModels = useMemo(() => {
    let list = models
    if (modelFilter === 'lite') list = models.filter(m => m.tier === 'lite')
    if (modelFilter === 'premium') list = models.filter(m => m.tier === 'premium')
    return list
  }, [models, modelFilter])

  // Calculator
  const calcPrice = user.modelPrices[calcModel]
  const calcCost = calcPrice
    ? (calcPrice.weighted * AVG_TOKENS_PER_REQUEST / 1_000_000) * (parseInt(calcRequests) || 0)
    : 0

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const handleBuyStars = async () => {
    if (usd < 1) return showToast('Минимум $1', false)
    haptic('medium')
    setBuying(true)
    const result = await buyWithStars(usd)
    if (result.status === 'success') {
      showToast('✅ Баланс пополнен!', true)
      setTimeout(() => window.location.reload(), 1200)
    } else if (result.status === 'cancelled') {
      showToast('Отменено', false)
    } else {
      showToast(result.error || 'Ошибка оплаты', false)
    }
    setBuying(false)
    resetPayment()
  }

  const handleBuyTon = async () => {
    if (usd < 1) return showToast('Минимум $1', false)
    if (!isWalletConnected) { connectWallet(); return }
    haptic('medium')
    setBuying(true)
    const result = await buyWithTon(usd, 0)
    if (result.status === 'success') {
      showToast('✅ Баланс пополнен!', true)
      setTimeout(() => window.location.reload(), 1500)
    } else if (result.status === 'cancelled') {
      showToast('Отменено', false)
    } else {
      showToast(result.error || 'Ошибка оплаты TON', false)
    }
    setBuying(false)
    resetTonPayment()
  }

  const handleBuyCard = async () => {
    if (usd < 1) return showToast('Минимум $1', false)
    haptic('medium')
    setBuying(true)
    try {
      const data = await apiPost<{ payment_url: string }>('/api/payment/lava/create-order', {
        usd_amount: usd, credits: 0,
      })
      if (data.payment_url) window.open(data.payment_url, '_blank')
      else showToast('Ошибка создания платежа', false)
    } catch (e: any) {
      showToast(e?.detail || 'Оплата картой временно недоступна', false)
    }
    setBuying(false)
  }

  const handleBuyCrypto = async () => {
    if (usd < 1) return showToast('Минимум $1', false)
    haptic('medium')
    setBuying(true)
    try {
      const data = await apiPost<{ payment_url: string }>('/api/payment/crypto/create-order', {
        usd_amount: usd, credits: 0,
      })
      if (data.payment_url) window.open(data.payment_url, '_blank')
      else showToast('Ошибка создания платежа', false)
    } catch (e: any) {
      showToast(e?.detail || 'Крипто-оплата временно недоступна', false)
    }
    setBuying(false)
  }

  const handleBuy = (method: string) => {
    setShowPayModal(false)
    if (method === 'stars') handleBuyStars()
    else if (method === 'ton') handleBuyTon()
    else if (method === 'card') handleBuyCard()
    else if (method === 'crypto') handleBuyCrypto()
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
          Баланс
        </h1>
        <p style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          Платите за реально использованные токены
        </p>
      </div>

      {/* ═══ Balance Card ═══ */}
      <SolidCard style={{ textAlign: 'center', border: `1px solid rgba(${p.primaryRgb},0.4)` }}>
        <div style={{ fontSize: 11, color: '#668877', marginBottom: 4, fontWeight: 600, letterSpacing: 1 }}>
          ТВОЙ БАЛАНС
        </div>
        <div style={{
          fontSize: 52, fontWeight: 900, lineHeight: 1,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 20px rgba(${p.primaryRgb},0.4))`,
        }}>
          ${user.balanceUsd.toFixed(2)}
        </div>
        {user.balanceUsd > 0 && (
          <div style={{ fontSize: 12, color: '#668877', marginTop: 8 }}>
            ≈ {gptEstimate === Infinity ? '∞' : gptEstimate} зап. GPT-4.1
            {opusEstimate > 0 && opusEstimate !== Infinity && ` · ${opusEstimate} зап. Opus`}
          </div>
        )}
      </SolidCard>

      {/* ═══ Top-up Block ═══ */}
      <SolidCard style={{ border: `1px solid rgba(${p.primaryRgb},0.3)` }}>
        <div style={{ fontSize: 11, color: p.primary, fontWeight: 700, letterSpacing: 1.5, marginBottom: 14 }}>
          ⚡ ПОПОЛНИТЬ БАЛАНС
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {QUICK_AMOUNTS.map(a => {
            const selected = amountUsd === String(a)
            return (
              <button
                key={a}
                onClick={() => { setAmountUsd(String(a)); haptic('light') }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: selected
                    ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                    : 'rgba(255,255,255,0.08)',
                  color: selected ? '#000' : '#cce8d8',
                  fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  boxShadow: selected ? `0 0 16px rgba(${p.primaryRgb},0.5)` : 'none',
                  transform: selected ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s',
                }}
              >
                ${a}
              </button>
            )
          })}
        </div>

        {/* Custom input */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: p.primary, fontSize: 18, fontWeight: 800,
          }}>$</span>
          <input
            type="number" min="1" placeholder="Своя сумма"
            value={amountUsd}
            onChange={e => setAmountUsd(e.target.value)}
            style={{
              width: '100%', padding: '14px 14px 14px 32px', borderRadius: 12,
              border: `1.5px solid rgba(${p.primaryRgb},${usd > 0 ? '0.5' : '0.2'})`,
              background: 'rgba(0,255,136,0.04)', color: '#e0f8ec',
              fontSize: 16, fontWeight: 700, boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>

        {/* Preview */}
        {usd >= 1 && (
          <div style={{
            background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.15), rgba(${p.secondaryRgb},0.08))`,
            border: `1px solid rgba(${p.primaryRgb},0.35)`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: p.primary }}>
              Пополнить ${usd.toFixed(2)} за ⭐ {starsNeeded.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#668877', marginTop: 4 }}>
              ≈ {estimateRequests('gpt-4.1', usd)} зап. GPT-4.1
              {' · '}
              ≈ {estimateRequests('gpt-4o-mini', usd)} зап. GPT-4o mini
            </div>
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={() => {
            if (usd < 1) return showToast('Введи сумму от $1', false)
            haptic('medium')
            setShowPayModal(true)
          }}
          disabled={buying || !!paymentLoading || tonPaymentLoading || usd < 1}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: usd >= 1
              ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
              : 'rgba(255,255,255,0.05)',
            color: usd >= 1 ? '#000' : '#334433',
            fontWeight: 900, fontSize: 17, cursor: usd >= 1 ? 'pointer' : 'default',
            opacity: buying || tonPaymentLoading ? 0.7 : 1,
            boxShadow: usd >= 1 ? `0 4px 24px rgba(${p.primaryRgb},0.5)` : 'none',
            transition: 'all 0.2s',
          }}
        >
          {buying || tonPaymentLoading
            ? (tonPaymentStatus === 'verifying' ? '⏳ Проверяем транзакцию...' : '⏳ Обрабатываем...')
            : usd >= 1
              ? `Пополнить $${usd.toFixed(2)}`
              : 'Введи сумму'}
        </button>
      </SolidCard>

      {/* ═══ Model Prices ═══ */}
      <SolidCard>
        <div style={{ fontSize: 11, color: p.primary, marginBottom: 10, fontWeight: 700, letterSpacing: 1.5 }}>
          💰 СТОИМОСТЬ МОДЕЛЕЙ ($/1M токенов)
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['all', 'lite', 'premium'] as const).map(f => {
            const labels = { all: 'Все', lite: '🆓 Бесплатные', premium: '💎 Платные' }
            const active = modelFilter === f
            return (
              <button
                key={f}
                onClick={() => { setModelFilter(f); haptic('light') }}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none',
                  background: active ? `rgba(${p.primaryRgb},0.2)` : 'rgba(255,255,255,0.05)',
                  color: active ? p.primary : '#668877',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>

        {/* Model list */}
        {filteredModels.map(m => {
          const isExpanded = expandedModel === m.id
          const price = user.modelPrices[m.id] || { weighted: m.price_weighted || 0, input: m.price_input || 0, output: m.price_output || 0 }
          const costPerReq = price.weighted * AVG_TOKENS_PER_REQUEST / 1_000_000
          const canAfford = m.tier === 'lite' || user.balanceUsd >= costPerReq

          return (
            <div
              key={m.id}
              onClick={() => { setExpandedModel(isExpanded ? null : m.id); haptic('light') }}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e0f8ec' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#4a7a5a', marginTop: 1 }}>{m.company}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 800, textAlign: 'right',
                  color: m.tier === 'lite' ? '#00cc66' : canAfford ? p.primary : '#446644',
                }}>
                  {m.tier === 'lite' ? 'FREE' : `$${price.weighted.toFixed(2)}`}
                  <div style={{ fontSize: 9, color: '#4a6a5a', fontWeight: 500 }}>
                    {m.tier === 'lite' ? '10+5/день' : `~$${costPerReq.toFixed(4)}/зап`}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{
                  marginTop: 8, marginLeft: 38,
                  fontSize: 11, color: '#7aaa8a', lineHeight: 1.6,
                  background: `rgba(${p.primaryRgb},0.05)`,
                  border: `1px solid rgba(${p.primaryRgb},0.1)`,
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  <div>{m.desc}</div>
                  {m.tier !== 'lite' && (
                    <>
                      <div style={{ marginTop: 6, fontSize: 10, color: '#556655' }}>
                        Input: ${price.input.toFixed(2)}/M · Output: ${price.output.toFixed(2)}/M
                      </div>
                      <div style={{ fontSize: 10, color: '#556655' }}>
                        Контекст: {m.context_length || '—'} · {m.category || 'chat'}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </SolidCard>

      {/* ═══ Cost Calculator ═══ */}
      <SolidCard>
        <div style={{ fontSize: 11, color: p.primary, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
          🧮 КАЛЬКУЛЯТОР
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input
            type="number" min="1" value={calcRequests}
            onChange={e => setCalcRequests(e.target.value)}
            style={{
              width: 60, padding: '8px 10px', borderRadius: 8,
              border: `1px solid rgba(${p.primaryRgb},0.3)`,
              background: 'rgba(0,255,136,0.04)', color: '#e0f8ec',
              fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none',
            }}
          />
          <span style={{ color: '#668877', fontSize: 12 }}>запросов к</span>
          <select
            value={calcModel}
            onChange={e => setCalcModel(e.target.value)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 8,
              border: `1px solid rgba(${p.primaryRgb},0.3)`,
              background: 'rgba(8,16,12,0.95)', color: '#e0f8ec',
              fontSize: 12, fontWeight: 600, outline: 'none',
            }}
          >
            {models.filter(m => m.tier === 'premium').map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div style={{
          textAlign: 'center', padding: '10px', borderRadius: 10,
          background: `rgba(${p.primaryRgb},0.08)`,
          border: `1px solid rgba(${p.primaryRgb},0.2)`,
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: p.primary }}>
            ${calcCost.toFixed(2)}
          </span>
          <div style={{ fontSize: 10, color: '#668877', marginTop: 2 }}>
            при ~{AVG_TOKENS_PER_REQUEST.toLocaleString()} токенов/запрос
          </div>
        </div>
      </SolidCard>

      {/* ═══ FAQ ═══ */}
      <SolidCard>
        <div style={{ fontSize: 11, color: '#668877', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
          ❓ КАК ЭТО РАБОТАЕТ
        </div>
        {[
          ['💳', 'Пополни баланс от $1', 'Stars, TON, карта, крипто'],
          ['📊', 'Платишь за реальные токены', '~750 слов = 1000 токенов. Стоимость зависит от модели'],
          ['🆓', '5 Lite моделей бесплатно', '10 запросов/день + 5 за рекламу'],
          ['⚡', 'Списание после ответа', 'Ошибка AI — баланс не тратится'],
          ['♾️', 'Баланс не сгорает', 'Остаток хранится бессрочно'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c0e8d0' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#4a7a5a', marginTop: 1 }}>{desc}</div>
            </div>
          </div>
        ))}
      </SolidCard>

      {/* ═══ Payment Method Modal ═══ */}
      {showPayModal && (
        <div
          onClick={() => setShowPayModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'rgba(10,18,14,0.98)',
              border: `1px solid rgba(${p.primaryRgb},0.3)`,
              borderRadius: '24px 24px 0 0',
              padding: '20px 16px 32px',
              animation: 'slideUp 0.25s ease-out',
            }}
          >
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              margin: '0 auto 16px',
            }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#e0f8ec', textAlign: 'center', marginBottom: 6 }}>
              Способ оплаты
            </div>
            <div style={{ fontSize: 12, color: '#668877', textAlign: 'center', marginBottom: 18 }}>
              Пополнить ${usd.toFixed(2)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <PayMethodRow icon="⭐" title="Telegram Stars" subtitle={`${starsNeeded.toLocaleString()} Stars`} tag="Быстро" tagColor={p.primary} palette={p} onClick={() => handleBuy('stars')} />
              <PayMethodRow icon="💎" title="TON кошелёк" subtitle={tonPrice > 0 ? `≈ ${tonNeeded} TON` : 'Нативный перевод'} tag={isWalletConnected ? 'Подключён' : 'Подключить'} tagColor={isWalletConnected ? p.primary : '#bf5af2'} palette={p} onClick={() => handleBuy('ton')} />
              <PayMethodRow icon="💳" title="Карта РФ / СБП" subtitle={`≈ ${Math.round(usd * 95).toLocaleString()}₽`} tag="Рубли" tagColor="#4a90d9" palette={p} onClick={() => handleBuy('card')} />
              <PayMethodRow icon="🪙" title="Криптовалюта" subtitle="USDT · BTC · ETH · SOL и ещё 10+" tag="Heleket" tagColor="#f5a623" palette={p} onClick={() => handleBuy('crypto')} />
            </div>

            <button
              onClick={() => setShowPayModal(false)}
              style={{
                width: '100%', marginTop: 12, padding: '12px',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: '#668877',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? `rgba(${p.primaryRgb},0.15)` : 'rgba(255,80,80,0.15)',
          border: `1px solid ${toast.ok ? `rgba(${p.primaryRgb},0.3)` : 'rgba(255,80,80,0.3)'}`,
          color: toast.ok ? p.primary : '#ff5050',
          padding: '10px 20px', borderRadius: 12,
          fontSize: 13, fontWeight: 700, zIndex: 1000,
          backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* Payment method row */
function PayMethodRow({ icon, title, subtitle, tag, tagColor, palette: p, onClick }: {
  icon: string; title: string; subtitle: string
  tag: string; tagColor: string; palette: any; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '14px',
        borderRadius: 14, border: `1px solid rgba(${p.primaryRgb},0.15)`,
        background: 'rgba(255,255,255,0.03)',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f8ec' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#668877', marginTop: 2 }}>{subtitle}</div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, color: tagColor,
        background: `${tagColor}18`,
        padding: '3px 10px', borderRadius: 8, flexShrink: 0,
      }}>
        {tag}
      </span>
    </button>
  )
}
