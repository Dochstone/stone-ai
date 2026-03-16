/**
 * User hook — fetches profile, credits, limits from backend.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { apiGet } from '../api/client'

const FALLBACK_MODELS = [
  // Tier 1: Lite (free)
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', company: 'OpenAI', tier: 'lite' as const, icon: '🤖', desc: 'Быстрый и дешёвый' },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', company: 'Anthropic', tier: 'lite' as const, icon: '🧠', desc: 'Быстрый Claude' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', company: 'Google', tier: 'lite' as const, icon: '💎', desc: 'Скоростной' },
  { id: 'llama-4-maverick', name: 'Llama 4', company: 'Meta', tier: 'lite' as const, icon: '🦙', desc: 'Open-source 400B' },
  { id: 'mistral-large-25', name: 'Mistral Large', company: 'Mistral AI', tier: 'lite' as const, icon: '🌀', desc: 'Европейский' },
  { id: 'gemma-3-27b', name: 'Gemma 3 27B', company: 'Google', tier: 'lite' as const, icon: '💠', desc: 'Компактный и быстрый' },
  { id: 'qwen-3-235b', name: 'Qwen 3 235B', company: 'Alibaba', tier: 'lite' as const, icon: '🐉', desc: 'Китайский флагман' },
  // Tier 2: Premium (mid-range)
  { id: 'deepseek-r1', name: 'DeepSeek R1', company: 'DeepSeek', tier: 'premium' as const, icon: '🌊', desc: 'Reasoning' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', company: 'DeepSeek', tier: 'premium' as const, icon: '🌊', desc: 'Быстрый чат' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', company: 'OpenAI', tier: 'premium' as const, icon: '🤖', desc: 'Сбалансированный' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', company: 'Google', tier: 'premium' as const, icon: '💎', desc: 'Думающий Flash' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', company: 'Anthropic', tier: 'premium' as const, icon: '🧠', desc: 'Лучший в коде' },
  { id: 'grok-3-mini', name: 'Grok 3 mini', company: 'xAI', tier: 'premium' as const, icon: '⚡', desc: 'Компактный Grok' },
  { id: 'phi-4', name: 'Phi 4', company: 'Microsoft', tier: 'premium' as const, icon: '🔬', desc: 'Код и математика' },
  { id: 'qwen-qwq', name: 'QwQ 32B', company: 'Alibaba', tier: 'premium' as const, icon: '🐉', desc: 'Reasoning на китайском' },
  { id: 'command-r', name: 'Command R', company: 'Cohere', tier: 'premium' as const, icon: '🔗', desc: 'RAG и поиск' },
  { id: 'mistral-small', name: 'Mistral Small', company: 'Mistral AI', tier: 'premium' as const, icon: '🌀', desc: 'Лёгкий европейский' },
  // Tier 3: Premium (top)
  { id: 'gpt-4.1', name: 'GPT-4.1', company: 'OpenAI', tier: 'premium' as const, icon: '🤖', desc: 'Flagship 2025' },
  { id: 'claude-opus-4', name: 'Claude Opus 4', company: 'Anthropic', tier: 'premium' as const, icon: '🧠', desc: 'Лучший в коде' },
  { id: 'grok-3', name: 'Grok 3', company: 'xAI', tier: 'premium' as const, icon: '⚡', desc: 'Творческий' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', company: 'Google', tier: 'premium' as const, icon: '🔮', desc: 'Мультимодальный' },
  { id: 'perplexity-sonar-pro', name: 'Perplexity Pro', company: 'Perplexity', tier: 'premium' as const, icon: '🔍', desc: 'Поиск в реальном времени' },
  { id: 'gpt-5.1', name: 'GPT-5.1', company: 'OpenAI', tier: 'premium' as const, icon: '🤖', desc: 'Новейший OpenAI' },
  // Tier 4: Image
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', company: 'Google', tier: 'premium' as const, icon: '🎨', desc: 'Генерация картинок Pro' },
  { id: 'nano-banana', name: 'Nano Banana', company: 'Google', tier: 'premium' as const, icon: '🖼️', desc: 'Генерация картинок' },
]

export function useUser() {
  const { setUser, setLoading, setModels } = useStore()

  useEffect(() => {
    async function init() {
      try {
        const [userData, modelsData] = await Promise.all([
          apiGet<any>('/api/user/me'),
          apiGet<any>('/api/models'),
        ])

        setUser({
          tgId: userData.user.tg_id,
          username: userData.user.username || '',
          firstName: userData.user.first_name || '',
          plan: userData.plan,
          credits: userData.credits ?? 0,
          totalDepositedUsd: userData.total_deposited_usd ?? 0,
          creditCosts: userData.credit_costs ?? {},
          liteToday: userData.usage.lite_today,
          liteLimitDay: userData.limits.lite,
          totalRequests: userData.stats.total_requests,
          hasPass: false,
        })

        setModels(modelsData.models)
      } catch (e) {
        console.error('Failed to init user:', e)
        setUser({
          tgId: 123456789,
          username: 'demo',
          firstName: 'Demo',
          plan: 'credits',
          credits: 0,
          totalDepositedUsd: 0,
          creditCosts: {},
          liteToday: 0,
          liteLimitDay: 10,
          totalRequests: 0,
          hasPass: false,
        })
        setModels(FALLBACK_MODELS)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])
}
