/**
 * Stone AI — Shared UI Components
 * Card, Tag, Divider, GlowBtn, GlitchTitle, MatrixRain, OceanBg, SunsetBg, TonIcon
 */
import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

// ─── Card ───
interface CardProps { children: ReactNode; style?: CSSProperties; onClick?: () => void; accent?: string; featured?: boolean }
export function Card({ children, style, onClick, accent = '#00ff88', featured }: CardProps) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', borderRadius: 16, padding: 1,
      cursor: onClick ? 'pointer' : 'default',
      background: featured
        ? `linear-gradient(135deg, ${accent}, transparent, ${accent})`
        : `linear-gradient(135deg, ${accent}30, transparent, ${accent}15)`,
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', ...style,
    }}>
      {featured && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 17,
          background: `linear-gradient(135deg, ${accent}, transparent, ${accent})`,
          filter: 'blur(10px)', opacity: 0.2, zIndex: -1,
        }} />
      )}
      <div style={{
        background: 'rgba(8,16,12,0.92)', backdropFilter: 'blur(20px)',
        borderRadius: 15, padding: 16, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 80, height: 80,
          background: `radial-gradient(circle at top right, ${accent}08, transparent)`,
          pointerEvents: 'none',
        }} />
        {children}
      </div>
    </div>
  )
}

// ─── Tag ───
interface TagProps { text: string; accent?: string }
export function Tag({ text, accent = '#00ff88' }: TagProps) {
  return (
    <span style={{
      fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      color: accent, background: `${accent}12`,
      border: `1px solid ${accent}25`, padding: '2px 7px', borderRadius: 4,
      textShadow: `0 0 8px ${accent}40`,
    }}>{text}</span>
  )
}

// ─── Divider ───
interface DividerProps { label: string }
export function Divider({ label }: DividerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,255,136,0.3), transparent)' }} />
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: '#00ff8850', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, rgba(0,255,136,0.3), transparent)' }} />
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
    </div>
  )
}

// ─── GlowBtn ───
interface GlowBtnProps { children: ReactNode; onClick?: (e: React.MouseEvent) => void; variant?: 'green' | 'ton'; disabled?: boolean; style?: CSSProperties }
export function GlowBtn({ children, onClick, variant = 'green', disabled, style: s }: GlowBtnProps) {
  const bg = variant === 'ton'
    ? 'linear-gradient(135deg, rgba(0,152,234,0.15), rgba(69,174,245,0.1))'
    : 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,229,255,0.1))'
  const border = variant === 'ton' ? 'rgba(0,152,234,0.3)' : 'rgba(0,255,136,0.25)'
  const color = variant === 'ton' ? '#45AEF5' : '#00ff88'
  return (
    <button disabled={disabled} onClick={onClick} style={{
      width: '100%', padding: '14px 20px', borderRadius: 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? 'rgba(0,255,136,0.03)' : bg,
      border: `1px solid ${disabled ? 'rgba(0,255,136,0.08)' : border}`,
      color: disabled ? '#3a6a50' : color,
      fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'all 0.2s',
      textShadow: disabled ? 'none' : `0 0 8px ${color}40`,
      boxShadow: disabled ? 'none' : `0 0 20px ${color}15`,
      ...s,
    }}>{children}</button>
  )
}

