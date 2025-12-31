'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, CreditCard, CheckCircle } from 'lucide-react'
import { api, formatApiError } from '@/lib/api-client'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

/* =======================
   Stripe Wrapper Component
======================= */

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentIntentResponse {
  message: string
  client_secret: string
  order_id: number
  payment_intent_id: string
  amount: number
  package_name: string
}

/* =======================
   Inner Checkout Form
======================= */

const CheckoutForm = ({ teacherId, packageId }: { teacherId: number; packageId: number }) => {
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [packageName, setPackageName] = useState<string | null>(null)

  /* ---------- Step 1: Create PaymentIntent ---------- */
  const handleCreatePayment = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const res = await api.post<PaymentIntentResponse>(
        '/payments/stripe/create-payment-intent/',
        { teacher_id: teacherId, package_id: packageId }
      )

      setClientSecret(res.client_secret)
      setOrderId(res.order_id)
      setAmount(res.amount)
      setPackageName(res.package_name)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  // Auto-create payment intent on mount if not already created
  useEffect(() => {
    if (teacherId && packageId && !clientSecret) {
        handleCreatePayment()
    }
  }, [teacherId, packageId])

  /* ---------- Step 2: Confirm Card Payment + Backend Verification ---------- */

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !clientSecret) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const card = elements.getElement(CardElement)
      if (!card) throw new Error('Card element not found')

      // Confirm card payment
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
         // Call backend to finalize
        const verifyRes = await api.post('/payments/stripe/confirm-payment/', {
            payment_intent_id: paymentIntent.id
        })
        setSuccess(`Payment successful! Amount: $${verifyRes.amount} for ${verifyRes.package_name}`)
      }
    } catch (err: any) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
      return (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
              <p className="text-gray-600">{success}</p>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/profile'}>
                  Return to Profile
              </Button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
        {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <span className="font-semibold">Error:</span> {error}
            </div>
        )}

        {!clientSecret ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-gray-500">Initializing secure payment...</p>
             </div>
        ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Package</span>
                        <span className="font-medium text-gray-900">{packageName}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Amount</span>
                        <span className="font-medium text-gray-900">${amount}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-primary">${amount}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <CardElement options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#9e2146',
                                },
                            },
                        }} />
                    </div>
                    
                    <Button 
                        onClick={handleConfirmPayment} 
                        disabled={loading || !stripe} 
                        className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin w-5 h-5" />
                                Processing...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Pay ${amount}
                            </div>
                        )}
                    </Button>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Lock className="w-3 h-3" />
                    <span>Payments are secure and encrypted</span>
                </div>
            </div>
        )}
    </div>
  )
}

/* =======================
   Page Component
======================= */

function PaymentContent() {
    const searchParams = useSearchParams()
    const teacherId = searchParams.get('teacherId')
    const packageId = searchParams.get('packageId')

    if (!teacherId || !packageId) {
        return (
            <div className="text-center py-10 text-gray-500">
                Invalid payment link. Please go back and try again.
            </div>
        )
    }

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm teacherId={parseInt(teacherId)} packageId={parseInt(packageId)} />
        </Elements>
    )
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-1 text-center pb-8 border-b bg-white rounded-t-xl">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Secure Checkout</CardTitle>
                <CardDescription>Complete your subscription purchase</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white rounded-b-xl">
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                    <PaymentContent />
                </Suspense>
            </CardContent>
        </Card>
    </div>
  )
}