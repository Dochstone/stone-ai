/**
 * Global state with Zustand — user, chat, UI state.
 */

import { create } from 'zustand'

// ─── Types ───

export interface Model {
  id: string
  name: string
  company: string
  tier: 'lite' | 'premium'
  icon: string
  desc: string
}

export interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export interface UserState {
  tgId: number
  username: string
  firstName: string
  plan: 'free' | 'plus' | 'max'
  liteToday: number
  premiumToday: number
  liteLimitDay: number
  premiumLimitDay: number
  totalRequests: number
  hasPass: boolean
}

type Screen = 'home' | 'chat' | 'plans' | 'profile'
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

// ─── Store ───

interface AppState {
  // Navigation
  screen: Screen
  setScreen: (s: Screen) => void

  // Palette
  paletteId: PaletteId
  setPaletteId: (id: PaletteId) => void
  palette: Palette

  // Model
  modelId: string
  setModelId: (id: string) => void
  models: Model[]
  setModels: (m: Model[]) => void

  // Chat
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

export const useStore = create<AppState>((set, get) => ({
  // Navigation
  screen: 'home',
  setScreen: (screen) => set({ screen }),

  // Palette
  paletteId: 'matrix',
  setPaletteId: (id) => set({ paletteId: id, palette: PALETTES.find(p => p.id === id) || PALETTES[0] }),
  palette: PALETTES[0],

  // Model
  modelId: 'gpt-4o-mini',
  setModelId: (id) => set({ modelId: id }),
  models: [],
  setModels: (models) => set({ models }),

  // Chat
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistant: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + content }
      }
      return { messages: msgs }
    }),
  clearMessages: () => set({ messages: [] }),
  isStreaming: false,
  setStreaming: (v) => set({ isStreaming: v }),

  // User
  user: {
    tgId: 0,
    username: '',
    firstName: '',
    plan: 'free',
    liteToday: 0,
    premiumToday: 0,
    liteLimitDay: 20,
    premiumLimitDay: 0,
    totalRequests: 0,
    hasPass: false,
  },
  setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),

  // UI
  loading: true,
  setLoading: (v) => set({ loading: v }),
}))