// ─── GlitchTitle ───
interface GlitchTitleProps { text: string; size?: number }
export function GlitchTitle({ text, size = 32 }: GlitchTitleProps) {
  const [g, setG] = useState(false)
  useEffect(() => {
    const iv = setInterval(() => { setG(true); setTimeout(() => setG(false), 120) }, 4000 + Math.random() * 3000)
    return () => clearInterval(iv)
  }, [])
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: size, fontWeight: 900,
        background: 'linear-gradient(135deg, #aaff00, #00ff88, #ccff00)',
        backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'gradShift 4s ease-in-out infinite',
        filter: 'drop-shadow(0 0 20px rgba(170,255,0,0.5))',
      }}>{text}</span>
      {g && (<>
        <span style={{ position: 'absolute', top: 0, left: 3, fontFamily: "'Orbitron',sans-serif", fontSize: size, fontWeight: 900, color: '#aaff00', clipPath: 'inset(15% 0 45% 0)' }}>{text}</span>
        <span style={{ position: 'absolute', top: 0, left: -3, fontFamily: "'Orbitron',sans-serif", fontSize: size, fontWeight: 900, color: '#00ff88', clipPath: 'inset(55% 0 15% 0)' }}>{text}</span>
      </>)}
    </div>
  )
}

// ─── TonIcon ───
export function TonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 9.5L12 22L21 9.5L12 2Z" fill="#0098EA" opacity="0.9" />
      <path d="M12 2L3 9.5H21L12 2Z" fill="#45AEF5" />
      <path d="M12 22L3 9.5H12V22Z" fill="#0088CC" />
      <path d="M12 22L21 9.5H12V22Z" fill="#0098EA" />
    </svg>
  )
}

// ─── MatrixRain ───
interface BgProps { primaryRgb: string; secondaryRgb?: string; primary?: string }
export function MatrixRain({ primaryRgb, primary }: BgProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const rgbRef = useRef(primaryRgb)
  const primRef = useRef(primary)
  rgbRef.current = primaryRgb
  primRef.current = primary

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const chars = '01STONEAI'
    const fs = 13
    const cols = Math.floor(c.width / fs)
    const drops = Array(cols).fill(0).map(() => Math.random() * -50)
    const draw = () => {
      const rgb = rgbRef.current; const p = primRef.current || '#00ff88'
      ctx.fillStyle = 'rgba(5,10,8,0.06)'; ctx.fillRect(0, 0, c.width, c.height)
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)]
        const b = Math.random()
        if (b > 0.95) { ctx.fillStyle = p; ctx.shadowColor = p; ctx.shadowBlur = 15 }
        else if (b > 0.8) { ctx.fillStyle = `rgba(${rgb},0.5)`; ctx.shadowBlur = 0 }
        else { ctx.fillStyle = `rgba(${rgb},0.15)`; ctx.shadowBlur = 0 }
        ctx.font = `${fs}px monospace`
        ctx.fillText(ch, i * fs, drops[i] * fs)
        ctx.shadowBlur = 0
        if (drops[i] * fs > c.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }
    const iv = setInterval(draw, 45)
    return () => { clearInterval(iv); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ─── OceanBg ───
export function OceanBg({ primaryRgb, secondaryRgb = '99,102,241', primary = '#45AEF5' }: BgProps & { primary?: string; secondary?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #040810 0%, #0a1628 30%, #0d1f3c 60%, #081430 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(1px 1px at 10% 15%, rgba(${primaryRgb},0.6), transparent), radial-gradient(1px 1px at 25% 35%, rgba(${secondaryRgb},0.4), transparent), radial-gradient(1.5px 1.5px at 45% 10%, rgba(${primaryRgb},0.5), transparent), radial-gradient(1px 1px at 60% 25%, rgba(255,255,255,0.3), transparent)` }} />
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(${primaryRgb},0.06) 0%, transparent 70%)`, filter: 'blur(80px)' }} />
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', opacity: 0.04 }} viewBox="0 0 480 200" preserveAspectRatio="none">
        <path d={`M0,120 C120,80 240,160 480,100 L480,200 L0,200 Z`} fill={primary} />
      </svg>
    </div>
  )
}

// ─── SunsetBg ───
export function SunsetBg({ primaryRgb, secondaryRgb = '255,165,0' }: BgProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0d0008 0%, #1a0a12 25%, #150510 50%, #0d0015 80%, #080010 100%)' }} />
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(${primaryRgb},0.08) 0%, transparent 70%)`, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', top: '30%', left: '-10%', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, rgba(${secondaryRgb},0.06) 0%, transparent 70%)`, filter: 'blur(70px)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }} viewBox="0 0 480 800">
        {Array.from({ length: 12 }, (_, i) => (<line key={`h${i}`} x1="0" y1={i * 70} x2="480" y2={i * 70} stroke={`rgba(${primaryRgb},1)`} strokeWidth="0.5" />))}
        {Array.from({ length: 8 }, (_, i) => (<line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="800" stroke={`rgba(${secondaryRgb},1)`} strokeWidth="0.5" />))}
      </svg>
    </div>
  )
}

