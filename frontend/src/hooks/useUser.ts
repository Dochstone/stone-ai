/**
 * User hook — fetches profile, plan, limits from backend.
 * Includes fallback models for offline/dev mode.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { apiGet } from '../api/client'

// Fallback models when API is unavailable
const FALLBACK_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', company: 'OpenAI', tier: 'lite' as const, icon: '🤖', desc: 'Быстрый и дешёвый' },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', company: 'Anthropic', tier: 'lite' as const, icon: '🧠', desc: 'Быстрый Claude' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', company: 'Google', tier: 'lite' as const, icon: '💎', desc: 'Скоростной' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', company: 'DeepSeek', tier: 'lite' as const, icon: '🌊', desc: 'Reasoning' },
  { id: 'llama-4-maverick', name: 'Llama 4', company: 'Meta', tier: 'lite' as const, icon: '🦙', desc: 'Open-source 400B' },
  { id: 'mistral-large-25', name: 'Mistral Large', company: 'Mistral AI', tier: 'lite' as const, icon: '🌀', desc: 'Европейский' },
  { id: 'gpt-4.1', name: 'GPT-4.1', company: 'OpenAI', tier: 'premium' as const, icon: '🤖', desc: 'Flagship 2025' },
  { id: 'claude-opus-4', name: 'Claude Opus 4', company: 'Anthropic', tier: 'premium' as const, icon: '🧠', desc: 'Лучший в коде' },
  { id: 'grok-3', name: 'Grok 3', company: 'xAI', tier: 'premium' as const, icon: '⚡', desc: 'Творческий' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', company: 'Google', tier: 'premium' as const, icon: '🔮', desc: 'Мультимодальный' },
  { id: 'perplexity-sonar-pro', name: 'Perplexity Pro', company: 'Perplexity', tier: 'premium' as const, icon: '🔍', desc: 'Поиск в реальном времени' },
]

export function useUser() {
  const { user, setUser, setLoading, setModels } = useStore()

  useEffect(() => {
    async function init() {
      try {
        // Fetch user profile and models in parallel
        const [userData, modelsData] = await Promise.all([
          apiGet<any>('/api/user/me'),
          apiGet<any>('/api/models'),
        ])

        setUser({
          tgId: userData.user.tg_id,
          username: userData.user.username || '',
          firstName: userData.user.first_name || '',
          plan: userData.plan,
          liteToday: userData.usage.lite_today,
          premiumToday: userData.usage.premium_today,
          liteLimitDay: userData.limits.lite,
          premiumLimitDay: userData.limits.premium,
          totalRequests: userData.stats.total_requests,
          hasPass: !!userData.pass,
        })

        setModels(modelsData.models)
      } catch (e) {
        console.error('Failed to init user:', e)
        // Use defaults in dev/offline mode
        setUser({
          tgId: 123456789,
          username: 'art_stone',
          firstName: 'Art',
          plan: 'free',
          liteToday: 0,
          premiumToday: 0,
          liteLimitDay: 20,
          premiumLimitDay: 0,
        })
        // Always load models so UI shows the grid
        setModels(FALLBACK_MODELS)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return { user }
}
