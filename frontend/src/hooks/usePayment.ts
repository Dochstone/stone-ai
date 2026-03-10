/**
 * Payment hook — handles Stars invoice creation and payment flow.
 *
 * Flow: Click "Buy" → POST /api/payment/stars/create-invoice → get invoice_url
 *       → WebApp.openInvoice(url) → bot handles pre_checkout + successful_payment
 *       → bot calls /api/payment/stars/confirm → subscription/pass activated
 */

import { useState, useCallback } from 'react'
import { apiPost } from '../api/client'
import { openInvoice, haptic, hapticNotification } from '../utils/telegram'

export type PaymentStatus = 'idle' | 'loading' | 'success' | 'failed' | 'cancelled'

interface PaymentResult {
  status: PaymentStatus
  error?: string
}

export function usePayment() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null) // product_id being purchased

  const buyWithStars = useCallback(async (productId: string): Promise<PaymentResult> => {
    setPaymentStatus('loading')
    setPaymentLoading(productId)

    try {
      // Step 1: Create invoice via backend → bot
      const data = await apiPost<{ invoice_url: string; product_id: string; amount: number }>(
        '/api/payment/stars/create-invoice',
        { product_id: productId }
      )

      if (!data.invoice_url) {
        throw new Error('Не получен URL инвойса')
      }

      // Step 2: Open Telegram Stars payment dialog
      haptic('medium')
      const result = await openInvoice(data.invoice_url)

      // Step 3: Handle result
      if (result === 'paid') {
        setPaymentStatus('success')
        hapticNotification('success')
        return { status: 'success' }
      } else if (result === 'cancelled') {
        setPaymentStatus('cancelled')
        return { status: 'cancelled' }
      } else {
        setPaymentStatus('failed')
        return { status: 'failed', error: `Статус оплаты: ${result}` }
      }
    } catch (e: any) {
      setPaymentStatus('failed')
      hapticNotification('error')
      const errorMsg = e.detail || e.message || 'Ошибка оплаты'
      return { status: 'failed', error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) }
    } finally {
      setPaymentLoading(null)
    }
  }, [])

  const resetPayment = useCallback(() => {
    setPaymentStatus('idle')
    setPaymentLoading(null)
  }, [])

  return {
    buyWithStars,
    paymentStatus,
    paymentLoading,
    resetPayment,
  }
}