// ─── TopHeader ───
interface TopHeaderProps { primaryRgb: string; primary: string }
export function TopHeader({ primaryRgb, primary }: TopHeaderProps) {
  return (
    <div onClick={() => window.open('https://t.me/stoneAIC', '_blank')} style={{
      position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,10,8,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: `1px solid rgba(${primaryRgb},0.1)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '14px 0 12px', cursor: 'pointer',
    }}>
      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>TG</span>
      <span style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: primary,
        letterSpacing: '0.1em', textShadow: `0 0 12px rgba(${primaryRgb},0.5), 0 0 24px rgba(${primaryRgb},0.2)`,
      }}>STONE</span>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: primary, boxShadow: `0 0 8px ${primary}`, animation: 'blink 2s ease-in-out infinite' }} />
    </div>
  )
}

// ─── BottomNav ───
interface BottomNavProps { active: string; onNavigate: (id: string) => void; primaryRgb: string; secondaryRgb: string; primary: string }

// NAV_ITEMS moved inside component for i18n

export function BottomNav({ active, onNavigate, primaryRgb, secondaryRgb, primary }: BottomNavProps) {
  const { t } = useTranslation()
  const NAV_ITEMS = [
    { id: 'home', icon: '🏠', label: t.nav_home },
    { id: 'plans', icon: '💳', label: t.nav_plans },
    { id: 'chat', icon: '💬', label: t.nav_chat, main: true },
    { id: 'faq', icon: '❓', label: t.nav_faq },
    { id: 'profile', icon: '👤', label: t.nav_profile },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'linear-gradient(to top, #050a08 85%, transparent)',
      borderTop: `1px solid rgba(${primaryRgb},0.15)`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      padding: '6px 0 12px', maxWidth: 480, margin: '0 auto',
    }}>
      {NAV_ITEMS.map(it => {
        const isActive = active === it.id
        return (
          <button key={it.id} onClick={() => onNavigate(it.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            transition: 'all 0.2s', padding: '0 4px',
            width: 60, textAlign: 'center',
            ...(it.main ? { marginTop: -14 } : {}),
          }}>
            {it.main ? (
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: isActive
                  ? `linear-gradient(135deg, rgba(${primaryRgb},0.2), rgba(${secondaryRgb},0.15))`
                  : `rgba(${primaryRgb},0.08)`,
                border: `2px solid ${isActive ? `rgba(${primaryRgb},0.5)` : `rgba(${primaryRgb},0.2)`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                boxShadow: isActive ? `0 0 20px rgba(${primaryRgb},0.25)` : 'none',
                transition: 'all 0.3s',
              }}>{it.icon}</div>
            ) : (
              <span style={{
                fontSize: 20,
                opacity: isActive ? 1 : 0.55,
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.25s',
                filter: isActive ? `drop-shadow(0 0 6px rgba(${primaryRgb},0.5))` : 'none',
              }}>{it.icon}</span>
            )}
            <span style={{
              fontFamily: 'monospace', fontSize: 9, fontWeight: 700,
              color: isActive ? primary : '#5a8a70',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              textShadow: isActive ? `0 0 6px rgba(${primaryRgb},0.4)` : 'none',
              transition: 'all 0.2s',
            }}>{it.label}</span>
          </button>
        )
      })}
    </div>
  )
      }
