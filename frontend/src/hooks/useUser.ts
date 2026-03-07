/**
 * User hook — fetches profile, plan, limits from backend.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { apiGet } from '../api/client'

export function useUser() {
  const { user, setUser, setLoading, setModels } = useStore()

  useEffect(() => {
    async function init() {
      try {
        // Fetch user profile
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

        // Fetch models
        const modelsData = await apiGet<any>('/api/models')
        setModels(modelsData.models)
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
