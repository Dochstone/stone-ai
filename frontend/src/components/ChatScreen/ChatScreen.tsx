/**
 * ChatScreen — conversation with AI model, streaming responses.
 */

import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { useChat } from '../../hooks/useChat'
import { haptic } from '../../utils/telegram'

export function ChatScreen() {
  const { palette, modelId, models, setScreen } = useStore()
  const { sendMessage, clearMessages, isStreaming, messages } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentModel = models.find((m) => m.id === modelId)
  const p = palette

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
      background: '#0a0a0a',
    }}>
      {/* Chat header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderBottom: `1px solid rgba(${p.primaryRgb},0.1)`,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        <button
          onClick={() => { haptic('light'); setScreen('home') }}
          style={{
            background: 'none',
            border: 'none',
            color: p.primary,
            fontSize: 18,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: 22 }}>{currentModel?.icon || '🤖'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
            {currentModel?.name || modelId}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {currentModel?.company}
            <span style={{
              marginLeft: 6,
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 3,
              background: currentModel?.tier === 'lite' ? 'rgba(0,255,136,0.15)' : 'rgba(191,90,242,0.15)',
              color: currentModel?.tier === 'lite' ? '#00ff88' : '#bf5af2',
            }}>
              {currentModel?.tier === 'lite' ? 'FREE' : 'PRO'}
            </span>
          </div>
        </div>
        <button
          onClick={() => { haptic('light'); clearMessages() }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#888',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          🗑️
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        paddingBottom: '140px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#555',
            marginTop: '30vh',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{currentModel?.icon || '🤖'}</div>
            <div style={{ fontSize: 14 }}>Задай вопрос {currentModel?.name}</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? `rgba(${p.primaryRgb},0.15)`
                : 'rgba(255,255,255,0.06)',
              border: msg.role === 'user'
                ? `1px solid rgba(${p.primaryRgb},0.2)`
                : '1px solid rgba(255,255,255,0.08)',
              color: '#e0e0e0',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.role === 'assistant' && !msg.content && isStreaming && (
                <span style={{ opacity: 0.5 }}>▌</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'fixed',
        bottom: 56,
        left: 0,
        right: 0,
        padding: '8px 12px',
        background: 'rgba(10,10,10,0.95)',
        borderTop: `1px solid rgba(${p.primaryRgb},0.1)`,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '4px 4px 4px 14px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            rows={1}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 14,
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
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: input.trim()
                ? `linear-gradient(135deg, ${p.primary}, ${p.secondary})`
                : 'rgba(255,255,255,0.1)',
              color: '#000',
              fontSize: 16,
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            {isStreaming ? '⏳' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
