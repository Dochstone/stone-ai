/**
 * Stone AI — Main App component.
 * Routes between screens, initializes Telegram WebApp.
 * Premium design with animated background.
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
        background: '#050505',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${palette.primaryRgb},0.1) 0%, transparent 70%)`,
          animation: 'pulse 3s ease-in-out infinite',
        }} />

        <div style={{
          fontSize: 56,
          animation: 'float 3s ease-in-out infinite',
          filter: `drop-shadow(0 0 30px rgba(${palette.primaryRgb},0.5))`,
          zIndex: 1,
        }}>
          🤖
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary}, ${palette.accent3})`,
          backgroundSize: '200% 200%',
          animation: 'gradientMove 3s ease infinite',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: '-0.5px',
          zIndex: 1,
        }}>
          Stone AI
        </div>

        <div style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
          zIndex: 1,
          fontWeight: 500,
        }}>
          Загрузка...
        </div>

        {/* Loading bar */}
        <div style={{
          width: 120,
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 1,
          marginTop: 4,
        }}>
          <div style={{
            height: '100%',
            width: '40%',
            background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})`,
            borderRadius: 2,
            animation: 'shimmer 1.5s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }} />
        </div>
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

      {/* Animated background */}
      {screen !== 'chat' && <div className="animated-bg" />}

      {/* Screens */}
      <div style={{ paddingBottom: screen === 'chat' ? 0 : 60 }}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'chat' && <ChatScreen />}
        {screen === 'plans' && <PlansScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </>
  )
}
