/**
 * Bottom navigation bar — 4 tabs with active indicator.
 * Premium design with glass blur and glow indicator.
 */

import { useStore } from '../../store/useStore'
import { haptic } from '../../utils/telegram'
import { useTranslation } from '../../i18n/useTranslation'


export function BottomNav() {
  const { screen, setScreen, palette } = useStore()
  const { t } = useTranslation()
  const TABS = [
    { id: 'home' as const, label: t.nav_home, icon: '🏠' },
    { id: 'chat' as const, label: t.nav_chat, icon: '💬' },
    { id: 'plans' as const, label: t.nav_plans, icon: '⭐' },
    { id: 'profile' as const, label: t.nav_profile, icon: '👤' },
  ]
  const p = palette

  // Hide in chat mode
  if (screen === 'chat') return null

  const activeIndex = TABS.findIndex(t => t.id === screen)

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '6px 0 env(safe-area-inset-bottom, 6px)',
      background: 'rgba(5,5,5,0.92)',
      borderTop: `1px solid rgba(${p.primaryRgb},0.08)`,
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    }}>
      {/* Active indicator line */}
      <div style={{
        position: 'absolute',
        top: -1,
        left: `${(activeIndex / TABS.length) * 100 + 100 / TABS.length / 2 - 4}%`,
        width: '8%',
        height: 2,
        background: p.primary,
        borderRadius: '0 0 4px 4px',
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: `0 0 12px ${p.primary}, 0 0 4px ${p.primary}`,
      }} />

      {TABS.map((tab) => {
        const active = screen === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => { haptic('light'); setScreen(tab.id) }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              color: active ? p.primary : 'rgba(255,255,255,0.3)',
              fontSize: 22,
              padding: '6px 16px',
              cursor: 'pointer',
              transition: 'all 0.25s',
              transform: active ? 'scale(1.05)' : 'scale(1)',
              filter: active ? `drop-shadow(0 0 6px ${p.primary}40)` : 'none',
            }}
          >
            <span>{tab.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 400,
              letterSpacing: active ? '0.3px' : '0',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
