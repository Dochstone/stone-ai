/**
 * User hook — fetches profile, credits, limits from backend.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { apiGet } from '../api/client'

const FALLBACK_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', company: 'OpenAI', tier: 'lite' as const, icon: '🤖', desc: 'Быстрый и дешёвый' },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', company: 'Anthropic', tier: 'lite' as const, icon: '🧠', desc: 'Хороший код' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', company: 'Google', tier: 'lite' as const, icon: '💎', desc: 'Быстрый поиск информации' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', company: 'DeepSeek', tier: 'lite' as const, icon: '🌊', desc: 'Задай задачу — решу' },
  { id: 'llama-4-maverick', name: 'Llama 4', company: 'Meta', tier: 'lite' as const, icon: '🦙', desc: 'Без ограничений' },
  { id: 'mistral-large-25', name: 'Mistral Large', company: 'Mistral AI', tier: 'lite' as const, icon: '🌀', desc: 'Точно и чисто' },
  { id: 'gpt-4.1', name: 'GPT-4.1', company: 'OpenAI', tier: 'premium' as const, icon: '🤖', desc: 'Флагман 2025' },
  { id: 'claude-opus-4', name: 'Claude Opus 4', company: 'Anthropic', tier: 'premium' as const, icon: '🧠', desc: 'Лучший в коде' },
  { id: 'grok-3', name: 'Grok 3', company: 'xAI', tier: 'premium' as const, icon: '⚡', desc: 'Творческий' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', company: 'Google', tier: 'premium' as const, icon: '🔮', desc: 'Мультимодальный' },
  { id: 'perplexity-sonar-pro', name: 'Perplexity Pro', company: 'Perplexity', tier: 'premium' as const, icon: '🔍', desc: 'Поиск в реальном времени' },
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
          username: 'art_stone',
          firstName: 'Art',
          plan: 'credits',
          credits: 0,
          creditCosts: {
            'gpt-4.1': 15,
            'claude-opus-4': 34,
            'grok-3': 19,
            'gemini-2.5-pro': 13,
            'perplexity-sonar-pro': 19,
          },
          liteToday: 0,
          liteLimitDay: 20,
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
