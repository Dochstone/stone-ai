/**
 * ChatScreen — Model selector, streaming chat, cost display after each response.
 * Ad banner above input for free users (hidden if balance > 0).
 */
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useStore } from '../../store/useStore'
import { useChat } from '../../hooks/useChat'
import { Tag } from '../ui'
import { renderMarkdown } from '../../utils/markdown'
import { AdBanner } from '../AdBanner/AdBanner'

export function ChatScreen() {
  const { models, modelId, setModelId, messages, isStreaming, user, palette } = useStore()
  const { t } = useTranslation()
  const { sendMessage } = useChat()
  const [input, setInput] = useState('')
  const [showModels, setShowModels] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const p = palette

  const currentModel = models.find(m => m.id === modelId) || models[0]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const handleSend = () => {
    const txt = input.trim()
    if (!txt || isStreaming) return
    setInput('')
    sendMessage(txt)
  }

  // Show ad banner only if user has no balance (STRATEGY: paid = no ads)
  const showAd = user.balanceUsd <= 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat header with model selector */}
      <div style={{
        padding: '10px 16px',
        borderBottom: `1px solid rgba(${p.primaryRgb},0.08)`,
        background: 'rgba(5,10,8,0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 50,
      }}>
        <div
          onClick={() => setShowModels(!showModels)}
          style={{
            fontSize: 18, width: 36, height: 36, borderRadius: 10,
            background: `rgba(${p.primaryRgb},0.08)`,
            border: `1px solid rgba(${p.primaryRgb},0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>{currentModel?.icon}</div>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setShowModels(!showModels)}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>
            {currentModel?.name} ▾
          </div>
          <div style={{ fontSize: 10, color: '#5a8a70', fontFamily: 'monospace' }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: p.primary, display: 'inline-block',
              marginRight: 4, boxShadow: `0 0 6px ${p.primary}`
            }} />
            {currentModel?.company}
          </div>
        </div>
        {/* Balance display in header */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: p.primary,
          background: `rgba(${p.primaryRgb},0.1)`,
          padding: '4px 8px', borderRadius: 6,
        }}>
          ${user.balanceUsd.toFixed(2)}
        </div>
        <Tag
          text={currentModel?.tier === 'premium' ? 'PRO' : 'FREE'}
          accent={currentModel?.tier === 'premium' ? '#bf5af2' : p.primary}
        />
      </div>

      {/* Model selector dropdown */}
      {showModels && (
        <div style={{
          position: 'absolute', top: 100, left: 12, right: 12, zIndex: 200,
          background: '#0a1410', border: `1px solid rgba(${p.primaryRgb},0.12)`,
          borderRadius: 16, padding: 8,
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          maxHeight: 360, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, color: '#5a8a70', padding: '6px 10px', textTransform: 'uppercase', fontFamily: 'monospace' }}>select model</div>
          {models.map(md => {
            const isPremium = md.tier === 'premium'
            return (
              <div
                key={md.id}
                onClick={() => { setModelId(md.id); setShowModels(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px', borderRadius: 10,
                  cursor: 'pointer',
                  background: modelId === md.id ? `rgba(${p.primaryRgb},0.08)` : 'transparent',
                  border: modelId === md.id ? `1px solid rgba(${p.primaryRgb},0.15)` : '1px solid transparent',
                  marginBottom: 2,
                }}>
                <span style={{ fontSize: 18 }}>{md.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>{md.name}</div>
                  <div style={{ fontSize: 10, color: '#5a8a70', fontFamily: 'monospace' }}>{md.company}</div>
                </div>
                {isPremium && md.price_weighted ? (
                  <span style={{ fontSize: 9, color: '#bf5af2', fontWeight: 700 }}>
                    ${md.price_weighted.toFixed(1)}/M
                  </span>
                ) : (
                  <span style={{ fontSize: 9, color: p.primary, fontWeight: 700 }}>FREE</span>
                )}
                {modelId === md.id && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.primary, boxShadow: `0 0 8px ${p.primary}` }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 140px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{currentModel?.icon || '🤖'}</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>
              {currentModel?.name}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a8a70', marginTop: 4 }}>
              {t.chat_type_question}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAssistant = msg.role === 'assistant'
          const isLastAssistant = isAssistant && i === messages.length - 1

          return (
            <div key={i}>
              <div style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 4,
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
                  background: msg.role === 'user'
                    ? `linear-gradient(135deg, rgba(${p.primaryRgb},0.12), rgba(${p.secondaryRgb},0.08))`
                    : 'rgba(8,16,12,0.9)',
                  border: `1px solid ${msg.role === 'user' ? `rgba(${p.primaryRgb},0.25)` : `rgba(${p.primaryRgb},0.08)`}`,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: isAssistant ? 4 : 14,
                }}>
                  {isAssistant ? (
                    <div
                      className="md-content"
                      style={{ fontSize: 13, lineHeight: 1.55, color: '#e0f0e8' }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: '#e0f0e8', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>

              {/* Cost display after assistant response */}
              {isAssistant && msg.content && !isStreaming && isLastAssistant && user.lastRequestCost !== null && user.lastRequestCost > 0 && (
                <div style={{
                  fontSize: 10, color: '#5a8a70', fontFamily: 'monospace',
                  marginBottom: 10, paddingLeft: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{currentModel?.icon}</span>
                  <span>{currentModel?.name}</span>
                  <span>·</span>
                  <span style={{ color: '#bf5af2' }}>${user.lastRequestCost.toFixed(4)}</span>
                  <span>·</span>
                  <span>баланс ${user.balanceUsd.toFixed(2)}</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Typing indicator */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
            <div style={{
              background: 'rgba(8,16,12,0.9)',
              border: `1px solid rgba(${p.primaryRgb},0.08)`,
              borderRadius: 14, padding: '10px 16px',
              display: 'flex', gap: 5,
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: p.primary,
                  animation: `blink 1.2s ease-in-out ${j * 0.2}s infinite`,
                  boxShadow: `0 0 6px ${p.primary}`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'fixed', bottom: 60, left: 0, right: 0,
        padding: '8px 16px 12px',
        background: 'linear-gradient(to top, #050a08 90%, transparent)',
        zIndex: 50, maxWidth: 480, margin: '0 auto',
      }}>
        {/* Ad banner — thin, above input, only for free users with no balance */}
        {showAd && <AdBanner placement="chat_bottom" />}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: `rgba(${p.primaryRgb},0.07)`,
          border: `1px solid rgba(${p.primaryRgb},0.22)`,
          borderRadius: 14, padding: '4px 4px 4px 14px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={t.chat_enter_query}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e0f0e8', fontSize: 13, fontFamily: 'monospace', padding: '8px 0',
            }}
          />
          <button
            onClick={handleSend}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: input.trim() && !isStreaming ? `rgba(${p.primaryRgb},0.2)` : `rgba(${p.primaryRgb},0.06)`,
              cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              fontSize: 16,
              color: input.trim() && !isStreaming ? p.primary : '#3a6a50',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() && !isStreaming ? `0 0 10px rgba(${p.primaryRgb},0.2)` : 'none',
            }}>
            {isStreaming ? '⏳' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
