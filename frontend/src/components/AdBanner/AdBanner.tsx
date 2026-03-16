/**
 * AdBanner — displays a banner ad for free-tier users.
 *
 * Fetches active banners from /api/ads?placement=X,
 * tracks views/clicks, and links to advertiser.
 */

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { apiGet, apiPost } from '../../api/client'

interface Ad {
  id: number
  title: string
  description: string | null
  image_url: string | null
  link_url: string
  placement: string
}

interface AdBannerProps {
  placement: 'chat_bottom' | 'home_banner' | 'plans_banner'
}

export function AdBanner({ placement }: AdBannerProps) {
  const { user, palette } = useStore()
  const p = palette
  const [ad, setAd] = useState<Ad | null>(null)
  const [visible, setVisible] = useState(true)

  // Don't show ads to subscribers (STRATEGY: paid = no ads)
  // Backend also filters by tier_target, this is just a client-side optimization
  const shouldShow = user.plan !== 'plus' && user.plan !== 'max'

  useEffect(() => {
    if (!shouldShow) return

    apiGet<{ ads: Ad[] }>(`/api/ads?placement=${placement}`)
      .then(data => {
        if (data.ads.length > 0) {
          setAd(data.ads[0])
          // Track view
          apiPost(`/api/ads/${data.ads[0].id}/view`).catch(() => {})
        }
      })
      .catch(() => {})
  }, [placement, shouldShow])

  const handleClick = useCallback(() => {
    if (!ad) return
    // Track click
    apiPost(`/api/ads/${ad.id}/click`).catch(() => {})
    // Open link
    window.open(ad.link_url, '_blank')
  }, [ad])

  const handleClose = useCallback(() => {
    setVisible(false)
  }, [])

  if (!shouldShow || !ad || !visible) return null

  return (
    <div
      style={{
        position: 'relative',
        margin: '8px 0',
        padding: '10px 14px',
        borderRadius: 12,
        background: `linear-gradient(135deg, rgba(${p.primaryRgb},0.08), rgba(${p.secondaryRgb},0.05))`,
        border: `1px solid rgba(${p.primaryRgb},0.15)`,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={handleClick}
    >
      {/* Close button */}
      <div
        onClick={(e) => { e.stopPropagation(); handleClose() }}
        style={{
          position: 'absolute',
          top: 4,
          right: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          padding: '2px 4px',
        }}
      >
        ✕
      </div>

      {/* Ad label */}
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.5px',
        marginBottom: 4,
        textTransform: 'uppercase',
      }}>
        AD
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt=""
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: p.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {ad.title}
          </div>
          {ad.description && (
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {ad.description}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
