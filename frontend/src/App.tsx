/**
 * Stone AI — Main App with TopHeader, BottomNav, palette backgrounds.
 * Design: v4.5 prototype with premium aesthetic.
 */

import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useUser } from './hooks/useUser'
import { initTelegramApp } from './utils/telegram'
import { TopHeader, BottomNav, MatrixRain, OceanBg, SunsetBg } from './components/ui'
import { HomeScreen } from './components/HomeScreen/HomeScreen'
import { ChatScreen } from './components/ChatScreen/ChatScreen'
import { PlansScreen } from './components/PlansScreen/PlansScreen'
import { ProfileScreen } from './components/ProfileScreen/ProfileScreen'

// Global CSS keyframes + fonts
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes gradShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes gradientBar { 0% { background-position: 0% 0; } 100% { background-position: 300% 0; } }
@keyframes borderGlow { 0%,100% { border-color: rgba(var(--pr),0.12); } 50% { border-color: rgba(var(--pr),0.35); } }
@keyframes pillGlow { 0%,100% { border-color: rgba(var(--pr),0.3); background: rgba(var(--pr),0.12); } 50% { border-color: rgba(var(--pr),0.55); background: rgba(var(--pr),0.2); } }

* { box-sizing: border-box; }
body { margin: 0; padding: 0; background: #050a08; }
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: #050a08; }
::-webkit-scrollbar-thumb { background: #00ff4430; border-radius: 4px; }
input::placeholder, textarea::placeholder { color: #1a3a28; }
button:hover { opacity: 0.92; }
`

export default function App() {
  const { screen, setScreen, palette, loading, setLoading } = useStore()
  useUser()

  useEffect(() => {
    initTelegramApp()
    // Add global styles
    const style = document.createElement('style')
    style.textContent = GLOBAL_CSS
    document.head.appendChild(style)
    // Mark loaded
    const t = setTimeout(() => setLoading(false), 600)
    return () => { clearTimeout(t); document.head.removeChild(style) }
  }, [])

  const p = palette
  const screenMap: Record<string, string> = {
    home: 'home', plans: 'plans', chat: 'chat', faq: 'plans', profile: 'profile',
  }

  const handleNav = (id: string) => {
    const target = screenMap[id] || 'home'
    setScreen(target as any)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050a08',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          fontFamily: "'Orbitron',sans-serif", fontSize: 32, fontWeight: 900,
          background: 'linear-gradient(135deg, #aaff00, #00ff88)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.5))',
        }}>STONE AI</div>
        <div style={{
          fontFamily: 'monospace', fontSize: 12, color: '#3a6a50',
        }}>loading system...</div>
        <div style={{
          width: 120, height: 3, borderRadius: 2,
          background: 'linear-gradient(90deg, #00ff88, #00e5ff, #39ff14, #00ffcc, #00ff88)',
          backgroundSize: '300% 100%',
          animation: 'gradientBar 2s linear infinite',
        }} />
      </div>
    )
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen />
      case 'chat': return <ChatScreen />
      case 'plans': return <PlansScreen />
      case 'profile': return <ProfileScreen />
      default: return <HomeScreen />
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#050a08', color: '#e0f0e8',
      fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      maxWidth: 480, margin: '0 auto', position: 'relative', overflow: 'hidden',
    }}>
      {/* Palette-specific background */}
      {p.id === 'matrix' && (
        <>
          <MatrixRain primaryRgb={p.primaryRgb} primary={p.primary} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${p.primaryRgb},0.012) 2px, rgba(${p.primaryRgb},0.012) 4px)`,
          }} />
          <div style={{
            position: 'fixed', top: '-5%', left: '-10%', width: 350, height: 350, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${p.primaryRgb},0.08) 0%, transparent 70%)`,
            filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1,
          }} />
        </>
      )}
      {p.id === 'ocean' && <OceanBg primaryRgb={p.primaryRgb} secondaryRgb={p.secondaryRgb} primary={p.primary} />}
      {p.id === 'sunset' && <SunsetBg primaryRgb={p.primaryRgb} secondaryRgb={p.secondaryRgb} />}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <TopHeader primaryRgb={p.primaryRgb} primary={p.primary} />
        {renderScreen()}
      </div>

      {/* Navigation */}
      <BottomNav
        active={screen}
        onNavigate={handleNav}
        primaryRgb={p.primaryRgb}
        secondaryRgb={p.secondaryRgb}
        primary={p.primary}
      />
    </div>
  )
}
