/**
 * PlansScreen — Credit top-up with free amount input.
 * Price: $1.10/credit (standard) | $1.00/credit (VIP, total deposits > $10,000)
 * Lite models: free 20/day. Premium: credits per request.
 */

import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { useTonPayment } from '../../hooks/useTonPayment'
import { haptic } from '../../utils/telegram'
import { apiGet } from '../../api/client'

const STAR_PRICE_USD = 0.013
const CREDIT_PRICE_STANDARD = 1.1
const CREDIT_PRICE_VIP = 1.0
const VIP_THRESHOLD_USD = 10000

const PREMIUM_MODELS = [
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    icon: '🧠',
    company: 'Anthropic',
    credits: 34,
    desc: 'Лучший для сложного кода, архитектуры и глубокого анализа. Думает как senior-разработчик.',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    icon: '🤖',
    company: 'OpenAI',
    credits: 15,
    desc: 'Флагман OpenAI 2025. Универсал — справляется с любой задачей быстро и точно.',
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    icon: '⚡',
    company: 'xAI',
    credits: 19,
    desc: 'Прямой, без цензуры. Отлично для творческих задач, копирайтинга и нестандартных запросов.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    icon: '🔮',
    company: 'Google',
    credits: 13,
    desc: 'Понимает текст, картинки, PDF и видео. Идеален для работы с большими документами.',
  },
  {
    id: 'perplexity-sonar-pro',
    name: 'Perplexity Pro',
    icon: '🔍',
    company: 'Perplexity',
    credits: 19,
    desc: 'Ищет в интернете в реальном времени. Актуальные новости, цены, факты — прямо сейчас.',
  },
]

const QUICK_AMOUNTS_USD = [5, 10, 25, 50]

