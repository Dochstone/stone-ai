/**
 * PlansScreen — Tabs (Лимиты / Тарифы), model lists, subscription cards.
 * Uses UI components (Card, Tag, GlowBtn, etc.) + Stars payment integration.
 */

import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useStore } from '../../store/useStore'
import { usePayment } from '../../hooks/usePayment'
import { Card, Tag, Divider, GlowBtn, GlitchTitle } from '../ui'

const MODEL_ACCENTS: Record<string, string> = {
  'gpt-4o-mini': '#00ffaa', 'claude-haiku-4.5': '#c084fc',
  'gemini-2.0-flash': '#00e5ff', 'deepseek-r1': '#00ffcc',
  'llama-4-maverick': '#66ffcc', 'mistral-large-25': '#00ff88',
  'gpt-4.1': '#00ffaa', 'claude-opus-4': '#bf5af2',
  'grok-3': '#39ff14', 'gemini-2.5-pro': '#00e5ff',
  'perplexity-sonar-pro': '#aaff00',
}


type DetailTier = 'plus' | 'max' | null

export function PlansScreen() {
  const { models, user, setScreen } = useStore()
  const { t } = useTranslation()

  const TIER_INFO = {
    plus: {
      title: 'PLUS', icon: '⚡', color: '#aaff00',
      subtitle: t.plans_subtitle,
      stars: 469,
      product_id: 'plus_stars',
      includes: [
        t.plans_f_100prem,
        t.plans_f_unlim_lite,
        t.plans_f_history7,
        t.plans_f_priority,
        t.plans_f_prompts,
      ],
    },
    max: {
      title: 'MAX', icon: '👑', color: '#bf5af2',
      subtitle: t.plans_f_pro_desc,
      stars: 1499,
      product_id: 'max_stars',
      includes: [
        t.plans_f_500prem,
        t.plans_f_50opus,
        t.plans_f_unlim_lite,
        t.plans_f_inf_history,
        t.plans_f_max_priority,
        t.plans_f_api,
      ],
    },
  }

  const PASSES = [
    { id: 'day_pass', name: 'Day Pass', icon: '🎫', stars: 59, tags: ['15 Premium', t.plans_24h], hint: '$0.94' },
    { id: 'week_pass', name: 'Week Pass', icon: '🎟️', stars: 229, tags: ['80 Premium', t.plans_7d], hint: '$3.66' },
    { id: 'single_query', name: t.plans_1_query, icon: '💬', stars: 6, tags: ['1 Premium', t.plans_instant], hint: '$0.10' },
  ]
  const { buyWithStars, paymentLoading, resetPayment } = usePayment()
  const [tab, setTab] = useState<'info' | 'plans'>('info')
  const [planView, setPlanView] = useState<'subs' | 'passes'>('subs')
  const [detailTier, setDetailTier] = useState<DetailTier>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'info' } | null>(null)

  const liteModels = models.filter(m => m.tier === 'lite')
  const premiumModels = models.filter(m => m.tier === 'premium')

  const showToast = (msg: string, type: 'ok' | 'err' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleBuy = async (productId: string, tierName?: string) => {
    // Check if user already has this plan
    if (tierName && user.plan === tierName) {
      showToast(t.plans_toast_already, 'info')
      return
    }
    const result = await buyWithStars(productId)
    switch (result.status) {
      case 'success':
        showToast(t.plans_toast_success, 'ok')
        setTimeout(() => window.location.reload(), 1500)
        break
      case 'cancelled':
        showToast(t.plans_toast_cancelled, 'info')
        break
      case 'failed':
        showToast(result.error || t.plans_toast_error, 'err')
        break
    }
    resetPayment()
  }

  return (
    <div style={{ padding: '0 18px 90px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 100,
          padding: '12px 16px', borderRadius: 12, fontSize: 12, fontWeight: 600,
          textAlign: 'center', animation: 'slideUp 0.3s ease-out',
          background: toast.type === 'ok' ? 'rgba(0,255,136,0.15)' : toast.type === 'err' ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.1)',
          color: toast.type === 'ok' ? '#00ff88' : toast.type === 'err' ? '#ff3b30' : 'rgba(255,255,255,0.8)',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(0,255,136,0.3)' : toast.type === 'err' ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.15)'}`,
          backdropFilter: 'blur(20px)',
        }}>
          {toast.type === 'ok' ? '✅ ' : toast.type === 'err' ? '⚠️ ' : '💡 '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '16px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: '#fff' }}>
            {user.plan === 'free' ? 'FREE' : user.plan.toUpperCase()}
          </span>
          <GlitchTitle text="AI" size={20} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50', marginTop: 2 }}>sys.account()</div>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden',
        border: '1px solid rgba(0,255,136,0.12)', marginBottom: 12,
      }}>
        {[
          { id: 'info' as const, label: t.plans_limits_tab },
          { id: 'plans' as const, label: t.plans_title },
        ].map((t, i) => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setDetailTier(null) }}
            style={{
              flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(0,255,136,0.08)' : 'rgba(5,10,8,0.9)',
              color: tab === t.id ? '#00ff88' : '#3a6a50',
              fontFamily: 'monospace', fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
              borderRight: i === 0 ? '1px solid rgba(0,255,136,0.06)' : 'none',
            }}>{t.label}</button>
        ))}
      </div>

      {/* ── Info tab ── */}
      {tab === 'info' && (
        <>
          <Card accent="#00ff88" featured>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 36 }}>🆓</span>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 6 }}>
                {user.plan === 'free' ? t.plans_free_plan : `${user.plan.toUpperCase()} ${t.plans_plan}`}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#3a6a50', marginTop: 4 }}>
                {user.plan === 'free' ? t.plans_f_lite_models : t.plans_f_all_models}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50' }}>lite.requests.today</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#00ff88' }}>
                {user.liteToday}/{user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,255,136,0.08)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${user.liteLimitDay > 0 ? Math.min((user.liteToday / user.liteLimitDay) * 100, 100) : 0}%`,
                background: 'linear-gradient(90deg, #00ff88, #aaff00)',
                boxShadow: '0 0 10px rgba(0,255,136,0.3)', transition: 'width 0.5s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50' }}>premium.requests</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: user.plan === 'free' ? '#ff6b6b' : '#bf5af2' }}>
                {user.plan === 'free' ? t.plans_need_sub : `${user.premiumToday}/${user.premiumLimitDay}`}
              </span>
            </div>
          </Card>

          <div style={{ height: 10 }} />

          {/* Lite models */}
          <Card accent="#00ff88">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#050a08', background: '#00ff88', padding: '2px 8px', borderRadius: 4 }}>LITE</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.plans_free_daily}</span>
            </div>
            {liteModels.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: i < liteModels.length - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
              }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>{m.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', marginLeft: 6 }}>{m.company}</span>
                </div>
                <Tag text="FREE" accent="#00ff88" />
              </div>
            ))}
          </Card>

          <div style={{ height: 10 }} />

          {/* Premium models */}
          <Card accent="#bf5af2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#050a08', background: '#bf5af2', padding: '2px 8px', borderRadius: 4 }}>PREMIUM</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.plans_sub_required}</span>
            </div>
            {premiumModels.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: i < premiumModels.length - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
              }}>
                <span style={{ fontSize: 18, filter: 'grayscale(0.5)', opacity: 0.7 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#5a8a70' }}>{m.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#1a3a28', marginLeft: 6 }}>{m.company}</span>
                </div>
                <Tag text="🔒" accent="#3a6a50" />
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <GlowBtn onClick={() => setTab('plans')}>{`⚡ ${t.plans_open_premium}`}</GlowBtn>
            </div>
          </Card>
        </>
      )}

      {/* ── Plans tab ── */}
      {tab === 'plans' && (
        <>
          {detailTier ? (
            <>
              {/* Detail view */}
              <button onClick={() => setDetailTier(null)} style={{
                background: 'none', border: 'none', color: '#3a6a50',
                fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', padding: '4px 0 10px',
              }}>{`← ${t.plans_back}`}</button>
              {(() => {
                const info = TIER_INFO[detailTier]
                return (
                  <Card accent={info.color} featured>
                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 44 }}>{info.icon}</span>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 6 }}>
                        {info.title}
                      </div>
                      <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: info.color, marginTop: 4 }}>
                        {info.subtitle}
                      </div>
                    </div>
                    <Divider label={t.plans_whats_included} />
                    <div style={{ height: 8 }} />
                    {info.includes.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
                        borderBottom: i < info.includes.length - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
                      }}>
                        <span style={{ color: info.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#e0f0e8', lineHeight: 1.4 }}>{item}</span>
                      </div>
                    ))}
                    <div style={{ height: 14 }} />
                    <GlowBtn
                      onClick={() => handleBuy(info.product_id, detailTier)}
                      disabled={paymentLoading === info.product_id}
                    >
                      {paymentLoading === info.product_id
                        ? `\u23F3 ${t.plans_loading}`
                        : `\u2B50 ${t.plans_buy_for} ${info.stars}\u2B50/{t.plans_per_month}`}
                    </GlowBtn>
                  </Card>
                )
              })()}
            </>
          ) : (
            <>
              {/* How it works */}
              <Card accent="#00ff88" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#b0d0c0', lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: '#e0f0e8' }}>{t.plans_how_title}</span> {t.plans_how_desc}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#00ff88', textTransform: 'uppercase', marginBottom: 4 }}>{t.plans_lite_free}</div>
                    <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#5a8a70', lineHeight: 1.4 }}>
                      GPT-4o mini, Haiku, Flash, DeepSeek, Llama, Mistral — 20 {t.plans_req_day}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(191,90,242,0.04)', border: '1px solid rgba(191,90,242,0.1)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#bf5af2', textTransform: 'uppercase', marginBottom: 4 }}>{t.plans_sub_required}</div>
                    <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#5a8a70', lineHeight: 1.4 }}>
                      GPT-4.1, Claude Opus 4, Grok 3, Gemini 2.5 Pro, Perplexity
                    </div>
                  </div>
                </div>
              </Card>

              {/* Subs / Passes toggle */}
              <div style={{
                display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden',
                border: '1px solid rgba(0,255,136,0.08)', marginBottom: 10,
              }}>
                {[
                  { id: 'subs' as const, label: t.plans_tab_subs },
                  { id: 'passes' as const, label: t.plans_tab_passes },
                ].map((t, i) => (
                  <button key={t.id} onClick={() => setPlanView(t.id)} style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: planView === t.id ? 'rgba(0,255,136,0.06)' : 'rgba(5,10,8,0.9)',
                    color: planView === t.id ? '#aaff00' : '#3a6a50',
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                    borderRight: i === 0 ? '1px solid rgba(0,255,136,0.06)' : 'none',
                  }}>{t.label}</button>
                ))}
              </div>

              {planView === 'subs' && (
                <>
                  {/* PLUS card */}
                  <Card accent="#aaff00" featured onClick={() => setDetailTier('plus')} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 32 }}>⚡</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#e0f0e8' }}>PLUS</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#aaff00', marginTop: 2 }}>{t.plans_for_active}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: '#aaff00' }}>469⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50' }}>≈ $7.5/{t.plans_per_month}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {[t.plans_f_100prem, '∞ Lite', t.plans_f_priority].map(f => <Tag key={f} text={f} accent="#aaff00" />)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <GlowBtn onClick={(e: any) => { e.stopPropagation(); handleBuy('plus_stars', 'plus') }}
                          disabled={paymentLoading === 'plus_stars'}>
                          {paymentLoading === 'plus_stars' ? '⏳...' : t.plans_buy_btn}
                        </GlowBtn>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setDetailTier('plus') }} style={{
                        background: 'none', border: '1px solid rgba(170,255,0,0.2)', borderRadius: 8,
                        color: '#aaff00', fontSize: 11, padding: '0 12px', cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}>i</button>
                    </div>
                  </Card>

                  {/* MAX card */}
                  <Card accent="#bf5af2" featured onClick={() => setDetailTier('max')} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 32 }}>👑</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#e0f0e8' }}>MAX</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#bf5af2', marginTop: 2 }}>{t.plans_for_pro}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: '#bf5af2' }}>1499⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50' }}>≈ $24/{t.plans_per_month}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {[t.plans_f_500prem, t.plans_opus_day, t.plans_f_api].map(f => <Tag key={f} text={f} accent="#bf5af2" />)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <GlowBtn onClick={(e: any) => { e.stopPropagation(); handleBuy('max_stars', 'max') }}
                          disabled={paymentLoading === 'max_stars'}>
                          {paymentLoading === 'max_stars' ? `\u23F3 ${t.plans_loading}` : t.plans_buy_btn}
                        </GlowBtn>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setDetailTier('max') }} style={{
                        background: 'none', border: '1px solid rgba(191,90,242,0.2)', borderRadius: 8,
                        color: '#bf5af2', fontSize: 11, padding: '0 12px', cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}>i</button>
                    </div>
                  </Card>
                </>
              )}

              {planView === 'passes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PASSES.map(pass => (
                    <Card key={pass.id} accent="#00ffcc">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{pass.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>{pass.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {pass.tags.map(t => <Tag key={t} text={t} accent="#00ffcc" />)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#00ffcc' }}>{pass.stars}⭐</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>{pass.hint}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <GlowBtn
                          onClick={() => handleBuy(pass.id)}
                          disabled={paymentLoading === pass.id}
                        >
                          {paymentLoading === pass.id ? `\u23F3 ${t.plans_loading}` : t.plans_buy_btn}
                        </GlowBtn>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
