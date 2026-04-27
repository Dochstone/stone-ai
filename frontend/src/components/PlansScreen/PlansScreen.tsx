/**
 * PlansScreen — Subscription plans with premium animated modals.
 *
 * Inspired by: Telegram Premium, Stripe, Linear, Apple, Spotify, ChatGPT Plus.
 * Features: spring animations, shimmer CTA, staggered reveals, breathing gradients,
 * animated gradient borders, glassmorphism, pulse badges, success animations.
 */

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { useTonPayment } from '../../hooks/useTonPayment'
import { haptic } from '../../utils/telegram'
import { apiGet, apiPost } from '../../api/client'

// Keep in sync with backend `USD_TO_RUB` in app/config.py and website lib/constants.ts.
const USD_TO_RUB = 84

const STAR_PRICE_USD = 0.013

/* ═══════════════════════════════════════════
   Injected keyframes — all animations live here
   ═══════════════════════════════════════════ */
const KEYFRAMES = `
@keyframes modalSlideUp {
  0% { transform: translateY(100%); opacity: 0; }
  60% { transform: translateY(-3%); opacity: 1; }
  80% { transform: translateY(1%); }
  100% { transform: translateY(0); }
}
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalSlideDown {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes backdropFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes staggerIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,149,0,0.5); }
  50% { box-shadow: 0 0 0 8px rgba(255,149,0,0); }
}
@keyframes rotateBorder {
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes checkDraw {
  to { stroke-dashoffset: 0; }
}
@keyframes successRing {
  from { stroke-dashoffset: 283; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: 1; }
}
@keyframes confettiFall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
}
@keyframes cardAppear {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 15px rgba(255,149,0,0.15), 0 0 30px rgba(255,149,0,0.05); }
  50% { box-shadow: 0 0 25px rgba(255,149,0,0.25), 0 0 50px rgba(255,149,0,0.1); }
}
@keyframes tagSlideIn {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}
`

/* ═══════════════════════════════════════════
   Plan data
   ═══════════════════════════════════════════ */
const PLANS = [
  {
    id: 'free', name: 'Free', price: '0₽', priceSub: 'навсегда', stars: 0, tier: 'free',
    features: ['6 быстрых моделей', '10 запросов/день + 2 премиум', '2 пробных картинки · 2 пробных видео'],
    color: '#5a8a70', gradient: 'linear-gradient(135deg, #5a8a70, #3d6b55)',
    icon: '🆓',
  },
  {
    id: 'mini', name: 'Start', price: '990₽', priceSub: '/мес', stars: 762, tier: 'mini',
    features: ['20+ моделей', '600 быстрых · 90 премиум /мес', '60 картинок · 13 видео-поинтов', 'GPT-5.1, Claude Sonnet'],
    color: '#007aff', gradient: 'linear-gradient(135deg, #007aff, #5856d6)',
    icon: '⚡',
  },
  {
    id: 'max', name: 'Pro', price: '1 890₽', priceSub: '/мес', stars: 1454, tier: 'max',
    features: ['65+ нейросетей + Opus', '1 500 быстрых · 112 премиум', '28 Opus · 140 картинок · 33 видео-поинта', 'Claude Opus, 3D, аудио'],
    color: '#ff9500', gradient: 'linear-gradient(135deg, #ff9500, #ff6b00)',
    recommended: true,
    icon: '🔥',
  },
  {
    id: 'max-pro', name: 'Elite', price: '3 990₽', priceSub: '/мес', stars: 3069, tier: 'max-pro',
    features: ['65+ нейросетей + API', '4 500 быстрых · 336 премиум', '56 Opus · 280 картинок · 80 видео-поинтов', 'Приоритет, ранний доступ'],
    color: '#ff3b30', gradient: 'linear-gradient(135deg, #ff3b30, #ff2d55)',
    icon: '💎',
  },
]