// Card wrapper — dark solid background like FAQ
function SolidCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(8,16,12,0.95)',
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function PlansScreen() {
  const { user, palette: p } = useStore()
  const { buyWithStars, paymentLoading, resetPayment } = usePayment()
  const {
    isWalletConnected, walletAddress, connectWallet, disconnectWallet,
    buyWithTon, tonPaymentStatus, tonPaymentLoading, resetTonPayment,
  } = useTonPayment()
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [amountUsd, setAmountUsd] = useState('')
  const [payMethod, setPayMethod] = useState<'stars' | 'ton' | 'card' | 'crypto'>('stars')
  const [buying, setBuying] = useState(false)
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [tonPrice, setTonPrice] = useState(0)
  const [showPayModal, setShowPayModal] = useState(false)

  // Fetch TON price when modal opens
  useEffect(() => {
    if (showPayModal && tonPrice === 0) {
      apiGet<{ ton_usd: number }>('/api/payment/ton/price')
        .then(data => setTonPrice(data.ton_usd))
        .catch(() => setTonPrice(3.5))
    }
  }, [showPayModal])

  const isVip = (user.totalDepositedUsd ?? 0) >= VIP_THRESHOLD_USD
  const creditPrice = isVip ? CREDIT_PRICE_VIP : CREDIT_PRICE_STANDARD

  const usd = parseFloat(amountUsd) || 0
  const creditsToReceive = usd > 0 ? Math.floor(usd / creditPrice) : 0
  const starsNeeded = usd > 0 ? Math.ceil(usd / STAR_PRICE_USD) : 0
  const tonNeeded = usd > 0 && tonPrice > 0 ? +(usd / tonPrice).toFixed(2) : 0

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
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

  const handleBuyTon = async () => {
    if (usd < 1) return showToast('Минимум $1', false)
    if (!isWalletConnected) {
      connectWallet()
      return
    }
    haptic('medium')
    setBuying(true)
    const result = await buyWithTon(usd, creditsToReceive)
    if (result.status === 'success') {
      showToast(`✅ +${result.creditsAdded} кредитов!`, true)
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
      const data = await apiPost<{ payment_url: string; order_id: string }>('/api/payment/lava/create-order', {
        usd_amount: usd, credits: creditsToReceive,
      })
      if (data.payment_url) {
        window.open(data.payment_url, '_blank')
        showToast('Откроется страница оплаты', true)
      } else {
        showToast('Ошибка создания платежа', false)
      }
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
      const data = await apiPost<{ payment_url: string; order_id: string }>('/api/payment/crypto/create-order', {
        usd_amount: usd, credits: creditsToReceive,
      })
      if (data.payment_url) {
        window.open(data.payment_url, '_blank')
        showToast('Откроется страница оплаты', true)
      } else {
        showToast('Ошибка создания платежа', false)
      }
    } catch (e: any) {
      showToast(e?.detail || 'Крипто-оплата временно недоступна', false)
    }
    setBuying(false)
  }

  const handleBuy = (method: 'stars' | 'ton' | 'card' | 'crypto') => {
    setPayMethod(method)
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
          Кредиты
        </h1>
        <p style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          Lite модели бесплатно · Premium за кредиты
        </p>
      </div>

      {/* Balance */}
      <SolidCard style={{ textAlign: 'center', border: `1px solid rgba(${p.primaryRgb},0.4)` }}>
        {isVip && (
          <div style={{
            display: 'inline-block', marginBottom: 8,
            background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
            color: '#000', fontSize: 10, fontWeight: 900,
            padding: '3px 12px', borderRadius: 8, letterSpacing: 1,
          }}>
            👑 VIP · $1.00 за кредит
          </div>
        )}
        <div style={{ fontSize: 11, color: '#668877', marginBottom: 4, fontWeight: 600, letterSpacing: 1 }}>
          ТВОЙ БАЛАНС
        </div>
        <div style={{
          fontSize: 56, fontWeight: 900, lineHeight: 1,
          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 20px rgba(${p.primaryRgb},0.4))`,
        }}>
          {user.credits.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: '#668877', marginTop: 4 }}>кредитов</div>
      </SolidCard>

      {/* Top-up block */}
      <SolidCard style={{ border: `1px solid rgba(${p.primaryRgb},0.3)` }}>
        <div style={{ fontSize: 11, color: p.primary, fontWeight: 700, letterSpacing: 1.5, marginBottom: 14 }}>
          ⚡ ПОПОЛНИТЬ БАЛАНС
        </div>

        {/* Price per credit */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          background: `rgba(${p.primaryRgb},0.08)`,
          border: `1px solid rgba(${p.primaryRgb},0.2)`,
          borderRadius: 10, padding: '8px 12px',
        }}>
          <span style={{ fontSize: 18 }}>💎</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: p.primary }}>
              1 кредит = ${creditPrice.toFixed(2)}
            </span>
            {!isVip && (
              <span style={{ fontSize: 11, color: '#556655', marginLeft: 8 }}>
                VIP скидка от $10,000
              </span>
            )}
          </div>
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {QUICK_AMOUNTS_USD.map(a => {
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
            type="number"
            min="1"
            placeholder="Своя сумма"
            value={amountUsd}
            onChange={e => setAmountUsd(e.target.value)}
            style={{
              width: '100%', padding: '14px 14px 14px 32px', borderRadius: 12,
              border: `1.5px solid rgba(${p.primaryRgb},${usd > 0 ? '0.5' : '0.2'})`,
              background: 'rgba(0,255,136,0.04)', color: '#e0f8ec',
              fontSize: 16, fontWeight: 700, boxSizing: 'border-box', outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Preview */}
        {creditsToReceive > 0 && (
          <div style={{
            background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.15), rgba(${p.secondaryRgb},0.08))`,
            border: `1px solid rgba(${p.primaryRgb},0.35)`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: `0 0 20px rgba(${p.primaryRgb},0.15)`,
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#668877', fontWeight: 600 }}>Получишь кредитов</div>
              <div style={{ fontSize: 11, color: '#556655', marginTop: 2 }}>
                ~{Math.floor(creditsToReceive / 34)} запросов Claude Opus
              </div>
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: p.primary,
              filter: `drop-shadow(0 0 10px rgba(${p.primaryRgb},0.6))`,
            }}>
              {creditsToReceive.toLocaleString()}
            </div>
          </div>
        )}

        {/* Single Pay button — opens method picker */}
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
            letterSpacing: 0.5,
          }}
        >
          {buying || tonPaymentLoading
            ? (tonPaymentStatus === 'verifying' ? '⏳ Проверяем транзакцию...' : '⏳ Обрабатываем...')
            : creditsToReceive > 0
              ? `Оплатить · ${creditsToReceive.toLocaleString()} кредитов`
              : 'Введи сумму'}
        </button>
      </SolidCard>

      {/* Premium model costs */}
      <SolidCard>
        <div style={{ fontSize: 11, color: p.primary, marginBottom: 14, fontWeight: 700, letterSpacing: 1.5 }}>
          💎 PREMIUM МОДЕЛИ
        </div>
        {PREMIUM_MODELS.map(m => {
          const canAfford = user.credits >= m.credits
          const isExpanded = expandedModel === m.id
          return (
            <div
              key={m.id}
              onClick={() => { setExpandedModel(isExpanded ? null : m.id); haptic('light') }}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, width: 30 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e0f8ec' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#4a7a5a', marginTop: 1 }}>{m.company}</div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 800,
                  color: canAfford ? p.primary : '#446644',
                  background: canAfford ? `rgba(${p.primaryRgb},0.12)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${canAfford ? `rgba(${p.primaryRgb},0.3)` : 'rgba(255,255,255,0.08)'}`,
                  padding: '4px 12px', borderRadius: 8,
                }}>
                  {m.credits} кр.
                </div>
              </div>
              {isExpanded && (
                <div style={{
                  marginTop: 8, marginLeft: 40,
                  fontSize: 12, color: '#7aaa8a', lineHeight: 1.5,
                  background: `rgba(${p.primaryRgb},0.05)`,
                  border: `1px solid rgba(${p.primaryRgb},0.1)`,
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  {m.desc}
                </div>
              )}
            </div>
          )
        })}
        <div style={{ fontSize: 10, color: '#334433', marginTop: 10, lineHeight: 1.5 }}>
          🆓 Lite модели (GPT-4o mini, Haiku, Gemini Flash, DeepSeek, Llama, Mistral) — 20 запросов/день бесплатно
        </div>
      </SolidCard>

      {/* FAQ */}
      <SolidCard>
        <div style={{ fontSize: 11, color: '#668877', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
          ❓ КАК ЭТО РАБОТАЕТ
        </div>
        {[
          ['💳', 'Пополни на любую сумму', 'Минимум $1, максимума нет'],
          ['♾️', 'Кредиты не сгорают', 'Остаток хранится бессрочно'],
          ['🆓', 'Lite модели всегда бесплатно', '20 запросов в день без кредитов'],
          ['⚡', 'Списание только при успехе', 'Ошибка AI — кредиты не тратятся'],
          ['👑', 'VIP цена от $10,000 депозита', '$1.00 за кредит навсегда'],
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
            {/* Handle bar */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              margin: '0 auto 16px',
            }} />

            <div style={{
              fontSize: 15, fontWeight: 800, color: '#e0f8ec',
              textAlign: 'center', marginBottom: 6,
            }}>
              Выбери способ оплаты
            </div>
            <div style={{
              fontSize: 12, color: '#668877', textAlign: 'center', marginBottom: 18,
            }}>
              {creditsToReceive.toLocaleString()} кредитов · ${usd.toFixed(2)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Stars */}
              <PayMethodRow
                icon="⭐" title="Telegram Stars"
                subtitle={`${starsNeeded.toLocaleString()} Stars`}
                tag="Быстро"
                tagColor={p.primary}
                palette={p}
                onClick={() => handleBuy('stars')}
              />
              {/* TON */}
              <PayMethodRow
                icon="💎" title="TON кошелёк"
                subtitle={tonPrice > 0 ? `≈ ${tonNeeded} TON` : 'Нативный перевод'}
                tag={isWalletConnected ? 'Подключён' : 'Подключить'}
                tagColor={isWalletConnected ? p.primary : '#bf5af2'}
                palette={p}
                onClick={() => handleBuy('ton')}
              />
              {/* Card */}
              <PayMethodRow
                icon="💳" title="Карта РФ / СБП"
                subtitle={`≈ ${Math.round(usd * 95).toLocaleString()}₽`}
                tag="Рубли"
                tagColor="#4a90d9"
                palette={p}
                onClick={() => handleBuy('card')}
              />
              {/* Crypto */}
              <PayMethodRow
                icon="🪙" title="Криптовалюта"
                subtitle="USDT · BTC · ETH · SOL и ещё 10+"
                tag="Heleket"
                tagColor="#f5a623"
                palette={p}
                onClick={() => handleBuy('crypto')}
              />
            </div>

            {/* Cancel */}
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
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ═══ Payment Method Row Component ═══ */
function PayMethodRow({ icon, title, subtitle, tag, tagColor, palette: p, onClick }: {
  icon: string; title: string; subtitle: string
  tag: string; tagColor: string; palette: any; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '14px 14px',
        borderRadius: 14, border: `1px solid rgba(${p.primaryRgb},0.15)`,
        background: 'rgba(255,255,255,0.03)',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${p.primaryRgb},0.08)`
        e.currentTarget.style.borderColor = `rgba(${p.primaryRgb},0.35)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = `rgba(${p.primaryRgb},0.15)`
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
