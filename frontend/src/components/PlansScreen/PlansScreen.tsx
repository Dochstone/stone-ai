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
      <div style={{ textAlign: 'center', padding: '20px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e0f8ec', marginBottom: 8 }}>Выберите тариф</div>
        <div style={{ fontSize: 12, color: '#5a8a70' }}>Подписка от 390₽/мес</div>
      </div>

      {/* Current plan badge */}
      <SolidCard style={{ textAlign: 'center', border: `1px solid rgba(${p.primaryRgb},0.4)` }}>
        <div style={{ fontSize: 11, color: '#668877', marginBottom: 4, fontWeight: 600, letterSpacing: 1 }}>
          ТЕКУЩИЙ ТАРИФ
        </div>
        <div style={{
          fontSize: 32, fontWeight: 900, lineHeight: 1,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {user.plan === 'max-pro' ? 'MAX PRO' : user.plan === 'max' ? 'MAX' : user.plan === 'mini' ? 'MINI' : 'FREE'}
        </div>
      </SolidCard>

      {/* ═══ Plan Cards ═══ */}
      {[
        { id: 'free', name: 'Free', price: '0₽', stars: 0, tier: 'free', features: ['7 моделей', '15 запросов/день', '2 картинки/день'], color: '#5a8a70', current: user.plan === 'free' || user.plan === 'per_token' },
        { id: 'mini', name: 'Mini', price: '390₽/мес', stars: 300, tier: 'mini', features: ['20+ моделей', '500 запросов/мес', '15 картинок, 3 видео', 'GPT-5.1, Claude Sonnet'], color: '#007aff', current: user.plan === 'mini' },
        { id: 'max', name: 'Max', price: '890₽/мес', stars: 685, tier: 'max', features: ['65+ моделей', '2000 запросов/мес', '50 картинок, 10 видео', 'Claude Opus, 3D, аудио'], color: '#ff9500', current: user.plan === 'max' },
        { id: 'max-pro', name: 'Max Pro', price: '1 990₽/мес', stars: 1531, tier: 'max-pro', features: ['65+ моделей + API', '10 000 запросов/мес', '300 картинок, 50 видео', 'Приоритет, ранний доступ'], color: '#ff3b30', current: user.plan === 'max-pro' },
      ].map(plan => (
        <SolidCard
          key={plan.name}
          style={{
            border: plan.current ? `2px solid ${plan.color}` : `1px solid rgba(${p.primaryRgb},0.15)`,
            position: 'relative',
          }}
        >
          {plan.current && (
            <div style={{
              position: 'absolute', top: -1, right: 16,
              background: plan.color, color: '#000',
              fontSize: 9, fontWeight: 800, padding: '3px 10px',
              borderRadius: '0 0 6px 6px',
            }}>
              ТЕКУЩИЙ
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: plan.color }}>{plan.name}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#e0f8ec' }}>{plan.price}</div>
          </div>
          {plan.features.map(f => (
            <div key={f} style={{ fontSize: 12, color: '#8aaa98', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: plan.color, fontSize: 10 }}>✓</span> {f}
            </div>
          ))}
          {!plan.current && plan.stars > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <div
                onClick={async () => {
                  haptic('medium')
                  try {
                    const res = await apiPost('/api/payment/stars/create-subscription', { tier: plan.tier })
                    if (res.invoice_url) window.open(res.invoice_url, '_blank')
                  } catch (e) { alert('Ошибка создания инвойса') }
                }}
                style={{
                  flex: 1, textAlign: 'center', padding: '10px',
                  borderRadius: 10, cursor: 'pointer',
                  background: `${plan.color}25`,
                  border: `1px solid ${plan.color}40`,
                  color: plan.color, fontWeight: 700, fontSize: 13,
                }}
              >
                ⭐ {plan.stars} Stars
              </div>
              <div
                onClick={() => window.open('https://stoneai.ru/pricing', '_blank')}
                style={{
                  flex: 1, textAlign: 'center', padding: '10px',
                  borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8aaa98', fontWeight: 700, fontSize: 13,
                }}
              >
                💎 Крипто
              </div>
            </div>
          )}
        </SolidCard>
      ))}

      {/* ═══ FAQ ═══ */}
      <SolidCard>
        <div style={{ fontSize: 11, color: '#668877', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
          ❓ КАК ЭТО РАБОТАЕТ
        </div>
        {[
          ['⭐', 'Выберите тариф', 'Free, Mini, Max или Max Pro'],
          ['🌐', 'Оплатите на сайте', 'stoneai.ru/pricing — карта, СБП, крипто'],
          ['🆓', 'Free моделей бесплатно', '15 запросов/день к Lite моделям'],
          ['🚀', 'Подписка = все модели', 'Mini и выше — доступ ко всем 50+ моделям'],
          ['♾️', 'Подписка автопродляется', 'Отмена в любой момент на сайте'],
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
