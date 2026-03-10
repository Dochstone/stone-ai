/**
 * ChatScreen — conversation with AI model, streaming responses.
 * Premium design with glass effects and smooth animations.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { useChat } from '../../hooks/useChat'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'
import { renderMarkdown } from '../../utils/markdown'

export function ChatScreen() {
  const { palette, modelId, models, setScreen } = useStore()
  const { t } = useTranslation()
  const { sendMessage, clearMessages, isStreaming, messages } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentModel = models.find((m) => m.id === modelId)
  const p = palette
  const isLite = currentModel?.tier === 'lite'

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#050505',
      position: 'relative',
    }}>
      {/* Subtle gradient background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: `radial-gradient(ellipse at 50% 0%, rgba(${p.primaryRgb},0.06) 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Chat header — glass */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px',
        borderBottom: `1px solid rgba(${p.primaryRgb},0.08)`,
        background: 'rgba(5,5,5,0.9)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        position: 'relative',
        zIndex: 10,
      }}>
        <button
          onClick={() => { haptic('light'); setScreen('home') }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: p.primary,
            fontSize: 16,
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>

        <span style={{
          fontSize: 26,
          filter: `drop-shadow(0 0 8px rgba(${p.primaryRgb},0.3))`,
        }}>{currentModel?.icon || '🤖'}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {currentModel?.name || modelId}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {currentModel?.company}
            </span>
            <span style={{
              fontSize: 8,
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 4,
              background: isLite ? 'rgba(0,255,136,0.12)' : 'rgba(191,90,242,0.12)',
              color: isLite ? '#00ff88' : '#bf5af2',
              border: `1px solid ${isLite ? 'rgba(0,255,136,0.2)' : 'rgba(191,90,242,0.2)'}`,
              letterSpacing: '0.5px',
            }}>
              {isLite ? 'FREE' : 'PRO'}
            </span>
          </div>
        </div>

        <button
          onClick={() => { haptic('light'); clearMessages() }}
          style={{
            background: 'rgba(255,59,48,0.08)',
            border: '1px solid rgba(255,59,48,0.15)',
            color: '#ff3b30',
            fontSize: 14,
            padding: '6px 10px',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          🗑
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        paddingBottom: '80px',
        position: 'relative',
        zIndex: 1,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            marginTop: '25vh',
            animation: 'fadeIn 0.8s ease-out',
          }}>
            <div style={{
              fontSize: 56,
              marginBottom: 16,
              filter: `drop-shadow(0 0 20px rgba(${p.primaryRgb},0.3))`,
              animation: 'float 4s ease-in-out infinite',
            }}>
              {currentModel?.icon || '🤖'}
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 6,
            }}>
              {t.chat_ask(currentModel?.name || 'AI')}
            </div>
            <div style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.25)',
            }}>
              {isLite ? t.chat_free_hint : t.chat_premium_hint}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 14,
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {/* AI avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `rgba(${p.primaryRgb},0.1)`,
                border: `1px solid rgba(${p.primaryRgb},0.2)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                marginRight: 8,
                flexShrink: 0,
                marginTop: 2,
              }}>
                {currentModel?.icon || '🤖'}
              </div>
            )}

            <div
              className={msg.role === 'user' ? 'msg-user' : 'msg-assistant'}
              style={{
                maxWidth: '82%',
                padding: '10px 14px',
                color: '#e0e0e0',
                fontSize: 14,
                lineHeight: 1.55,
                wordBreak: 'break-word',
              }}
            >
              {msg.role === 'user' ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              ) : (
                <>
                  <div
                    className="md-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  {!msg.content && isStreaming && (
                    <span style={{ opacity: 0.5, animation: 'typing 1s infinite' }}>▌</span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — glass */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '10px 12px env(safe-area-inset-bottom, 10px)',
        background: 'rgba(5,5,5,0.9)',
        borderTop: `1px solid rgba(${p.primaryRgb},0.08)`,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 22,
          padding: '4px 4px 4px 16px',
          border: `1px solid rgba(${p.primaryRgb},0.08)`,
          transition: 'border-color 0.3s',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat_placeholder}
            rows={1}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              resize: 'none',
              outline: 'none',
              maxHeight: 120,
              lineHeight: 1.4,
              padding: '8px 0',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: 'none',
              background: input.trim()
                ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                : 'rgba(255,255,255,0.06)',
              color: input.trim() ? '#000' : '#555',
              fontSize: 17,
              fontWeight: 700,
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.25s',
              boxShadow: input.trim() ? `0 0 16px rgba(${p.primaryRgb},0.3)` : 'none',
            }}
          >
            {isStreaming ? '⏳' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
