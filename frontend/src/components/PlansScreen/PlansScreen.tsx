/**
 * PlansScreen — Tabs (Лимиты / Тарифы), model lists, subscription cards.
 * NEW PRICES: PLUS 699⭐, MAX 1999⭐, Day Pass 79⭐, Week Pass 299⭐
 */

import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Card, Tag, Divider, GlowBtn, GlitchTitle } from '../ui'

const MODEL_ACCENTS: Record<string, string> = {
  'gpt-4o-mini': '#00ffaa', 'claude-haiku-4.5': '#c084fc',
  'gemini-2.0-flash': '#00e5ff', 'deepseek-r1': '#00ffcc',
  'llama-4-maverick': '#66ffcc', 'mistral-large-25': '#00ff88',
  'gpt-4.1': '#00ffaa', 'claude-opus-4': '#bf5af2',
  'grok-3': '#39ff14', 'gemini-2.5-pro': '#00e5ff',
  'perplexity-sonar-pro': '#aaff00',
}

const TIER_INFO = {
  plus: {
    title: 'PLUS', icon: '⚡', color: '#aaff00',
    subtitle: 'Для активных пользователей',
    includes: [
      '10 запросов к Premium моделям / день',
      'Безлимитные Lite модели',
      'История чатов 30 дней',
      'Приоритет ответа',
      'Системные промпты',
      'Opus НЕ включён (только MAX)',
    ],
  },
  max: {
    title: 'MAX', icon: '👑', color: '#bf5af2',
    subtitle: 'Для профи и бизнеса',
    includes: [
      '30 запросов к Premium моделям / день',
      '5 Claude Opus 4 запросов / день',
      'Безлимитные Lite модели',
      'Бесконечная история + экспорт',
      'Максимальный приоритет',
      'API доступ для интеграций',
    ],
  },
}

type DetailTier = 'plus' | 'max' | null

export function PlansScreen() {
  const { models, user, setScreen } = useStore()
  const [tab, setTab] = useState<'info' | 'plans'>('info')
  const [planView, setPlanView] = useState<'subs' | 'passes'>('subs')
  const [detailTier, setDetailTier] = useState<DetailTier>(null)

  const liteModels = models.filter(m => m.tier === 'lite')
  const premiumModels = models.filter(m => m.tier === 'premium')

  return (
    <div style={{ padding: '0 18px 90px' }}>
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
          { id: 'info' as const, label: '📊 Лимиты' },
          { id: 'plans' as const, label: '💳 Тарифы' },
        ].map((t, i) => (
          <button key={t.id} onClick={() => { setTab(t.id); setDetailTier(null) }} style={{
            flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'rgba(0,255,136,0.08)' : 'rgba(5,10,8,0.9)',
            color: tab === t.id ? '#00ff88' : '#3a6a50',
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            transition: 'all 0.2s',
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
                {user.plan === 'free' ? 'FREE план' : `${user.plan.toUpperCase()} план`}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#3a6a50', marginTop: 4 }}>
                {user.plan === 'free' ? 'Lite модели — 20 запросов/день' : 'Все модели доступны'}
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
                {user.plan === 'free' ? '0 (нужна подписка)' : `${user.premiumToday}/${user.premiumLimitDay}`}
              </span>
            </div>
          </Card>

          <div style={{ height: 10 }} />

          {/* Lite models */}
          <Card accent="#00ff88">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                color: '#050a08', background: '#00ff88', padding: '2px 8px', borderRadius: 4,
              }}>LITE</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                бесплатно &bull; 20 req/день
              </span>
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
              <span style={{
                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                color: '#050a08', background: '#bf5af2', padding: '2px 8px', borderRadius: 4,
              }}>PREMIUM</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                подписка Plus / Max
              </span>
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
              <GlowBtn onClick={() => setTab('plans')}>⚡ Открыть Premium</GlowBtn>
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
              }}>← Назад</button>
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
                    <Divider label="что входит" />
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
                  </Card>
                )
              })()}
            </>
          ) : (
            <>
              {/* How it works */}
              <Card accent="#00ff88" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#b0d0c0', lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: '#e0f0e8' }}>Как это работает?</span> Stone AI делит модели на 2 категории:
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{
                    flex: 1, padding: 8, borderRadius: 8,
                    background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#00ff88', textTransform: 'uppercase', marginBottom: 4 }}>
                      Lite &bull; бесплатно
                    </div>
                    <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#5a8a70', lineHeight: 1.4 }}>
                      GPT-4o mini, Haiku, Flash, DeepSeek, Llama, Mistral — 20 req/день
                    </div>
                  </div>
                  <div style={{
                    flex: 1, padding: 8, borderRadius: 8,
                    background: 'rgba(191,90,242,0.04)', border: '1px solid rgba(191,90,242,0.1)',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#bf5af2', textTransform: 'uppercase', marginBottom: 4 }}>
                      Premium &bull; подписка
                    </div>
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
                  { id: 'subs' as const, label: '📦 Подписки' },
                  { id: 'passes' as const, label: '🎫 Пассы' },
                ].map((t, i) => (
                  <button key={t.id} onClick={() => setPlanView(t.id)} style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: planView === t.id ? 'rgba(0,255,136,0.06)' : 'rgba(5,10,8,0.9)',
                    color: planView === t.id ? '#aaff00' : '#3a6a50',
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                    transition: 'all 0.2s',
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
                        <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#aaff00', marginTop: 2 }}>Для активных пользователей</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: '#aaff00' }}>699⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50' }}>$11.18/мес</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {['10 Premium/день', '∞ Lite', 'Без Opus'].map(f => <Tag key={f} text={f} accent="#aaff00" />)}
                    </div>
                    <GlowBtn onClick={(e) => { e.stopPropagation(); setDetailTier('plus') }}>Подробнее →</GlowBtn>
                  </Card>

                  {/* MAX card */}
                  <Card accent="#bf5af2" featured onClick={() => setDetailTier('max')} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 32 }}>👑</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#e0f0e8' }}>MAX</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#bf5af2', marginTop: 2 }}>Для профи и бизнеса</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 900, color: '#bf5af2' }}>1999⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50' }}>$31.98/мес</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {['30 Premium/день', '5 Opus/день', 'API доступ'].map(f => <Tag key={f} text={f} accent="#bf5af2" />)}
                    </div>
                    <GlowBtn onClick={(e) => { e.stopPropagation(); setDetailTier('max') }}>Подробнее →</GlowBtn>
                  </Card>
                </>
              )}

              {planView === 'passes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Day Pass */}
                  <Card accent="#00ffcc">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>🎫</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>Day Pass</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          <Tag text="15 Premium" accent="#00ffcc" />
                          <Tag text="24 часа" accent="#00ffcc" />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#00ffcc' }}>79⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>$1.26</div>
                      </div>
                    </div>
                  </Card>

                  {/* Week Pass */}
                  <Card accent="#00ffcc">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>🎟️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>Week Pass</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          <Tag text="50 Premium" accent="#00ffcc" />
                          <Tag text="7 дней" accent="#00ffcc" />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#00ffcc' }}>299⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>$4.78</div>
                      </div>
                    </div>
                  </Card>

                  {/* Single query */}
                  <Card accent="#00ffcc">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>💬</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>1 запрос</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          <Tag text="1 Premium" accent="#00ffcc" />
                          <Tag text="мгновенно" accent="#00ffcc" />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: '#00ffcc' }}>9⭐</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>$0.14</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
