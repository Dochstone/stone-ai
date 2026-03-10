/**
 * ChatScreen â€” Model selector dropdown, gradient bubbles, streaming, monospace input.
 * + Markdown rendering for assistant messages.
 */
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { useChat } from '../../hooks/useChat'
import { Tag } from '../ui'
import { renderMarkdown } from '../../utils/markdown'

const MODEL_ACCENTS: Record<string, string> = {
  'gpt-4o-mini': '#00ffaa',
  'claude-haiku-4.5': '#c084fc',
  'gemini-2.0-flash': '#00e5ff',
  'deepseek-r1': '#00ffcc',
  'llama-4-maverick': '#66ffcc',
  'mistral-large-25': '#00ff88',
  'gpt-4.1': '#00ffaa',
  'claude-opus-4': '#bf5af2',
  'grok-3': '#39ff14',
  'gemini-2.5-pro': '#00e5ff',
  'perplexity-sonar-pro': '#aaff00',
}

export function ChatScreen() {
  const { models, modelId, setModelId, messages, isStreaming, user } = useStore()
  const { sendMessage } = useChat()
  const [input, setInput] = useState('')
  const [showModels, setShowModels] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const currentModel = models.find(m => m.id === modelId) || models[0]
  const accent = currentModel ? MODEL_ACCENTS[currentModel.id] || '#00ff88' : '#00ff88'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const handleSend = () => {
    const txt = input.trim()
    if (!txt || isStreaming) return
    setInput('')
    sendMessage(txt)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat header with model selector */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid rgba(0,255,136,0.08)',
        background: 'rgba(5,10,8,0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 50,
      }}>
        <div
          onClick={() => setShowModels(!showModels)}
          style={{
            fontSize: 18, width: 36, height: 36, borderRadius: 10,
            background: `${accent}10`, border: `1px solid ${accent}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>{currentModel?.icon}</div>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setShowModels(!showModels)}>
          <div style={{ fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700, color: '#e0f0e8' }}>
            {currentModel?.name} â–¾
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70' }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#00ff88', display: 'inline-block',
              marginRight: 4, boxShadow: '0 0 6px #00ff88'
            }} />
            {currentModel?.company}
          </div>
        </div>
        <Tag
          text={currentModel?.tier === 'premium' ? 'PRO' : 'FREE'}
          accent={currentModel?.tier === 'premium' ? '#bf5af2' : '#00ff88'}
        />
      </div>

      {/* Model selector dropdown */}
      {showModels && (
        <div style={{
          position: 'absolute', top: 100, left: 12, right: 12, zIndex: 200,
          background: '#0a1410', border: '1px solid rgba(0,255,136,0.12)',
          borderRadius: 16, padding: 8,
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          maxHeight: 360, overflowY: 'auto',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70', padding: '6px 10px', textTransform: 'uppercase' }}>select model</div>
          {models.map(md => {
            const mdAccent = MODEL_ACCENTS[md.id] || '#00ff88'
            const isPremium = md.tier === 'premium'
            const isLocked = isPremium && user.plan === 'free'
            return (
              <div
                key={md.id}
                onClick={() => { if (!isLocked) { setModelId(md.id); setShowModels(false) } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 10px', borderRadius: 10,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  background: modelId === md.id ? `${mdAccent}10` : 'transparent',
                  border: modelId === md.id ? `1px solid ${mdAccent}20` : '1px solid transparent',
                  marginBottom: 2, opacity: isLocked ? 0.5 : 1,
                }}>
                <span style={{ fontSize: 18 }}>{md.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, color: '#e0f0e8' }}>{md.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a8a70' }}>{md.company}</div>
                </div>
                {isLocked && <Tag text="ğŸ”’" accent="#3a6a50" />}
                {modelId === md.id && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: mdAccent, boxShadow: `0 0 8px ${mdAccent}` }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{currentModel?.icon || 'ğŸ¤–'}</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>
              {currentModel?.name}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a8a70', marginTop: 4 }}>
              type your question below
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,229,255,0.08))'
                : 'rgba(8,16,12,0.9)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(0,255,136,0.25)' : 'rgba(0,255,136,0.08)'}`,
              borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
              borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 14,
            }}>
              {msg.role === 'assistant' ? (
                <div
                  className="md-content"
                  style={{ fontSize: 13, lineHeight: 1.55, color: '#e0f0e8' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.55, color: '#e0f0e8', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              )}
              {msg.role === 'assistant' && (
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a6a50', marginTop: 6, textAlign: 'right' }}>
                  {currentModel?.icon} {currentModel?.name}
                </div>
              )}
            </div>
          </div>
        ))}‚²ò¢G—–ær–æF–6F÷"¢÷Ğ¢¶—57G&VÖ–ærbbÖW76vW2æÆVæwF‚âbbÖW76vW5¶ÖW76vW2æÆVæwF‚ÒÓòæ6öçFVçBÓÓÒrrbb€¢ÆF—b7G–ÆS×·²F—7Æ“¢vfÆW‚rÂv¢bÂFF–æs¢s‡‚r×Óà¢ÆF—b7G–ÆS×·°¢&6¶w&÷VæC¢w&v&ƒ‚ÃbÃ"Ãã’’rÀ¢&÷&FW#¢s‚6öÆ–B&v&ƒÃ#SRÃ3bÃã‚’rÀ¢&÷&FW%&F—W3¢BÂFF–æs¢s‚g‚rÀ¢F—7Æ“¢vfÆW‚rÂv¢RÀ¢×Óà¢µ³ÂÂ%ÒæÖ†¢Óâ€¢ÆF—b¶W“×¶§Ò7G–ÆS×·°¢v–GFƒ¢bÂ†V–v‡C¢bÂ&÷&FW%&F—W3¢sSRrÀ¢&6¶w&÷VæC¢r3fcƒ‚rÀ¢æ–ÖF–öã¢&Æ–æ²ã'2V6RÖ–âÖ÷WBG¶¢¢ã'×2–æf–æ—FVÀ¢&÷…6†F÷s¢sg‚3fcƒ‚rÀ¢×Òóà¢’—Ğ¢ÂöF—cà¢ÂöF—cà¢—Ğ¢ÆF—b&Vc×¶VæE&VgÒóà¢ÂöF—cà ¢²ò¢–çWB&"¢÷Ğ¢ÆF—b7G–ÆS×·°¢÷6—F–öã¢vf—†VBrÂ&÷GFöÓ¢cÂÆVgC¢Â&–v‡C¢À¢FF–æs¢s‡‚g‚'‚rÀ¢&6¶w&÷VæC¢vÆ–æV"Öw&F–VçB‡FòF÷Â3S‚“RÂG&ç7&VçB’rÀ¢¤–æFWƒ¢SÂÖ…v–GFƒ¢CƒÂÖ&v–ã¢sWFòrÀ¢×Óà¢ÆF—b7G–ÆS×·°¢F—7Æ“¢vfÆW‚rÂÆ–vä—FV×3¢v6VçFW"rÂv¢‚À¢&6¶w&÷VæC¢w&v&ƒÃ#SRÃ3bÃãr’rÀ¢&÷&FW#¢s‚6öÆ–B&v&ƒÃ#SRÃ3bÃã#"’rÀ¢&÷&FW%&F—W3¢BÂFF–æs¢sG‚G‚G‚G‚rÀ¢×Óà¢Æ–çW@¢fÇVS×¶–çWGĞ¢öä6†ævS×¶RÓâ6WD–çWB†RçF&vWBçfÇVR—Ğ¢öä¶W”F÷vã×¶RÓâRæ¶W’ÓÓÒtVçFW"rbbRç6†–gD¶W’bb†æFÆU6VæB‚—Ğ¢Æ6V†öÆFW#Ò#âVçFW"VW'’âââ ¢7G–ÆS×·°¢fÆWƒ¢Â&6¶w&÷VæC¢væöæRrÂ&÷&FW#¢væöæRrÂ÷WFÆ–æS¢væöæRrÀ¢6öÆ÷#¢r6ScS‚rÂföçE6—¦S¢2ÂföçDfÖ–Ç“¢vÖöæ÷76RrÂFF–æs¢s‡‚rÀ¢×Ğ¢óà¢Æ'WGFöà¢öä6Æ–6³×¶†æFÆU6VæGĞ¢7G–ÆS×·°¢v–GFƒ¢3bÂ†V–v‡C¢3bÂ&÷&FW%&F—W3¢Â&÷&FW#¢væöæRrÀ¢&6¶w&÷VæC¢–çWBçG&–Ò‚’bb—57G&VÖ–æròw&v&ƒÃ#SRÃ3bÃã"’r¢w&v&ƒÃ#SRÃ3bÃãb’rÀ¢7W'6÷#¢–çWBçG&–Ò‚’bb—57G&VÖ–æròwö–çFW"r¢vFVfVÇBrÀ¢föçE6—¦S¢bÀ¢6öÆ÷#¢–çWBçG&–Ò‚’bb—57G&VÖ–æròr3fcƒ‚r¢r36fSrÀ¢G&ç6—F–öã¢vÆÂã'2rÀ¢F—7Æ“¢vfÆW‚rÂÆ–vä—FV×3¢v6VçFW"rÂ§W7F–g”6öçFVçC¢v6VçFW"rÀ¢&÷…6†F÷s¢–çWBçG&–Ò‚’bb—57G&VÖ–æròs‚&v&ƒÃ#SRÃ3bÃã"’r¢væöæRrÀ¢×Óà¢¶—57G&VÖ–ærò~(û2r¢~(iwĞ¢Âö'WGFöãà¢ÂöF—cà¢ÂöF—cà¢ÂöF—cà¢§Ğ 