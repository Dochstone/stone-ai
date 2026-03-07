/**
 * Bottom navigation bar — 4 tabs.
 */

import { useStore } from '../../store/useStore'
import { haptic } from '../../utils/telegram'

const TABS = [
  { id: 'home' as const, icon: '🏠', label: 'Главная' },
  { id: 'chat' as const, icon: '💬', label: 'Чат' },
  { id: 'plans' as const, icon: '💎', label: 'Тарифы' },
  { id: 'profile' as const, icon: '👤', label: 'Профиль' },
]

export function BottomNav() {
  const { screen, setScreen, palette } = useStore()

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      background: 'rgba(10,10,10,0.95)',
      borderTop: `1px solid rgba(${palette.primaryRgb},0.15)`,
      backdropFilter: 'blur(20px)',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    }}>
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
              color: active ? palette.primary : '#888',
              fontSize: 20,
              padding: '4px 16px',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
          >
            <span>{tab.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 400,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
