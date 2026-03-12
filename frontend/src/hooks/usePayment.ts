/**
 * Payment hook — handles Stars invoice creation and payment flow.
 *
 * Flow: Click "Buy" → POST /api/payment/stars/create-invoice → get invoice_url
 *       → WebApp.openInvoice(url) → bot handles pre_checkout + successful_payment
 *       → bot calls /api/payment/stars/confirm → credits added
 */

import { useState, useCallback } from 'react'
import { apiPost } from '../api/client'
import { openInvoice, haptic, hapticNotification } from '../utils/telegram'

export type PaymentStatus = 'idle' | 'loading' | 'success' | 'failed' | 'cancelled'

interface PaymentResult {
  status: PaymentStatus
  error?: string
}

interface TopUpPayload {
  usd_amount: number
  credits: number
  method: 'stars' | 'fiat'
}

export function usePayment() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [paymentLoading, setPaymentLoading] = useState(false)

  const buyWithStars = useCallback(async (payload: TopUpPayload): Promise<PaymentResult> => {
    setPaymentStatus('loading')
    setPaymentLoading(true)

    try {
      const data = await apiPost<{ invoice_url: string; stars: number; credits: number }>(
        '/api/payment/stars/create-invoice',
        payload
      )

      if (!data.invoice_url) throw new Error('Не получен URL инвойса')

      haptic('medium')
      const result = await openInvoice(data.invoice_url)

      if (result === 'paid') {
        setPaymentStatus('success')
        hapticNotification('success')
        return { status: 'success' }
      } else if (result === 'cancelled') {
        setPaymentStatus('cancelled')
        return { status: 'cancelled' }
      } else {
        setPaymentStatus('failed')
        return { status: 'failed', error: `Статус: ${result}` }
      }
    } catch (e: any) {
      setPaymentStatus('failed')
      hapticNotification('error')
      const errorMsg = e.detail || e.message || 'Ошибка оплаты'
      return { status: 'failed', error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) }
    } finally {
      setPaymentLoading(false)
    }
  }, [])

  const resetPayment = useCallback(() => {
    setPaymentStatus('idle')
    setPaymentLoading(false)
  }, [])

  return {
    buyWithStars,
    paymentStatus,
    paymentLoading,
    resetPayment,
  }
}
