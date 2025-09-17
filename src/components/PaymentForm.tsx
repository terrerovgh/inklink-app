'use client'

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Wallet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  currency?: string
  description?: string
  metadata?: Record<string, any>
  onSuccess?: (paymentData: any) => void
  onError?: (error: string) => void
}

function StripePaymentForm({ amount, currency = 'usd', description, metadata, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          metadata
        })
      })

      const { clientSecret, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!')
        onSuccess?.(paymentIntent)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#ffffff',
                },
              },
            },
          }}
        />
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${amount}
          </>
        )}
      </Button>
    </form>
  )
}

function PayPalPaymentForm({ amount, currency = 'USD', description, metadata, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)

  const handlePayPalPayment = async () => {
    setLoading(true)

    try {
      // Create PayPal order
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          metadata
        })
      })

      const { orderId, approvalUrl, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to PayPal for approval
      window.location.href = approvalUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PayPal payment failed'
      toast.error(errorMessage)
      onError?.(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-black dark:border-white">
        <p className="text-sm text-gray-600 dark:text-white mb-2">
          You will be redirected to PayPal to complete your payment
        </p>
        <Badge variant="secondary">Amount: ${amount} {currency}</Badge>
      </div>
      <Button 
        onClick={handlePayPalPayment} 
        disabled={loading} 
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Pay with PayPal
          </>
        )}
      </Button>
    </div>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Choose your preferred payment method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stripe">
              <CreditCard className="mr-2 h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="paypal">
              <Wallet className="mr-2 h-4 w-4" />
              PayPal
            </TabsTrigger>
          </TabsList>
          <TabsContent value="stripe" className="mt-4">
            <Elements stripe={stripePromise}>
              <StripePaymentForm {...props} />
            </Elements>
          </TabsContent>
          <TabsContent value="paypal" className="mt-4">
            <PayPalPaymentForm {...props} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}