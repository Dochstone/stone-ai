/**
 * RewardedAdButton — "+5 free requests" button.
 *
 * Shows when user has exhausted free daily limit.
 * Triggers Adsgram rewarded video, then calls backend to grant bonus.
 */

import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { useRewardedAd } from '../../hooks/useRewardedAd'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'

export function RewardedAdButton() {
  const { user, setUser, palette } = useStore()
  const { showRewardedAd, rewardedAdLoading } = useRewardedAd()
  const { t } = useTranslation()
  const p = palette
  const [message, setMessage] = useState<string | null>(null)

  // Show only when free limit is close to exhausted and bonus not yet claimed
  const limitReached = user.liteToday >= (user.liteLimitDay - 2)
  const alreadyClaimed = user.liteLimitDay > 10  // if limit > base 10, bonus already claimed

  if (!limitReached && !alreadyClaimed) return null
  if (alreadyClaimed) return null

  const handleClick = async () => {
    haptic('medium')
    setMessage(null)

    const result = await showRewardedAd()

    if (result.status === 'rewarded') {
      setUser({ liteLimitDay: result.newLimit || 15 })
      setMessage(t.rewarded_success)
      setTimeout(() => setMessage(null), 3000)
    } else if (result.status === 'already_claimed') {
      setMessage(t.rewarded_already)
      setTimeout(() => setMessage(null), 3000)
    } else if (result.error) {
      setMessage(result.error)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div style={{ textAlign: 'center', margin: '12px 0' }}>
      <button
        onClick={handleClick}
        disabled={rewardedAdLoading}
        style={{
          padding: '10px 20px',
          borderRadius: 12,
          border: `1px solid rgba(${p.primaryRgb},0.3)`,
          background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.15), rgba(${p.secondaryRgb},0.10))`,
          color: p.primary,
          fontSize: 13,
          fontWeight: 700,
          cursor: rewardedAdLoading ? 'wait' : 'pointer',
          opacity: rewardedAdLoading ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {rewardedAdLoading ? t.rewarded_loading : t.rewarded_button}
      </button>

      {message && (
        <div style={{
          fontSize: 12,
          color: message.includes('✅') || message.includes('+5') ? p.primary : 'rgba(255,255,255,0.5)',
          marginTop: 6,
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
