/**
 * Payment hook — handles Stars invoice creation for USD balance top-up.
 *
 * Flow: Click "Buy" → POST /api/payment/stars/create-invoice { usd_amount }
 *       → get invoice_url → WebApp.openInvoice(url)
 *       → bot handles successful_payment → add_balance(usd)
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
  const [paymentLoading, setPaymentLoading] = useState(false)

  const buyWithStars = useCallback(async (usdAmount: number): Promise<PaymentResult> => {
    setPaymentStatus('loading')
    setPaymentLoading(true)

    try {
      const data = await apiPost<{ invoice_url: string; stars: number; usd_amount: number }>(
        '/api/payment/stars/create-invoice',
        { usd_amount: usdAmount }
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
