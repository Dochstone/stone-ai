/**
 * ModelDetailScreen — full-screen model description with Use/Back buttons.
 * Checks subscription status for premium models.
 */

import { useStore } from '../../store/useStore'
import { useTranslation } from '../../i18n/useTranslation'
import { haptic } from '../../utils/telegram'

const MODEL_DESC_KEY: Record<string, string> = {
  // Tier 1: Lite
  'gpt-4o-mini': 'mdesc_gpt4o_mini',
  'claude-haiku-4.5': 'mdesc_claude_haiku',
  'gemini-2.0-flash': 'mdesc_gemini_flash',
  'llama-4-maverick': 'mdesc_llama',
  'mistral-large-25': 'mdesc_mistral',
  'gemma-3-27b': 'mdesc_gemma3',
  'qwen-3-235b': 'mdesc_qwen3',
  // Tier 2: Premium mid-range
  'deepseek-r1': 'mdesc_deepseek',
  'deepseek-v3': 'mdesc_deepseek_v3',
  'gpt-4.1-mini': 'mdesc_gpt41_mini',
  'gemini-2.5-flash': 'mdesc_gemini25_flash',
  'claude-sonnet-4': 'mdesc_claude_sonnet',
  'grok-3-mini': 'mdesc_grok3_mini',
  'phi-4': 'mdesc_phi4',
  'qwen-qwq': 'mdesc_qwq',
  'command-r': 'mdesc_command_r',
  'mistral-small': 'mdesc_mistral_small',
  // Tier 3: Premium top
  'gpt-4.1': 'mdesc_gpt41',
  'claude-opus-4': 'mdesc_claude_opus',
  'grok-3': 'mdesc_grok',
  'gemini-2.5-pro': 'mdesc_gemini_pro',
  'perplexity-sonar-pro': 'mdesc_perplexity',
  'gpt-5.1': 'mdesc_gpt51',
  // Tier 4: Image
  'nano-banana-pro': 'mdesc_nano_banana_pro',
  'nano-banana': 'mdesc_nano_banana',
}

export function ModelDetailScreen() {
  const { selectedModel, user, setScreen, setModelId, setSelectedModel, palette } = useStore()
  const { t } = useTranslation()
  const p = palette

  if (!selectedModel) {
    setScreen('home')
    return null
  }

  const model = selectedModel
  const requiredTier = model.required_tier || (model.tier === 'premium' ? 'max' : 'free')
  const isPremium = requiredTier !== 'free'
  const hasStart = user.plan === 'mini' || user.plan === 'max' || user.plan === 'max-pro'
  const hasPro = user.plan === 'max' || user.plan === 'max-pro'
  const hasPass = user.hasPass
  const canUseModel = requiredTier === 'free'
    || (requiredTier === 'mini' && (hasStart || hasPass))
    || (requiredTier === 'max' && (hasPro || hasPass))
  const accessLabel = model.access_label || (requiredTier === 'mini' ? 'Start' : requiredTier === 'max' ? 'Pro' : 'Free')
  const descKey = MODEL_DESC_KEY[model.id] || 'mdesc_gpt4o_mini'
  const description = (t as any)[descKey] || model.desc || ''

  const handleUse = () => {
    haptic('medium')
    if (!canUseModel) {
      // No subscription — redirect to plans
      setScreen('plans')
    } else {
      // Has access — go to chat with this model
      setModelId(model.id)
      setSelectedModel(null)
      setScreen('chat')
    }
  }

  const handleBack = () => {
    haptic('light')
    setSelectedModel(null)
    setScreen('home')
  }

  return (
    <div style={{
      padding: '20px 16px 100px',
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Back button */}
      <div
        onClick={handleBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 24,
          transition: 'all 0.2s',
        }}
      >
        \u2190 {t.model_detail_back}
      </div>

      {/* Model icon large */}
      <div style={{
        textAlign: 'center',
        marginBottom: 24,
      }}>
        <div style={{
          fontSize: 72,
          marginBottom: 16,
          filter: `drop-shadow(0 0 24px rgba(${p.primaryRgb},0.3))`,
          animation: 'float 4s ease-in-out infinite',
        }}>
          {model.icon}
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          margin: '0 0 6px',
          letterSpacing: '-0.3px',
        }}>
          {model.name}
        </h1>
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 500,
        }}>
          {model.company}
        </div>
      </div>

      {/* Tier badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
      }}>
        <span style={{
          padding: '5px 14px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.5px',
          background: requiredTier === 'max' ? 'rgba(191,90,242,0.12)' : requiredTier === 'mini' ? 'rgba(69,174,245,0.12)' : 'rgba(0,255,136,0.12)',
          color: requiredTier === 'max' ? '#bf5af2' : requiredTier === 'mini' ? '#45AEF5' : '#00ff88',
          border: `1px solid ${requiredTier === 'max' ? 'rgba(191,90,242,0.25)' : requiredTier === 'mini' ? 'rgba(69,174,245,0.25)' : 'rgba(0,255,136,0.25)'}`,
        }}>
          {accessLabel.toUpperCase()}
        </span>
        <span style={{
          padding: '5px 14px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {isPremium ? t.model_detail_premium_model : t.model_detail_free_model}
        </span>
      </div>

      {/* Description card */}
      <div
        className="glass-card-accent"
        style={{
          padding: '20px 18px',
          marginBottom: 24,
          animation: 'slideUp 0.4s ease-out 0.1s both',
        }}
      >
        <div style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.75)',
          whiteSpace: 'pre-line',
        }}>
          {description}
        </div>
      </div>

      {/* Premium warning if needed */}
      {!canUseModel && (
        <div
          className="glass-card"
          style={{
            padding: '14px 18px',
            marginBottom: 24,
            textAlign: 'center',
            border: '1px solid rgba(255,199,0,0.2)',
            background: 'rgba(255,199,0,0.05)',
            animation: 'slideUp 0.4s ease-out 0.2s both',
          }}
        >
          <span style={{ fontSize: 16, marginRight: 6 }}>\u26a0\ufe0f</span>
          <span style={{ color: '#ffc700', fontSize: 13, fontWeight: 600 }}>
            {t.model_detail_need_sub}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: 12,
        animation: 'slideUp 0.4s ease-out 0.3s both',
      }}>
        <button
          className="btn-gradient"
          onClick={handleUse}
          style={{
            flex: 1,
            padding: '14px 0',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '0.3px',
            cursor: 'pointer',
          }}
        >
          {!canUseModel
            ? `\ud83d\udc8e ${t.model_detail_buy_sub}`
            : `\u26a1 ${t.model_detail_use}`
          }
        </button>
      </div>
    </div>
  )
}