/* ═══════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════ */
export function PlansScreen() {
  const { user, palette: p } = useStore()
  const { buyWithStars, resetPayment } = usePayment()
  const {
    isWalletConnected, connectWallet,
    buyWithTon, resetTonPayment,
  } = useTonPayment()

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [buying, setBuying] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [closingModal, setClosingModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
  const [tonPrice, setTonPrice] = useState(0)
  const [successAnim, setSuccessAnim] = useState(false)
  const [tappedCard, setTappedCard] = useState<string | null>(null)
  const stylesInjected = useRef(false)

  // Inject keyframes once
  useEffect(() => {
    if (stylesInjected.current) return
    stylesInjected.current = true
    const style = document.createElement('style')
    style.textContent = KEYFRAMES
    document.head.appendChild(style)
  }, [])

  // Fetch TON price when modal opens
  useEffect(() => {
    if (showPayModal && tonPrice === 0) {
      apiGet<{ ton_usd: number }>('/api/payment/ton/price')
        .then(data => setTonPrice(data.ton_usd))
        .catch(() => setTonPrice(3.5))
    }
  }, [showPayModal])

  const usd = selectedPlan
    ? selectedPlan.id === 'mini' ? 4.1 : selectedPlan.id === 'max' ? 9.4 : selectedPlan.id === 'max-pro' ? 21 : 0
    : 0
  const starsNeeded = usd > 0 ? Math.ceil(usd / STAR_PRICE_USD) : 0
  const tonNeeded = usd > 0 && tonPrice > 0 ? +(usd / tonPrice).toFixed(2) : 0

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const closeModal = () => {
    setClosingModal(true)
    setTimeout(() => {
      setShowPayModal(false)
      setClosingModal(false)
    }, 250)
  }

  const openPayModal = (plan: typeof PLANS[0]) => {
    if (plan.id === 'free') return
    haptic('medium')
    setSelectedPlan(plan)
    setShowPayModal(true)
  }

  const handleBuyStars = async () => {
    if (!selectedPlan) return
    haptic('medium')
    setBuying(true)
    try {
      const res = await apiPost<any>('/api/payment/stars/create-subscription', { tier: selectedPlan.tier })
      if (res.invoice_url) window.open(res.invoice_url, '_blank')
    } catch {
      // Fallback to balance top-up
      const result = await buyWithStars(usd)
      if (result.status === 'success') {
        setSuccessAnim(true)
        setTimeout(() => { setSuccessAnim(false); window.location.reload() }, 2000)
      } else if (result.status !== 'cancelled') {
        showToast(result.error || 'Ошибка оплаты', false)
      }
    }
    setBuying(false)
    resetPayment()
  }

  const handleBuyTon = async () => {
    if (!isWalletConnected) { connectWallet(); return }
    haptic('medium')
    setBuying(true)
    const result = await buyWithTon(usd, 0)
    if (result.status === 'success') {
      setSuccessAnim(true)
      setTimeout(() => { setSuccessAnim(false); window.location.reload() }, 2000)
    } else if (result.status !== 'cancelled') {
      showToast(result.error || 'Ошибка оплаты TON', false)
    }
    setBuying(false)
    resetTonPayment()
  }

  const handleBuyCard = async () => {
    haptic('medium')
    setBuying(true)
    try {
      const data = await apiPost<{ payment_url: string }>('/api/payment/platega/create-order', {
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
    closeModal()
    if (method === 'stars') handleBuyStars()
    else if (method === 'ton') handleBuyTon()
    else if (method === 'card') handleBuyCard()
    else if (method === 'crypto') handleBuyCrypto()
  }

  const isCurrent = (planId: string) =>
    planId === 'free'
      ? user.plan === 'free' || user.plan === 'per_token'
      : user.plan === planId

  return (
    <div style={{ padding: '16px 16px 90px', minHeight: '100vh' }}>

      {/* ═══ Header ═══ */}
      <div style={{
        textAlign: 'center', padding: '24px 16px 20px',
        animation: 'staggerIn 0.5s ease both',
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, letterSpacing: -0.5,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 6,
        }}>
          Выберите тариф
        </div>
        <div style={{ fontSize: 13, color: '#5a8a70', fontWeight: 500 }}>
          Подписка от 990₽/мес — все модели без ограничений
        </div>
      </div>

      {/* ═══ Current plan badge ═══ */}
      <div style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid rgba(${p.primaryRgb},0.3)`,
        borderRadius: 16, padding: '14px 16px',
        marginBottom: 20, textAlign: 'center',
        animation: 'cardAppear 0.5s ease both 0.1s',
      }}>
        <div style={{ fontSize: 10, color: '#668877', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>
          ТЕКУЩИЙ ТАРИФ
        </div>
        <div style={{
          fontSize: 28, fontWeight: 900, lineHeight: 1,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {user.plan === 'max-pro' ? 'ELITE' : user.plan === 'max' ? 'PRO' : user.plan === 'mini' ? 'START' : 'FREE'}
        </div>
      </div>

      {/* ═══ Campaign banner — Pro -10% till Apr 30 ═══ */}
      {Date.now() <= new Date('2026-04-30T23:59:59+03:00').getTime() && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,149,0,0.18), rgba(255,107,0,0.10))',
          border: '1px solid rgba(255,149,0,0.4)',
          borderRadius: 16, padding: '14px 16px',
          marginBottom: 20, textAlign: 'center',
          animation: 'cardAppear 0.5s ease both 0.15s',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ff9500', marginBottom: 4 }}>
            🔥 −10% на Pro до 30 апреля
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            <span style={{ textDecoration: 'line-through', color: '#668877', marginRight: 8 }}>1 690₽</span>
            <span>1 500₽/мес</span>
          </div>
          <div style={{ fontSize: 11, color: '#5a8a70', marginTop: 4 }}>
            Скидка применяется автоматически при оплате
          </div>
        </div>
      )}

      {/* ═══ Plan Cards ═══ */}
      {PLANS.map((plan, idx) => {
        const current = isCurrent(plan.id)
        const isRecommended = plan.recommended && !current
        const isTapped = tappedCard === plan.id

        return (
          <div
            key={plan.id}
            onClick={() => {
              if (current) return
              setTappedCard(plan.id)
              setTimeout(() => setTappedCard(null), 200)
              openPayModal(plan)
            }}
            style={{
              position: 'relative',
              background: 'rgba(8,16,12,0.95)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 14,
              cursor: current ? 'default' : 'pointer',
              // Animated gradient border for recommended
              border: isRecommended
                ? 'none'
                : current
                  ? `2px solid ${plan.color}`
                  : `1px solid rgba(${p.primaryRgb},0.12)`,
              // Glow for recommended
              boxShadow: isRecommended
                ? `0 0 20px ${plan.color}20, 0 0 40px ${plan.color}08`
                : 'none',
              animation: `cardAppear 0.5s ease both ${0.15 + idx * 0.08}s${isRecommended ? ', glowPulse 3s ease-in-out infinite' : ''}`,
              // Tap feedback
              transform: isTapped ? 'scale(0.97)' : 'scale(1)',
              transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
          >
            {/* Gradient border overlay for recommended */}
            {isRecommended && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 18, padding: 2,
                background: `linear-gradient(135deg, ${plan.color}, ${plan.color}66, ${plan.color})`,
                backgroundSize: '300% 300%',
                animation: 'gradientShift 4s ease infinite',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }} />
            )}

            {/* Current badge */}
            {current && (
              <div style={{
                position: 'absolute', top: -1, right: 16,
                background: plan.color, color: '#000',
                fontSize: 9, fontWeight: 800, padding: '3px 10px',
                borderRadius: '0 0 8px 8px', letterSpacing: 0.5,
              }}>
                ТЕКУЩИЙ
              </div>
            )}

            {/* Recommended badge */}
            {isRecommended && (
              <div style={{
                position: 'absolute', top: -1, right: 16,
                background: plan.color, color: '#000',
                fontSize: 9, fontWeight: 800, padding: '4px 12px',
                borderRadius: '0 0 8px 8px', letterSpacing: 0.5,
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                ПОПУЛЯРНЫЙ
              </div>
            )}

            {/* Plan header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                fontSize: 28, lineHeight: 1,
                animation: 'float 3s ease-in-out infinite',
                animationDelay: `${idx * 0.3}s`,
              }}>
                {plan.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: plan.color }}>{plan.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#e0f8ec' }}>{plan.price}</span>
                <span style={{ fontSize: 12, color: '#668877', fontWeight: 600 }}>{plan.priceSub}</span>
              </div>
            </div>

            {/* Features with staggered appearance */}
            {plan.features.map((f, fi) => (
              <div
                key={f}
                style={{
                  fontSize: 12, color: '#8aaa98', padding: '4px 0',
                  display: 'flex', alignItems: 'center', gap: 8,
                  animation: `staggerIn 0.4s ease both ${0.3 + idx * 0.08 + fi * 0.05}s`,
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 8, flexShrink: 0,
                  background: `${plan.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: plan.color,
                }}>
                  ✓
                </span>
                {f}
              </div>
            ))}

            {/* CTA */}
            {!current && plan.stars > 0 && (
              <div style={{
                marginTop: 14,
                padding: '12px 0',
                borderRadius: 12,
                textAlign: 'center',
                fontWeight: 700, fontSize: 13,
                color: '#000',
                background: `linear-gradient(90deg, ${plan.color}, ${plan.color}cc, ${plan.color})`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite',
                transition: 'transform 0.15s ease',
              }}>
                Подключить {plan.name}
              </div>
            )}

            {current && (
              <div style={{
                marginTop: 14, padding: '12px 0',
                borderRadius: 12, textAlign: 'center',
                fontWeight: 600, fontSize: 13,
                color: '#668877',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                Ваш текущий план
              </div>
            )}
          </div>
        )
      })}

      {/* ═══ FAQ ═══ */}
      <div style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid rgba(${p.primaryRgb},0.12)`,
        borderRadius: 16, padding: 16, marginTop: 6,
        animation: `cardAppear 0.5s ease both ${0.15 + PLANS.length * 0.08 + 0.1}s`,
      }}>
        <div style={{ fontSize: 11, color: '#668877', fontWeight: 700, marginBottom: 14, letterSpacing: 1.5 }}>
          КАК ЭТО РАБОТАЕТ
        </div>
        {[
          ['⭐', 'Выберите тариф', 'Нажмите на карточку нужного плана'],
          ['💳', 'Выберите способ оплаты', 'Stars, TON, карта РФ или крипто'],
          ['🚀', 'Мгновенный доступ', 'Подписка активируется сразу после оплаты'],
          ['♾️', 'Автопродление', 'Отмена в любой момент'],
        ].map(([icon, title, desc], i) => (
          <div key={title} style={{
            display: 'flex', gap: 12, marginBottom: i < 3 ? 12 : 0,
            animation: `staggerIn 0.4s ease both ${0.5 + i * 0.07}s`,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c0e8d0' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#4a7a5a', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          Payment Modal — Bottom Sheet with spring animation
          ═══════════════════════════════════════════ */}
      {showPayModal && selectedPlan && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: closingModal ? 'backdropFadeOut 0.25s ease forwards' : 'modalFadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'rgba(10,18,14,0.98)',
              borderRadius: '24px 24px 0 0',
              padding: '0 16px 34px',
              position: 'relative', overflow: 'hidden',
              animation: closingModal
                ? 'modalSlideDown 0.25s ease forwards'
                : 'modalSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Breathing gradient background */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(ellipse at 50% 0%, ${selectedPlan.color}15 0%, transparent 70%)`,
              animation: 'breathe 4s ease-in-out infinite',
            }} />

            {/* Top border glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${selectedPlan.color}, transparent)`,
              opacity: 0.6,
            }} />

            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              margin: '12px auto 0',
            }} />

            {/* Modal header */}
            <div style={{ textAlign: 'center', padding: '20px 0 8px', position: 'relative' }}>
              <span style={{
                fontSize: 44, display: 'block', lineHeight: 1,
                animation: 'float 3s ease-in-out infinite',
                marginBottom: 12,
              }}>
                {selectedPlan.icon}
              </span>
              <div style={{
                fontSize: 20, fontWeight: 900, color: '#e0f8ec',
                marginBottom: 4, animation: 'staggerIn 0.4s ease both 0.1s',
              }}>
                {selectedPlan.name}
              </div>
              <div style={{
                fontSize: 26, fontWeight: 900,
                background: `linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}99)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 4,
                animation: 'staggerIn 0.4s ease both 0.15s',
              }}>
                {selectedPlan.price}<span style={{ fontSize: 14 }}>{selectedPlan.priceSub}</span>
              </div>
              <div style={{
                fontSize: 12, color: '#668877',
                animation: 'staggerIn 0.4s ease both 0.2s',
              }}>
                Выберите способ оплаты
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
              {[
                {
                  id: 'stars', icon: '⭐', title: 'Telegram Stars',
                  subtitle: `${starsNeeded.toLocaleString()} Stars`,
                  tag: 'Быстро', tagColor: '#ffcc00',
                },
                {
                  id: 'ton', icon: '💎', title: 'TON кошелёк',
                  subtitle: tonPrice > 0 ? `≈ ${tonNeeded} TON` : 'Нативный перевод',
                  tag: isWalletConnected ? 'Подключён' : 'Подключить',
                  tagColor: isWalletConnected ? '#34C759' : '#bf5af2',
                },
                {
                  id: 'card', icon: '💳', title: 'Карта РФ / СБП',
                  subtitle: `≈ ${Math.round(usd * USD_TO_RUB).toLocaleString()}₽`,
                  tag: 'Platega', tagColor: '#4a90d9',
                },
                {
                  id: 'crypto', icon: '🪙', title: 'Криптовалюта',
                  subtitle: 'USDT · BTC · ETH · SOL',
                  tag: 'Heleket', tagColor: '#f5a623',
                },
              ].map((method, i) => (
                <button
                  key={method.id}
                  onClick={() => handleBuy(method.id)}
                  disabled={buying}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: 14,
                    borderRadius: 14,
                    border: `1px solid rgba(${p.primaryRgb},0.1)`,
                    background: 'rgba(255,255,255,0.03)',
                    cursor: buying ? 'wait' : 'pointer',
                    textAlign: 'left',
                    position: 'relative', overflow: 'hidden',
                    opacity: buying ? 0.6 : 1,
                    animation: `staggerIn 0.4s ease both ${0.2 + i * 0.07}s`,
                    transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease',
                  }}
                  onPointerDown={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onPointerUp={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                  onPointerLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{method.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f8ec' }}>{method.title}</div>
                    <div style={{ fontSize: 11, color: '#668877', marginTop: 2 }}>{method.subtitle}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: method.tagColor,
                    background: `${method.tagColor}15`,
                    padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                    animation: `tagSlideIn 0.3s ease both ${0.35 + i * 0.07}s`,
                  }}>
                    {method.tag}
                  </span>
                </button>
              ))}
            </div>

            {/* Cancel */}
            <button
              onClick={closeModal}
              style={{
                width: '100%', marginTop: 4, padding: 13,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'transparent', color: '#668877',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onPointerDown={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              }}
              onPointerUp={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* ═══ Success animation overlay ═══ */}
      {successAnim && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'modalFadeIn 0.3s ease',
        }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={p.primary} strokeWidth="3"
              strokeDasharray="226" strokeDashoffset="226"
              style={{ animation: 'successRing 0.6s ease forwards 0.1s' }}
            />
            <path
              d="M24 40 L35 51 L56 30" fill="none"
              stroke={p.primary} strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="50" strokeDashoffset="50"
              style={{ animation: 'checkDraw 0.4s ease forwards 0.5s' }}
            />
          </svg>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#e0f8ec',
            marginTop: 20, animation: 'staggerIn 0.4s ease both 0.6s',
          }}>
            Оплата прошла!
          </div>
          <div style={{
            fontSize: 13, color: '#668877', marginTop: 6,
            animation: 'staggerIn 0.4s ease both 0.7s',
          }}>
            Подписка активирована
          </div>
        </div>
      )}

      {/* ═══ Toast ═══ */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%',
          transform: 'translateX(-50%)',
          background: toast.ok ? `rgba(${p.primaryRgb},0.12)` : 'rgba(255,80,80,0.12)',
          border: `1px solid ${toast.ok ? `rgba(${p.primaryRgb},0.25)` : 'rgba(255,80,80,0.25)'}`,
          color: toast.ok ? p.primary : '#ff5050',
          padding: '10px 20px', borderRadius: 14,
          fontSize: 13, fontWeight: 700, zIndex: 1002,
          backdropFilter: 'blur(12px)', whiteSpace: 'nowrap',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: toast.ok
            ? `0 4px 20px rgba(${p.primaryRgb},0.15)`
            : '0 4px 20px rgba(255,80,80,0.15)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
