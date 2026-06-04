/**
 * Global state with Zustand — user, chat, UI state.
 * Chat history persisted per-model in localStorage.
 */

import { create } from 'zustand'
import type { Lang } from '../i18n/translations'

// ─── Types ───

export interface Model {
  id: string
  name: string
  company: string
  tier: 'lite' | 'premium'
  icon: string
  desc: string
  price_weighted?: number
  price_input?: number
  price_output?: number
  context_length?: string
  category?: string
  required_tier?: 'free' | 'mini' | 'max'
  access_label?: string
  weight?: number
}

export interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export interface ModelPrice {
  input: number
  output: number
  weighted: number
}

export interface PremiumWeekly {
  used: number
  limit: number
  available: number
  resetAt: string
}

export interface UserState {
  tgId: number
  username: string
  firstName: string
  plan: string
  balanceUsd: number
  totalDepositedUsd: number
  modelPrices: Record<string, ModelPrice>
  liteToday: number
  liteLimitDay: number
  premiumWeekly: PremiumWeekly | null
  totalRequests: number
  totalTokens: number
  lastRequestCost: number | null
  lastRequestTokens: number | null
  sessionCostUsd: number
  hasPass: boolean
  avatarUrl: string | null
}

type Screen = 'home' | 'chat' | 'plans' | 'profile' | 'faq' | 'model_detail'
type PaletteId = 'matrix' | 'ocean' | 'sunset'

export interface Palette {
  id: PaletteId
  name: string
  primary: string
  primaryRgb: string
  secondary: string
  secondaryRgb: string
  accent3: string
  accent3Rgb: string
}

// ─── Palettes ───

export const PALETTES: Palette[] = [
  { id: 'matrix', name: 'Matrix', primary: '#00ff88', primaryRgb: '0,255,136', secondary: '#00e5ff', secondaryRgb: '0,229,255', accent3: '#39ff14', accent3Rgb: '57,255,20' },
  { id: 'ocean', name: 'Ocean', primary: '#45AEF5', primaryRgb: '69,174,245', secondary: '#6366f1', secondaryRgb: '99,102,241', accent3: '#06b6d4', accent3Rgb: '6,182,212' },
  { id: 'sunset', name: 'Sunset', primary: '#ff6b6b', primaryRgb: '255,107,107', secondary: '#ffa500', secondaryRgb: '255,165,0', accent3: '#ff3e9d', accent3Rgb: '255,62,157' },
]

// ─── Chat History Persistence ───

const STORAGE_KEY = 'stone_ai_chats'
const MAX_MESSAGES_PER_MODEL = 100

function loadChatHistory(): Record<string, ChatMsg[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveChatHistory(history: Record<string, ChatMsg[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // localStorage full — clear oldest chats
    try {
      const keys = Object.keys(history)
      if (keys.length > 3) {
        const trimmed: Record<string, ChatMsg[]> = {}
        keys.slice(-3).forEach(k => { trimmed[k] = history[k] })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      }
    } catch {}
  }
}

function loadPaletteId(): PaletteId {
  try {
    const id = localStorage.getItem('stone_ai_palette')
    if (id === 'matrix' || id === 'ocean' || id === 'sunset') return id
  } catch {}
  return 'matrix'
}

// ─── Store ───

interface AppState {
  // Navigation
  screen: Screen
  selectedModel: any | null
  setScreen: (s: Screen) => void
  setSelectedModel: (m: any | null) => void

  // Palette
  paletteId: PaletteId
  lang: Lang
  setPaletteId: (id: PaletteId) => void
  setLang: (lang: Lang) => void
  palette: Palette

  // Model
  modelId: string
  setModelId: (id: string) => void
  models: Model[]
  setModels: (m: Model[]) => void

  // Chat — per-model history
  chatHistory: Record<string, ChatMsg[]>
  messages: ChatMsg[]
  addMessage: (msg: ChatMsg) => void
  updateLastAssistant: (content: string) => void
  clearMessages: () => void
  isStreaming: boolean
  setStreaming: (v: boolean) => void

  // User
  user: UserState
  setUser: (u: Partial<UserState>) => void

  // UI
  loading: boolean
  setLoading: (v: boolean) => void
}

const savedPaletteId = loadPaletteId()
const savedHistory = loadChatHistory()
const savedLang = (localStorage.getItem('stone_lang') || 'ru') as Lang

export const useStore = create<AppState>((set, get) => ({
  // Navigation
  screen: 'home',
    selectedModel: null,
  setScreen: (screen) => set({ screen }),

  // Palette
  paletteId: savedPaletteId,
  lang: savedLang,
  setPaletteId: (id) => {
    try { localStorage.setItem('stone_ai_palette', id) } catch {}
    set({ paletteId: id, palette: PALETTES.find(p => p.id === id) || PALETTES[0] })
  },
  setLang: (lang) => {
    try { localStorage.setItem('stone_lang', lang) } catch {}
    set({ lang })
  },
  palette: PALETTES.find(p => p.id === savedPaletteId) || PALETTES[0],

  // Model — switching model loads that model's chat history
  modelId: 'gpt-4o-mini',
  setModelId: (id) => {
    const state = get()
    // Save current model's messages before switching
    const updatedHistory = { ...state.chatHistory, [state.modelId]: state.messages }
    saveChatHistory(updatedHistory)
    // Load new model's messages
    const newMessages = updatedHistory[id] || []
    set({ modelId: id, messages: newMessages, chatHistory: updatedHistory })
  },
  models: [],
  setModels: (models) => set({ models }),

  // Chat — per-model with persistence
  chatHistory: savedHistory,
  messages: savedHistory['gpt-4o-mini'] || [],

  addMessage: (msg) =>
    set((s) => {
      const newMessages = [...s.messages, msg]
      // Trim if too long
      const trimmed = newMessages.length > MAX_MESSAGES_PER_MODEL
        ? newMessages.slice(-MAX_MESSAGES_PER_MODEL)
        : newMessages
      const updatedHistory = { ...s.chatHistory, [s.modelId]: trimmed }
      saveChatHistory(updatedHistory)
      return { messages: trimmed, chatHistory: updatedHistory }
    }),

  updateLastAssistant: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + content }
      }
      // Don't save to localStorage during streaming (too frequent), save on done
      return { messages: msgs }
    }),

  clearMessages: () => {
    const state = get()
    const updatedHistory = { ...state.chatHistory }
    delete updatedHistory[state.modelId]
    saveChatHistory(updatedHistory)
    set({ messages: [], chatHistory: updatedHistory })
  },

  isStreaming: false,
  setStreaming: (v) => {
    set({ isStreaming: v })
    // When streaming stops, persist the final messages
    if (!v) {
      const state = get()
      const updatedHistory = { ...state.chatHistory, [state.modelId]: state.messages }
      saveChatHistory(updatedHistory)
      // Also update chatHistory in state
      set({ chatHistory: updatedHistory })
    }
  },

  // User
  user: {
    tgId: 0,
    username: '',
    firstName: '',
    plan: 'per_token',
    balanceUsd: 0,
    totalDepositedUsd: 0,
    modelPrices: {},
    liteToday: 0,
    liteLimitDay: 10,
    premiumWeekly: null,
    totalRequests: 0,
    totalTokens: 0,
    lastRequestCost: null,
    lastRequestTokens: null,
    sessionCostUsd: 0,
    hasPass: false,
    avatarUrl: null,
  },
  setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),

  // UI
  loading: true,
  setLoading: (v) => set({ loading: v }),
}))
