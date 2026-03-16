/**
 * Rewarded ad hook — Adsgram integration for +5 free requests.
 *
 * Flow:
 *   1. User clicks "+5 requests" button
 *   2. Adsgram rewarded video loads and plays
 *   3. On reward callback → POST /api/payment/rewarded-ad-complete
 *   4. Backend grants +5 daily requests
 *
 * Adsgram SDK is loaded via <script> in index.html.
 * Docs: https://docs.adsgram.ai
 */

import { useState, useCallback, useRef } from 'react'
import { apiPost } from '../api/client'
import { hapticNotification } from '../utils/telegram'

// Adsgram block ID from env (set in .env or Vercel)
const ADSGRAM_BLOCK_ID = import.meta.env.VITE_ADSGRAM_BLOCK_ID || ''

export type RewardedAdStatus = 'idle' | 'loading' | 'showing' | 'rewarded' | 'error' | 'already_claimed'

interface RewardedAdResult {
  status: RewardedAdStatus
  bonus?: number
  newLimit?: number
  error?: string
}

// Adsgram global type
declare global {
  interface Window {
    Adsgram?: {
      init(params: { blockId: string; debug?: boolean }): AdsgramController
    }
  }
}

interface AdsgramController {
  show(): Promise<{ done: boolean; description: string; state: string; error: boolean }>
  destroy(): void
}

export function useRewardedAd() {
  const [status, setStatus] = useState<RewardedAdStatus>('idle')
  const [loading, setLoading] = useState(false)
  const controllerRef = useRef<AdsgramController | null>(null)

  const isAvailable = !!ADSGRAM_BLOCK_ID && !!window.Adsgram

  const showRewardedAd = useCallback(async (): Promise<RewardedAdResult> => {
    // Check if Adsgram is available
    if (!window.Adsgram || !ADSGRAM_BLOCK_ID) {
      // Fallback: directly call backend (for dev/testing without Adsgram)
      return claimReward()
    }

    setStatus('loading')
    setLoading(true)

    try {
      // Init Adsgram controller
      const controller = window.Adsgram.init({
        blockId: ADSGRAM_BLOCK_ID,
        debug: import.meta.env.DEV,
      })
      controllerRef.current = controller

      setStatus('showing')

      // Show rewarded ad
      const result = await controller.show()

      if (result.done && !result.error) {
        // Ad watched successfully — claim reward from backend
        return await claimReward()
      } else {
        setStatus('error')
        setLoading(false)
        return { status: 'error', error: result.description || 'Реклама не загрузилась' }
      }
    } catch (e: any) {
      setStatus('error')
      setLoading(false)

      // User closed the ad
      if (e?.description?.includes('close') || e?.description?.includes('cancel')) {
        return { status: 'error', error: 'Реклама закрыта' }
      }

      return { status: 'error', error: e?.message || 'Ошибка загрузки рекламы' }
    } finally {
      // Cleanup
      if (controllerRef.current) {
        try { controllerRef.current.destroy() } catch {}
        controllerRef.current = null
      }
    }
  }, [])

  const claimReward = useCallback(async (): Promise<RewardedAdResult> => {
    try {
      const resp = await apiPost<{ bonus: number; new_limit: number; used_today: number }>(
        '/api/payment/rewarded-ad-complete'
      )
      setStatus('rewarded')
      setLoading(false)
      hapticNotification('success')
      return {
        status: 'rewarded',
        bonus: resp.bonus,
        newLimit: resp.new_limit,
      }
    } catch (e: any) {
      const detail = e?.detail || e?.message || ''
      if (typeof detail === 'string' && detail.includes('уже получен')) {
        setStatus('already_claimed')
        setLoading(false)
        return { status: 'already_claimed', error: detail }
      }
      setStatus('error')
      setLoading(false)
      return { status: 'error', error: detail || 'Ошибка получения бонуса' }
    }
  }, [])

  const resetAd = useCallback(() => {
    setStatus('idle')
    setLoading(false)
  }, [])

  return {
    showRewardedAd,
    rewardedAdStatus: status,
    rewardedAdLoading: loading,
    isRewardedAdAvailable: isAvailable,
    resetAd,
  }
}
