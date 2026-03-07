/**
 * API client for Stone AI backend.
 * Handles auth headers, SSE streaming, and error handling.
 */

import { getInitData } from '../utils/telegram'

const API_BASE = import.meta.env.VITE_API_URL || ''

function getHeaders(): Record<string, string> {
  const initData = getInitData()
  return {
    'Content-Type': 'application/json',
    ...(initData ? { Authorization: `tma ${initData}` } : {}),
  }
}

// ─── Regular API calls ───

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, error.detail || error)
  }
  return res.json()
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, error.detail || error)
  }
  return res.json()
}

// ─── SSE Streaming for chat ───

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (usage?: { tokens_in: number; tokens_out: number }) => void
  onError: (error: string) => void
}

export async function streamChat(
  modelId: string,
  messages: { role: string; content: string }[],
  callbacks: StreamCallbacks,
  systemPrompt?: string,
) {
  const initData = getInitData()

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(initData ? { Authorization: `tma ${initData}` } : {}),
      },
      body: JSON.stringify({
        model_id: modelId,
        messages,
        system_prompt: systemPrompt || null,
      }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      callbacks.onError(
        typeof error.detail === 'string'
          ? error.detail
          : error.detail?.error || `Ошибка ${res.status}`
      )
      return
    }

    const reader = res.body?.getReader()
    if (!reader) {
      callbacks.onError('Streaming не поддерживается')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let usage: { tokens_in: number; tokens_out: number } | undefined

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()

        if (data === '[DONE]') {
          callbacks.onDone(usage)
          return
        }

        try {
          const parsed = JSON.parse(data)

          if (parsed.content) {
            callbacks.onToken(parsed.content)
          }

          if (parsed.usage) {
            usage = parsed.usage
          }

          if (parsed.error) {
            callbacks.onError(parsed.error)
            return
          }
        } catch {}
      }
    }

    callbacks.onDone(usage)
  } catch (e: any) {
    callbacks.onError(e.message || 'Ошибка соединения')
  }
}

// ─── Error class ───

export class ApiError extends Error {
  status: number
  detail: any

  constructor(status: number, detail: any) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail))
    this.status = status
    this.detail = detail
  }
}
