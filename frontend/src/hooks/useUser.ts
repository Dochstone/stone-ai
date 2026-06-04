/**
 * User hook — fetches profile, balance, limits, model prices from backend.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import type { ModelPrice } from '../store/useStore'
import { apiGet } from '../api/client'

const FALLBACK_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', company: 'OpenAI', tier: 'lite' as const, icon: '🤖', desc: 'Быстрый и дешёвый' },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', company: 'Anthropic', tier: 'lite' as const, icon: '🧠', desc: 'Быстрый Claude' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', company: 'Google', tier: 'lite' as const, icon: '💎', desc: 'Скоростной' },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick', company: 'Meta', tier: 'lite' as const, icon: '🦙', desc: 'Open-source 400B' },
  { id: 'mistral-large-25', name: 'Mistral Large', company: 'Mistral', tier: 'lite' as const, icon: '🌀', desc: 'Европейский флагман' },
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

        // Build modelPrices map from backend
        const modelPrices: Record<string, ModelPrice> = {}
        if (userData.model_prices) {
          for (const [id, p] of Object.entries<any>(userData.model_prices)) {
            modelPrices[id] = {
              input: p.input_per_m,
              output: p.output_per_m,
              weighted: p.weighted_per_m,
            }
          }
        }

        const apiBase = import.meta.env.VITE_API_URL || 'https://stone-ai-production.up.railway.app'
        const rawAvatar = userData.user.avatar_url || null
        const avatarUrl = rawAvatar
          ? (rawAvatar.startsWith('http') ? rawAvatar : `${apiBase}${rawAvatar}`)
          : null

        setUser({
          tgId: userData.user.tg_id,
          username: userData.user.username || '',
          firstName: userData.user.first_name || '',
          plan: userData.plan,
          balanceUsd: userData.balance_usd ?? 0,
          totalDepositedUsd: userData.total_deposited_usd ?? 0,
          modelPrices,
          liteToday: userData.usage.lite_today,
          liteLimitDay: userData.limits.lite,
          premiumWeekly: userData.usage.premium_weekly
            ? {
                used: userData.usage.premium_weekly.used,
                limit: userData.usage.premium_weekly.limit,
                available: userData.usage.premium_weekly.available,
                resetAt: userData.usage.premium_weekly.reset_at,
              }
            : null,
          totalRequests: userData.stats.total_requests,
          totalTokens: userData.stats.total_tokens ?? 0,
          lastRequestCost: null,
          lastRequestTokens: null,
          sessionCostUsd: 0,
          hasPass: false,
          avatarUrl,
        })

        setModels(modelsData.models)
      } catch (e) {
        console.error('Failed to init user:', e)
        setUser({
          tgId: 123456789,
          username: 'demo',
          firstName: 'Demo',
          plan: 'per_token',
          balanceUsd: 0,
          totalDepositedUsd: 0,
          modelPrices: {},
          liteToday: 0,
          liteLimitDay: 10,
          totalRequests: 0,
          totalTokens: 0,
          lastRequestCost: null,
          lastRequestTokens: null,
          sessionCostUsd: 0,
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
