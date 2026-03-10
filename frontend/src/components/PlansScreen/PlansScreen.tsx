/**
 * PlansScreen — subscription plans, passes, payment methods.
 * Premium design with animated cards and glow effects.
 * Stars payment is live; TON/USDT coming in Phase 2/3.
 */

import { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'

export function PlansScreen() {
  const { palette, user } = useStore()
  const { buyWithStars, paymentLoading, resetPayment } = usePayment()
  const { t } = useTranslation()
  const p = palette

  // Subscription data — uses translations
  const SUBS: Record<string, any[]> = useMemo(() => ({
    stars: [
      { id: 'plus_stars', name: 'PLUS', icon: '⚡', price: '469', unit: `⭐${t.plans_per_month}`, hint: `100 ${t.plans_premium_day} • ≈ $7.5${t.plans_per_month}`, tier: 'plus', popular: true },
      { id: 'max_stars', name: 'MAX', icon: '👑', price: '1499', unit: `⭐${t.plans_per_month}`, hint: `500 ${t.plans_premium_day} • ≈ $24${t.plans_per_month}`, tier: 'max' },
    ],
    ton: [
      { id: 'plus_ton_1m', name: `PLUS 1 ${t.plans_per_month.replace('/', '')}`, icon: '⚡', price: '6', unit: 'TON', hint: `100 ${t.plans_premium_day}`, tier: 'plus', popular: true },
      { id: 'plus_ton_3m', name: `PLUS 3 ${t.plans_per_month.replace('/', '')}`, icon: '⚡', price: '14.5', unit: 'TON', hint: `−20% ${t.plans_savings}`, tier: 'plus' },
      { id: 'max_ton_1m', name: `MAX 1 ${t.plans_per_month.replace('/', '')}`, icon: '👑', price: '19', unit: 'TON', hint: `500 ${t.plans_premium_day}`, tier: 'max' },
      { id: 'max_ton_3m', name: `MAX 3 ${t.plans_per_month.replace('/', '')}`, icon: '👑', price: '46', unit: 'TON', hint: `−19% ${t.plans_savings}`, tier: 'max' },
    ],
    usdt: [
      { id: 'plus_usdt_1m', name: `PLUS 1 ${t.plans_per_month.replace('/', '')}`, icon: '⚡', price: '7.99', unit: 'USDT', hint: 'TRC-20/TON', tier: 'plus', popular: true },
      { id: 'plus_usdt_3m', name: `PLUS 3 ${t.plans_per_month.replace('/', '')}`, icon: '⚡', price: '18.99', unit: 'USDT', hint: `−21% ${t.plans_savings}`, tier: 'plus' },
      { id: 'max_usdt_1m', name: `MAX 1 ${t.plans_per_month.replace('/', '')}`, icon: '👑', price: '24.99', unit: 'USDT', hint: 'TRC-20/TON', tier: 'max' },
      { id: 'max_usdt_3m', name: `MAX 3 ${t.plans_per_month.replace('/', '')}`, icon: '👑', price: '59.99', unit: 'USDT', hint: `−20% ${t.plans_savings}`, tier: 'max' },
    ],
  }), [t])

  const PASSES: Record<string, any[]> = useMemo(() => ({
    stars: [
      { id: 'day_pass', name: 'Day Pass', icon: '🎫', price: '59', unit: '⭐', hint: `15 Premium • 24 ${t.plans_hours}` },
      { id: 'week_pass', name: 'Week Pass', icon: '🎟️', price: '229', unit: '⭐', hint: `80 Premium • 7 ${t.plans_days}`, popular: true },
      { id: 'single_query', name: t.plans_1_query, icon: '💬', price: '6', unit: '⭐', hint: t.plans_1_premium_query },
    ],
    ton: [
      { id: 'day_pass_ton', name: 'Day Pass', icon: '🎫', price: '0.5', unit: 'TON', hint: `15 Premium • 24 ${t.plans_hours}` },
      { id: 'week_pass_ton', name: 'Week Pass', icon: '🎟️', price: '1.8', unit: 'TON', hint: `80 Premium • 7 ${t.plans_days}`, popular: true },
    ],
    usdt: [
      { id: 'day_pass_usdt', name: 'Day Pass', icon: '🎫', price: '0.99', unit: 'USDT', hint: `15 Premium • 24 ${t.plans_hours}` },
      { id: 'week_pass_usdt', name: 'Week Pass', icon: '🎟️', price: '3.49', unit: 'USDT', hint: `80 Premium • 7 ${t.plans_days}`, popular: true },
    ],
  }), [t])

  const PAY_TABS = useMemo(() => [
    { id: 'stars', label: '⭐ Stars', desc: t.plans_stars_desc },
    { id: 'ton', label: '💎 TON', desc: t.plans_ton_soon },
    { id: 'usdt', label: '💲 USDT', desc: t.plans_usdt_soon },
  ], [t])

  const [view, setView] = useState<'subs' | 'passes'>('subs')
  const [payMethod, setPayMethod] = useState('stars')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  const items = view === 'subs' ? (SUBS[payMethod] || []) : (PASSES[payMethod] || [])

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleBuy = async (item: any) => {
    haptic('medium')

    // TON/USDT not yet available
    if (payMethod !== 'stars') {
      showToast(t.plans_toast_ton_soon, 'info')
      return
    }

    // Check if user already has this plan
    if (item.tier && user.plan === item.tier) {
      showToast(t.plans_toast_already(item.tier.toUpperCase()), 'info')
      return
    }

    const result = await buyWithStars(item.id)

    switch (result.status) {
      case 'success':
        showToast(t.plans_toast_success, 'success')
        setTimeout(() => window.location.reload(), 1500)
        break
      case 'cancelled':
        showToast(t.plans_toast_cancelled, 'info')
        break
      case 'failed':
        showToast(result.error || t.plans_toast_error, 'error')
        break
    }

    resetPayment()
  }

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 100,
          padding: '14px 18px',
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
          animation: 'slideUp 0.3s ease-out',
          background: toast.type === 'success'
            ? 'rgba(0,255,136,0.15)'
            : toast.type === 'error'
              ? 'rgba(255,59,48,0.15)'
              : 'rgba(255,255,255,0.1)',
          color: toast.type === 'success'
            ? '#00ff88'
            : toast.type === 'error'
              ? '#ff3b30'
              : 'rgba(255,255,255,0.8)',
          border: `1px solid ${
            toast.type === 'success'
              ? 'rgba(0,255,136,0.3)'
              : toast.type === 'error'
                ? 'rgba(255,59,48,0.3)'
                : 'rgba(255,255,255,0.15)'
          }`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {toast.type === 'success' ? '✅ ' : toast.type === 'error' ? '⚠️ ' : '💡 '}
          {toast.msg}
        </div>
      )}

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
          {t.plans_title}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
          {t.plans_subtitle}
        </p>
      </div>

      {/* Current plan badge */}
      {user.plan !== 'free' && (
        <div
          className="glass-card-accent"
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            animation: 'fadeIn 0.5s ease-out',
          }}
        >
          <span>{user.plan === 'max' ? '👑' : '⚡'}</span>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {t.plans_active_sub(user.plan.toUpperCase())}
          </span>
        </div>
      )}

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
          💡 {t.plans_how_title}
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
          <b style={{ color: '#fff' }}>Lite</b> {t.plans_how_lite}
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
          <b style={{ color: '#fff' }}>Premium</b> {t.plans_how_premium}
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
            {v === 'subs' ? `📋 ${t.plans_tab_subs}` : `🎫 ${t.plans_tab_passes}`}
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
              opacity: t.id !== 'stars' ? 0.5 : 1,
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
        {items.map((item, i) => {
          const isLoading = paymentLoading === item.id
          return (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: 18,
                position: 'relative',
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
                    {item.tier && (
                      <span style={{
                        fontSize: 8,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: item.tier === 'max' ? 'rgba(191,90,242,0.12)' : 'rgba(170,255,0,0.12)',
                        color: item.tier === 'max' ? '#bf5af2' : '#aaff00',
                      }}>
                        {item.tier.toUpperCase()}
                      </span>
                    )}
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
                disabled={isLoading}
                onClick={() => handleBuy(item)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  fontSize: 14,
                  letterSpacing: '0.5px',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'wait' : 'pointer',
                }}
              >
                {isLoading ? `⏳ ${t.plans_buying}` : t.plans_buy}
              </button>
            </div>
          )
        })}
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
          <b style={{ color: '#aaff00' }}>{t.plans_upsell_title}</b>
          <br /><span style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.plans_upsell_desc}
          </span>
        </div>
      )}
    </div>
  )
}
