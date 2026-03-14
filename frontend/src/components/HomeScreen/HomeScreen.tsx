/**
 * HomeScreen — welcome, limits display, model grid.
 */

import { useStore } from '../../store/useStore'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'

export function HomeScreen() {
  const { palette, user, models, setModelId, setScreen } = useStore()
  const { t } = useTranslation()
  const p = palette

  const liteModels = models.filter((m) => m.tier === 'lite')
  const premiumModels = models.filter((m) => m.tier === 'premium')

  const handleModelClick = (model: typeof models[0]) => {
    haptic('medium')
    setModelId(model.id)
    setScreen('chat')
  }

  const liteUsedPct = user.liteLimitDay > 0
    ? Math.min((user.liteToday / user.liteLimitDay) * 100, 100)
    : 0

  return (
    <div style={{ padding: '16px 16px 80px', minHeight: '100vh' }}>

      {/* Promo Banner */}
      <PromoBanner palette={p} onPlansClick={() => { haptic('light'); setScreen('plans') }} />

      {/* Usage card */}
      <div style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid rgba(${p.primaryRgb},0.25)`,
        borderRadius: 16, padding: 16, marginBottom: 20,
      }}>
        {/* Lite usage */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#aab8aa', fontSize: 13 }}>Бесплатных сегодня</span>
          <span style={{
            color: liteUsedPct >= 100 ? '#ff6666' : p.primary,
            fontWeight: 700, fontSize: 14,
          }}>
            {user.liteToday}/{user.liteLimitDay === -1 ? '∞' : user.liteLimitDay}
          </span>
        </div>
        <div style={{
          height: 5, background: 'rgba(255,255,255,0.08)',
          borderRadius: 3, overflow: 'hidden', marginBottom: 14,
        }}>
          <div style={{
            height: '100%',
            width: `${liteUsedPct}%`,
            background: liteUsedPct >= 100
              ? 'linear-gradient(90deg, #ff6666, #ff4444)'
              : `linear-gradient(90deg, ${p.primary}, ${p.secondary})`,
            borderRadius: 3, transition: 'width 0.3s',
            boxShadow: `0 0 8px rgba(${p.primaryRgb},0.5)`,
          }} />
        </div>

        {/* Credits */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `rgba(${p.primaryRgb},0.06)`,
          border: `1px solid rgba(${p.primaryRgb},0.15)`,
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💎</span>
            <span style={{ color: '#aab8aa', fontSize: 13 }}>Кредиты</span>
          </div>
          {user.credits > 0 ? (
            <span style={{
              color: p.primary, fontWeight: 800, fontSize: 16,
              filter: `drop-shadow(0 0 6px rgba(${p.primaryRgb},0.5))`,
            }}>
              {user.credits.toLocaleString()} кр.
            </span>
          ) : (
            <span
              onClick={() => { haptic('light'); setScreen('plans') }}
              style={{
                background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Пополнить →
            </span>
          )}
        </div>
      </div>

      {/* Lite models */}
      <h3 style={{ color: '#c0e8d0', fontSize: 14, marginBottom: 10, fontWeight: 700, letterSpacing: 0.5 }}>
        🆓 {t.home_lite_free}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {liteModels.map((m) => (
          <ModelCard key={m.id} model={m} palette={p} onClick={() => handleModelClick(m)} />
        ))}
      </div>

      {/* Premium models */}
      <h3 style={{ color: '#c0e8d0', fontSize: 14, marginBottom: 10, fontWeight: 700, letterSpacing: 0.5 }}>
        💎 {t.home_premium_sub}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {premiumModels.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            palette={p}
            creditCost={user.creditCosts?.[m.id] || 0}
            canAfford={user.credits >= (user.creditCosts?.[m.id] || 0)}
            onClick={() => {
              if (user.credits < (user.creditCosts?.[m.id] || 0)) {
                haptic('light'); setScreen('plans')
              } else {
                handleModelClick(m)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

function PromoBanner({ palette, onPlansClick }: { palette: any; onPlansClick: () => void }) {
  const p = palette

  return (
    <div style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      marginBottom: 20, height: 220,
      border: `1px solid rgba(${p.primaryRgb},0.35)`,
      boxShadow: `0 0 30px rgba(${p.primaryRgb},0.08)`,
    }}>
      {/* Canvas mountains */}
      <canvas
        ref={el => {
          if (!el) return
          const ctx = el.getContext('2d')!
          const draw = () => {
            el.width = el.offsetWidth; el.height = el.offsetHeight
            const w = el.width, h = el.height
            ctx.clearRect(0,0,w,h)
            const sky = ctx.createLinearGradient(0,0,0,h)
            sky.addColorStop(0,'#010805'); sky.addColorStop(1,'#030f07')
            ctx.fillStyle = sky; ctx.fillRect(0,0,w,h)
            for(let i=0;i<40;i++){
              ctx.beginPath(); ctx.arc(Math.random()*w,Math.random()*h*.5,Math.random()*1.1,0,Math.PI*2)
              ctx.fillStyle=`rgba(200,255,220,${.2+Math.random()*.5})`; ctx.fill()
            }
            const far=[
              {peak:[w*.15,h*.36],l:[-w*.05,h*.76],r:[w*.38,h*.73]},
              {peak:[w*.50,h*.26],l:[w*.20,h*.70], r:[w*.78,h*.68]},
              {peak:[w*.84,h*.34],l:[w*.62,h*.72], r:[w*1.05,h*.74]},
            ]
            far.forEach((m,i)=>{
              ctx.beginPath(); ctx.moveTo(m.peak[0],m.peak[1]); ctx.lineTo(m.l[0],m.l[1]); ctx.lineTo(m.r[0],m.r[1]); ctx.closePath()
              ctx.fillStyle=['rgba(0,22,10,.9)','rgba(0,16,7,.92)','rgba(0,18,8,.91)'][i]; ctx.fill()
            })
            const near=[
              {peak:[w*.28,h*.50],l:[-w*.05,h],r:[w*.55,h]},
              {peak:[w*.72,h*.46],l:[w*.45,h], r:[w*1.05,h]},
            ]
            near.forEach(m=>{
              ctx.beginPath(); ctx.moveTo(m.peak[0],m.peak[1]); ctx.lineTo(m.l[0],m.l[1]); ctx.lineTo(m.r[0],m.r[1]); ctx.closePath()
              ctx.fillStyle='rgba(1,10,5,.97)'; ctx.fill()
            })
            ctx.save()
            ctx.shadowColor='rgba(0,255,136,.9)'; ctx.shadowBlur=12
            ctx.strokeStyle='rgba(0,255,136,.6)'; ctx.lineWidth=1.2
            far.forEach(m=>{ ctx.beginPath(); ctx.moveTo(m.l[0],m.l[1]); ctx.lineTo(m.peak[0],m.peak[1]); ctx.lineTo(m.r[0],m.r[1]); ctx.stroke() })
            ctx.shadowBlur=20; ctx.strokeStyle='rgba(0,255,136,1)'; ctx.lineWidth=1.6
            near.forEach(m=>{ ctx.beginPath(); ctx.moveTo(m.l[0],m.l[1]); ctx.lineTo(m.peak[0],m.peak[1]); ctx.lineTo(m.r[0],m.r[1]); ctx.stroke() })
            ctx.restore()
            const ov=ctx.createLinearGradient(0,0,0,h)
            ov.addColorStop(0,'rgba(1,8,4,.2)'); ov.addColorStop(.5,'rgba(1,8,4,.5)'); ov.addColorStop(1,'rgba(1,8,4,.1)')
            ctx.fillStyle=ov; ctx.fillRect(0,0,w,h)
          }
          draw()
          window.addEventListener('resize', draw)
        }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* AI Brand logos — left */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {/* OpenAI */}
        <div style={{ position: 'absolute', left: '3%', top: '6%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatA 3.2s ease infinite' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 41 41" fill="white"><path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-7.505-3.346 10.079 10.079 0 0 0-9.612 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.504 3.346 10.08 10.08 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.814zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L7.044 23.86a7.504 7.504 0 0 1-2.747-10.24zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l8.048 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.498v4.997l-4.331 2.5-4.331-2.5V18z"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>OpenAI</span>
        </div>
        {/* Claude */}
        <div style={{ position: 'absolute', left: '18%', top: '55%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatB 2.9s ease infinite 0.4s' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#d97757', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#2d0e00"><path d="M13.827 3.52h-3.654L5.484 20.48h3.312l1.002-2.957h4.403l1.002 2.957h3.313zm-3.044 11.49 1.521-4.498 1.522 4.498z"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#d97757' }}>Claude</span>
        </div>
        {/* Gemini */}
        <div style={{ position: 'absolute', left: '3%', top: '72%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatC 3.5s ease infinite 0.8s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><path d="M14 2 C14 2 15.5 10 20 14 C15.5 18 14 26 14 26 C14 26 12.5 18 8 14 C12.5 10 14 2 14 2Z" fill="url(#g1)"/><path d="M2 14 C2 14 10 12.5 14 8 C18 12.5 26 14 26 14 C26 14 18 15.5 14 20 C10 15.5 2 14 2 14Z" fill="url(#g2)"/><defs><linearGradient id="g1" x1="14" y1="2" x2="14" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#4285F4"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient><linearGradient id="g2" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#34A853"/><stop offset="100%" stop-color="#4285F4"/></linearGradient></defs></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#4285F4' }}>Gemini</span>
        </div>
        {/* DeepSeek */}
        <div style={{ position: 'absolute', left: '14%', top: '16%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatB 2.6s ease infinite 1.0s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#0d1b4b,#1a3a8f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="#4fc8ff" stroke-width="8"/><circle cx="50" cy="50" r="16" fill="#4fc8ff"/><circle cx="50" cy="50" r="7" fill="#0d1b4b"/><circle cx="68" cy="28" r="6" fill="#ff6b35"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#4fc8ff' }}>DeepSeek</span>
        </div>

        {/* Grok xAI */}
        <div style={{ position: 'absolute', right: '3%', top: '6%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatB 3.1s ease infinite 0.3s' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Grok</span>
        </div>
        {/* Mistral */}
        <div style={{ position: 'absolute', right: '17%', top: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatA 2.9s ease infinite 0.6s' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ff7000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 100 100" fill="white"><rect x="5" y="5" width="27" height="27" rx="3"/><rect x="37" y="5" width="27" height="27" rx="3"/><rect x="69" y="5" width="27" height="27" rx="3"/><rect x="5" y="37" width="27" height="27" rx="3"/><rect x="69" y="37" width="27" height="27" rx="3"/><rect x="37" y="69" width="27" height="27" rx="3"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#ff7000' }}>Mistral</span>
        </div>
        {/* Perplexity */}
        <div style={{ position: 'absolute', right: '3%', top: '68%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatC 3.4s ease infinite 1.1s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#20c5aa" stroke-width="8"/><line x1="50" y1="5" x2="50" y2="95" stroke="#20c5aa" stroke-width="6"/><line x1="5" y1="27.5" x2="95" y2="72.5" stroke="#20c5aa" stroke-width="6"/><line x1="95" y1="27.5" x2="5" y2="72.5" stroke="#20c5aa" stroke-width="6"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#20c5aa' }}>Perplexity</span>
        </div>
        {/* Google */}
        <div style={{ position: 'absolute', right: '22%', top: '12%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, animation: 'floatA 3.3s ease infinite 0.5s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#4285F4' }}>Google</span>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-7px) rotate(2deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-9px) rotate(-2deg)} }
        @keyframes floatC { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-5px) rotate(3deg)} }
        @keyframes shimmerBanner { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
        <h2 style={{
          fontSize: 36, fontWeight: 900, margin: '0 0 8px',
          backgroundImage: 'linear-gradient(90deg,#00ff88,#00ffcc,#ffffff,#00ffcc,#00ff88)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 25px rgba(0,255,136,1)) drop-shadow(0 0 50px rgba(0,255,136,0.5))',
          animation: 'shimmerBanner 3s ease infinite',
        }}>
          Stone AI
        </h2>
        <p style={{
          fontSize: 13, fontWeight: 700, margin: '0 0 14px',
          backgroundImage: 'linear-gradient(90deg,#00ff88,#aaffdd,#ffffff,#aaffdd,#00ff88)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'shimmerBanner 4s ease infinite reverse',
        }}>
          Весь мировой AI · прямо в Telegram
        </p>
        <button
          onClick={onPlansClick}
          style={{
            padding: '10px 28px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
            color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            boxShadow: `0 4px 20px rgba(${p.primaryRgb},0.5)`,
          }}
        >
          ⚡ Пополнить баланс
        </button>
      </div>
    </div>
  )
}

function ModelCard({
  model, palette, locked, creditCost, canAfford, onClick,
}: {
  model: any; palette: any; locked?: boolean
  creditCost?: number; canAfford?: boolean; onClick: () => void
}) {
  const p = palette
  const isLocked = locked ?? (creditCost !== undefined && creditCost > 0 && !canAfford)
  const isPremium = model.tier === 'premium'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(8,16,12,0.95)',
        border: `1px solid ${isLocked
          ? 'rgba(255,255,255,0.1)'
          : isPremium
            ? 'rgba(191,90,242,0.3)'
            : `rgba(${p.primaryRgb},0.25)`}`,
        borderRadius: 14, padding: '14px 8px',
        textAlign: 'center', cursor: 'pointer',
        opacity: isLocked ? 0.55 : 1,
        transition: 'transform 0.15s',
        position: 'relative',
      }}
    >
      {/* Badge */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
        background: isPremium ? 'rgba(191,90,242,0.2)' : `rgba(${p.primaryRgb},0.15)`,
        color: isPremium ? '#bf5af2' : p.primary,
      }}>
        {isPremium ? 'PRO' : 'FREE'}
      </div>

      <div style={{ fontSize: 28, marginBottom: 6 }}>{model.icon}</div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#e0f8ec', marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {model.name}
      </div>
      <div style={{ fontSize: 9, color: '#4a7a5a' }}>{model.company}</div>
      {creditCost !== undefined && creditCost > 0 && (
        <div style={{
          fontSize: 9, fontWeight: 800, marginTop: 5,
          color: canAfford ? '#bf5af2' : '#445544',
          background: canAfford ? 'rgba(191,90,242,0.1)' : 'rgba(255,255,255,0.04)',
          padding: '2px 6px', borderRadius: 5, display: 'inline-block',
        }}>
          {creditCost} кр.
        </div>
      )}
    </div>
  )
}
