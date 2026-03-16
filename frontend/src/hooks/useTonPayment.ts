/**
 * TON Connect payment hook.
 *
 * Flow:
 *   1. buyWithTon(usd, credits) → POST /api/payment/ton/create-order
 *   2. sendTransaction via TON Connect UI (amount + comment)
 *   3. Poll /api/payment/ton/verify until confirmed or timeout
 */

import { useState, useCallback, useRef } from 'react'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { apiPost, apiGet } from '../api/client'
import { haptic, hapticNotification } from '../utils/telegram'

export type TonPaymentStatus = 'idle' | 'creating' | 'awaiting_wallet' | 'verifying' | 'success' | 'failed' | 'cancelled'

interface TonPaymentResult {
  status: TonPaymentStatus
  error?: string
  creditsAdded?: number
  newBalance?: number
  txHash?: string
}

interface TonOrderResponse {
  order_id: string
  address: string
  ton_amount: number
  nanoton_amount: string
  payload_comment: string
  expires_in: number
  ton_usd: number
}

interface TonVerifyResponse {
  status: 'completed' | 'pending' | 'already_completed'
  credits_added?: number
  new_balance?: number
  tx_hash?: string
  message?: string
}

// Encode text comment as BOC payload for TON transfer
function encodeComment(text: string): string {
  // Simple text comment encoding:
  // 0x00000000 (4 bytes op = text comment) + UTF-8 bytes
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)
  const payload = new Uint8Array(4 + textBytes.length)
  // First 4 bytes = 0 (text comment opcode)
  payload.set(textBytes, 4)

  // Convert to base64
  let binary = ''
  for (let i = 0; i < payload.length; i++) {
    binary += String.fromCharCode(payload[i])
  }
  return btoa(binary)
}

export function useTonPayment() {
  const [tonConnectUI] = useTonConnectUI()
  const walletAddress = useTonAddress()
  const [status, setStatus] = useState<TonPaymentStatus>('idle')
  const [loading, setLoading] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isWalletConnected = !!walletAddress

  const connectWallet = useCallback(async () => {
    try {
      await tonConnectUI.openModal()
    } catch (e) {
      console.error('TON Connect modal error:', e)
    }
  }, [tonConnectUI])

  const disconnectWallet = useCallback(async () => {
    try {
      await tonConnectUI.disconnect()
    } catch (e) {
      console.error('TON disconnect error:', e)
    }
  }, [tonConnectUI])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const buyWithTon = useCallback(async (usdAmount: number, credits: number): Promise<TonPaymentResult> => {
    if (!walletAddress) {
      return { status: 'failed', error: 'Кошелёк не подключён' }
    }

    setStatus('creating')
    setLoading(true)

    try {
      // 1. Create order on backend
      const order = await apiPost<TonOrderResponse>('/api/payment/ton/create-order', {
        usd_amount: usdAmount,
        credits: credits,
      })

      haptic('medium')
      setStatus('awaiting_wallet')

      // 2. Send transaction via TON Connect
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + order.expires_in,
        messages: [
          {
            address: order.address,
            amount: order.nanoton_amount,
            payload: encodeComment(order.payload_comment),
          },
        ],
      }

      try {
        await tonConnectUI.sendTransaction(transaction)
      } catch (txError: any) {
        // User cancelled in wallet
        if (txError?.message?.includes('cancel') || txError?.message?.includes('reject')) {
          setStatus('cancelled')
          setLoading(false)
          return { status: 'cancelled' }
        }
        throw txError
      }

      // 3. Transaction sent — now poll for verification
      setStatus('verifying')

      const result = await pollVerification(order.order_id)
      return result

    } catch (e: any) {
      setStatus('failed')
      setLoading(false)
      hapticNotification('error')
      const msg = e?.detail || e?.message || 'Ошибка оплаты TON'
      return { status: 'failed', error: typeof msg === 'string' ? msg : JSON.stringify(msg) }
    }
  }, [walletAddress, tonConnectUI])

  const pollVerification = useCallback(async (orderId: string): Promise<TonPaymentResult> => {
    // Poll every 5 seconds for up to 3 minutes
    const maxAttempts = 36
    let attempt = 0

    return new Promise<TonPaymentResult>((resolve) => {
      const poll = async () => {
        attempt++

        try {
          const resp = await apiPost<TonVerifyResponse>('/api/payment/ton/verify', {
            order_id: orderId,
          })

          if (resp.status === 'completed' || resp.status === 'already_completed') {
            stopPolling()
            setStatus('success')
            setLoading(false)
            hapticNotification('success')
            resolve({
              status: 'success',
              creditsAdded: resp.credits_added,
              newBalance: resp.new_balance,
              txHash: resp.tx_hash,
            })
            return
          }

          // Still pending
          if (attempt >= maxAttempts) {
            stopPolling()
            setStatus('failed')
            setLoading(false)
            resolve({
              status: 'failed',
              error: 'Транзакция не найдена. Если TON списан — кредиты зачислятся автоматически в течение 5 минут.',
            })
          }
        } catch (e: any) {
          if (attempt >= maxAttempts) {
            stopPolling()
            setStatus('failed')
            setLoading(false)
            resolve({
              status: 'failed',
              error: 'Ошибка проверки. Обратитесь в поддержку @art_stone',
            })
          }
        }
      }

      // Start polling
      poll() // first check immediately
      pollingRef.current = setInterval(poll, 5000)
    })
  }, [stopPolling])

  const resetTonPayment = useCallback(() => {
    stopPolling()
    setStatus('idle')
    setLoading(false)
  }, [stopPolling])

  return {
    // Wallet state
    isWalletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,

    // Payment
    buyWithTon,
    tonPaymentStatus: status,
    tonPaymentLoading: loading,
    resetTonPayment,
  }
}
