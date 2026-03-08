/**
 * HomeScreen — Stone AI landing with usage, active model, model grid, quick actions.
 */

import { useStore, type Model } from '../../store/useStore'
import { Card, Tag, Divider, GlowBtn, GlitchTitle } from '../ui'

// Model accent colors
const MODEL_ACCENTS: Record<string, string> = {
  'gpt-4o-mini': '#00ffaa', 'claude-haiku-4.5': '#c084fc',
  'gemini-2.0-flash': '#00e5ff', 'deepseek-r1': '#00ffcc',
  'llama-4-maverick': '#66ffcc', 'mistral-large-25': '#00ff88',
  'gpt-4.1': '#00ffaa', 'claude-opus-4': '#bf5af2',
  'grok-3': '#39ff14', 'gemini-2.5-pro': '#00e5ff',
  'perplexity-sonar-pro': '#aaff00',
}

export function HomeScreen() {
  const { models, modelId, setScreen, user } = useStore()
  const currentModel = models.find(m => m.id === modelId) || models[0]
  const accent = currentModel ? MODEL_ACCENTS[currentModel.id] || '#00ff88' : '#00ff88'

  return (
    <div style={{ padding: '0 18px 90px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 12px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: '#fff' }}>STONE</span>
          <GlitchTitle text="AI" size={28} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50', marginTop: 4 }}>
          6 Lite бесплатно &bull; 5 Premium по подписке
        </div>
      </div>

      {/* Usage card */}
      <Card accent="#00ff88" featured>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50' }}>lite.today</span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#00ff88' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#3a6a50' }}>premium</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#bf5af2' }}>
            {user.plan === 'free' ? 'PLUS / MAX →' : `${user.premiumToday}/${user.premiumLimitDay}`}
          </span>
        </div>
        <GlowBtn onClick={() => setScreen('chat')}>💬 Начать чат</GlowBtn>
      </Card>

      <div style={{ height: 12 }} />

      {/* Active model */}
      {currentModel && (
        <Card accent={accent} onClick={() => setScreen('chat')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 24, width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, background: `${accent}10`, border: `1px solid ${accent}20`,
            }}>{currentModel.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50', textTransform: 'uppercase', marginBottom: 2 }}>active model</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 15, fontWeight: 700, color: '#e0f0e8' }}>{currentModel.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>{currentModel.company} &bull; {currentModel.desc}</div>
            </div>
            <Tag text="online" accent="#00ff88" />
          </div>
        </Card>
      )}

      <div style={{ height: 12 }} />
      <Divider label="all.models" />
      <div style={{ height: 8 }} />

      {/* Model grid 2-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {models.map(md => {
          const mdAccent = MODEL_ACCENTS[md.id] || '#00ff88'
          const isPremium = md.tier === 'premium'
          return (
            <Card key={md.id} accent={mdAccent} onClick={() => isPremium && user.plan === 'free' ? setScreen('plans') : setScreen('chat')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 20,
                  opacity: isPremium ? 0.7 : 1,
                  filter: isPremium ? 'grayscale(0.3)' : 'none',
                }}>{md.icon}</span>
                <div>
                  <span style={{
                    fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700,
                    color: isPremium ? '#5a8a70' : '#e0f0e8',
                  }}>{md.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 8, fontWeight: 700,
                      color: '#050a08',
                      background: isPremium ? '#bf5af2' : '#00ff88',
                      padding: '1px 4px', borderRadius: 3,
                    }}>{isPremium ? 'PRO' : 'FREE'}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50' }}>{md.desc}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div style={{ height: 12 }} />
      <Divider label="quick.actions" />
      <div style={{ height: 8 }} />

      {/* Quick actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Card accent="#aaff00" onClick={() => setScreen('plans')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>💳</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>Premium подписки</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>PLUS 699⭐ &bull; MAX 1999⭐ &bull; Day Pass 79⭐</div>
            </div>
            <Tag text="→" accent="#aaff00" />
          </div>
        </Card>
        <Card accent="#00e5ff" onClick={() => setScreen('profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>💎</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>Подключить кошелёк</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>TON Connect &bull; 4 кошелька</div>
            </div>
            <Tag text="connect →" accent="#00e5ff" />
          </div>
        </Card>
      </div>

      <div style={{ height: 12 }} />

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 0,
        border: '1px solid rgba(0,255,136,0.12)', borderRadius: 12,
        overflow: 'hidden', animation: 'borderGlow 4s ease-in-out infinite',
      }}>
        {[
          { value: user.totalRequests, label: 'requests' },
          { value: user.liteToday, label: 'today' },
          { value: models.length || 11, label: 'models' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', padding: '12px 8px',
            borderRight: i < 2 ? '1px solid rgba(0,255,136,0.08)' : 'none',
            background: 'rgba(0,255,136,0.02)',
          }}>
            <div style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900,
              color: '#00ff88', textShadow: '0 0 12px rgba(0,255,136,0.4)',
            }}>{s.value}</div>
            <div style={{
              fontFamily: 'monospace', fontSize: 9, color: '#3a6a50',
              marginTop: 3, textTransform: 'uppercase',
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 12 }} />

      {/* Channel link */}
      <Card accent="#39ff14" onClick={() => window.open('https://t.me/stoneAIC', '_blank')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 700, color: '#e0f0e8' }}>Stone AI Channel</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a50' }}>AI-разборы, кейсы, инструменты</div>
          </div>
          <Tag text="join →" accent="#39ff14" />
        </div>
      </Card>
    </div>
  )
}
