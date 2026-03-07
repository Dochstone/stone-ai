/// <reference types="vite/client" />

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
  }
  ready: () => void
  expand: () => void
  close: () => void
  openInvoice: (url: string, callback?: (status: string) => void) => void
  MainButton: {
    text: string
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
  }
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
  }
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    button_color?: string
    button_text_color?: string
  }
  colorScheme: 'light' | 'dark'
  HapticFeedback: {
    impactOccurred: (style: string) => void
    notificationOccurred: (type: string) => void
  }
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
