/**
 * Chat hook — handles sending messages and streaming responses.
 */

import { useCallback } from 'react'
import { useStore } from '../store/useStore'
import { streamChat } from '../api/client'
import { haptic, hapticNotification } from '../utils/telegram'

export function useChat() {
  const {
    modelId,
    messages,
    addMessage,
    updateLastAssistant,
    clearMessages,
    isStreaming,
    setStreaming,
    user,
    setUser,
  } = useStore()

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || !text.trim()) return

      haptic('medium')

      // Add user message
      addMessage({ role: 'user', content: text })

      // Add empty assistant message (will be filled by streaming)
      addMessage({ role: 'assistant', content: '' })

      setStreaming(true)

      // Build conversation for API
      const apiMessages = [
        ...messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: text },
      ]

      await streamChat(modelId, apiMessages, {
        onToken: (token) => {
          updateLastAssistant(token)
        },
        onDone: (usage) => {
          setStreaming(false)
          hapticNotification('success')

          // Update usage counters locally
          const model = useStore.getState().models.find((m) => m.id === modelId)
          if (model?.tier === 'lite') {
            setUser({ liteToday: user.liteToday + 1, totalRequests: user.totalRequests + 1 })
          } else {
            setUser({ premiumToday: user.premiumToday + 1, totalRequests: user.totalRequests + 1 })
          }
        },
        onError: (error) => {
          setStreaming(false)
          hapticNotification('error')

          // Update last assistant message with error
          const store = useStore.getState()
          const msgs = [...store.messages]
          const last = msgs[msgs.length - 1]
          if (last && last.role === 'assistant' && !last.content) {
            msgs[msgs.length - 1] = { ...last, content: `⚠️ ${error}` }
            useStore.setState({ messages: msgs })
          }
        },
      })
    },
    [modelId, messages, isStreaming]
  )

  return {
    sendMessage,
    clearMessages,
    isStreaming,
    messages,
  }
}
