/**
 * Stone AI — Main App component.
 * Routes between screens, initializes Telegram WebApp.
 */

import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useUser } from './hooks/useUser'
import { initTelegramApp } from './utils/telegram'

import { HomeScreen } from './components/HomeScreen/HomeScreen'
import { ChatScreen } from './components/ChatScreen/ChatScreen'
import { PlansScreen } from './components/PlansScreen/PlansScreen'
import { ProfileScreen } from './components/ProfileScreen/ProfileScreen'
import { BottomNav } from './components/ui/BottomNav'

export default function App() {
  const { screen, loading, palette } = useStore()

  // Init Telegram WebApp
  useEffect(() => {
    initTelegramApp()
  }, [])

  // Fetch user data
  useUser()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 16,
      }}>
        <div style={{
          fontSize: 48,
          animation: 'pulse 2s infinite',
        }}>
          🤖
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 24,
          fontWeight: 800,
        }}>
          Stone AI
        </div>
        <div style={{ color: '#555', fontSize: 13 }}>Загрузка...</div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      {/* Dynamic CSS vars for palette */}
      <style>{`
        :root {
          --primary: ${palette.primary};
          --primary-rgb: ${palette.primaryRgb};
          --secondary: ${palette.secondary};
          --secondary-rgb: ${palette.secondaryRgb};
          --accent3: ${palette.accent3};
          --accent3-rgb: ${palette.accent3Rgb};
        }
      `}</style>

      {/* Screens */}
      <div style={{ paddingBottom: screen === 'chat' ? 0 : 56 }}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'chat' && <ChatScreen />}
        {screen === 'plans' && <PlansScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {/* Bottom nav (hide in chat) */}
      <BottomNav />
    </>
  )
}
