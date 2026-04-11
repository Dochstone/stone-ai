/**
 * Telegram WebApp utilities.
 * Provides safe access to WebApp API with fallbacks for browser dev.
 */

export const tg = window.Telegram?.WebApp

export function getTelegramUser() {
  const user = tg?.initDataUnsafe?.user
  if (user) return user
  // Fallback for browser dev
  return {
    id: 123456789,
    first_name: 'Art',
    username: 'art_stone',
    language_code: 'ru',
  }
}

export function getInitData(): string {
  return tg?.initData || ''
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    tg?.HapticFeedback?.impactOccurred(type)
  } catch {}
}

export function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  try {
    tg?.HapticFeedback?.notificationOccurred(type)
  } catch {}
}

export function openInvoice(url: string): Promise<string> {
  return new Promise((resolve) => {
    if (tg?.openInvoice) {
      tg.openInvoice(url, (status) => {
        resolve(status)
      })
    } else {
      // Dev fallback
      console.log('[DEV] Would open invoice:', url)
      resolve('paid')
    }
  })
}

export function getStartParam(): string | null {
  return tg?.initDataUnsafe?.start_param || null
}

export function initTelegramApp() {
  if (tg) {
    tg.ready()
    tg.expand()
  }
}
