/**
 * User hook — fetches profile, plan, limits from backend.
 * Models are loaded independently so they work even without auth.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { apiGet } from '../api/client'

export function useUser() {
  const { user, setUser, setLoading, setModels } = useStore()

  useEffect(() => {
    async function init() {
      // 1) Always load models (no auth required)
      try {
        const modelsData = await apiGet<any>('/api/models')
        setModels(modelsData.models)
      } catch (e) {
        console.error('Failed to load models:', e)
      }

      // 2) Try to load user profile (requires Telegram auth)
      try {
        const data = await apiGet<any>('/api/user/me')
        setUser({
          tgId: data.user.tg_id,
          username: data.user.username || '',
          firstName: data.user.first_name || '',
          plan: data.plan,
          liteToday: data.usage.lite_today,
          premiumToday: data.usage.premium_today,
          liteLimitDay: data.limits.lite,
          premiumLimitDay: data.limits.premium,
          totalRequests: data.stats.total_requests,
          hasPass: !!data.pass,
        })
      } catch (e) {
        console.error('Failed to init user:', e)
        // Use defaults in dev mode
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
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return { user }
}
