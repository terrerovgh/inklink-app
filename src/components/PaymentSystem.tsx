'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreditCard, DollarSign, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  payment_method: 'stripe' | 'paypal'
  description: string
  metadata: {
    offer_id?: string
    service_type?: string
    client_id: string
    artist_id: string
  }
  created_at: string
  updated_at: string
}

interface PaymentSystemProps {
  offerId?: string
  amount: number
  currency?: string
  description: string
  clientId: string
  artistId: string
  onPaymentSuccess?: (paymentIntent: PaymentIntent) => void
  onPaymentError?: (error: string) => void
}

export default function PaymentSystem({
  offerId,
  amount,
  currency = 'EUR',
  description,
  clientId,
  artistId,
  onPaymentSuccess,
  onPaymentError
}: PaymentSystemProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [stripeConfig, setStripeConfig] = useState<any>(null)
  const [paypalConfig, setPaypalConfig] = useState<any>(null)
  
  // Stripe elements
  const [stripe, setStripe] = useState<any>(null)
  const [elements, setElements] = useState<any>(null)
  const [cardElement, setCardElement] = useState<any>(null)
  
  // PayPal
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalButtons, setPaypalButtons] = useState<any>(null)

  useEffect(() => {
    loadPaymentConfigs()
  }, [])

  const loadPaymentConfigs = async () => {
    try {
      // Load Stripe config
      const stripeResponse = await fetch('/api/payments/stripe/config')
      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json()
        setStripeConfig(stripeData)
        
        // Load Stripe.js
        if (stripeData.publishable_key) {
          const { loadStripe } = await import('@stripe/stripe-js')
          const stripeInstance = await loadStripe(stripeData.publishable_key)
          setStripe(stripeInstance)
        }
      }

      // Load PayPal config
      const paypalResponse = await fetch('/api/payments/paypal/config')
      if (paypalResponse.ok) {
        const paypalData = await paypalResponse.json()
        setPaypalConfig(paypalData)
        
        // Load PayPal SDK
        if (paypalData.client_id) {
          loadPayPalSDK(paypalData.client_id)
        }
      }
    } catch (error) {
      console.error('Error loading payment configs:', error)
    }
  }

  const loadPayPalSDK = (clientId: string) => {
    if (document.getElementById('paypal-sdk')) {
      setPaypalLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.id = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`
    script.onload = () => setPaypalLoaded(true)
    document.head.appendChild(script)
  }

  const initializeStripeElements = async () => {
    if (!stripe || elements) return

    const elementsInstance = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#8b5cf6',
        }
      }
    })

    const cardElementInstance = elementsInstance.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    })

    setElements(elementsInstance)
    setCardElement(cardElementInstance)

    // Mount card element
    setTimeout(() => {
      const cardContainer = document.getElementById('card-element')
      if (cardContainer && cardElementInstance) {
        cardElementInstance.mount('#card-element')
      }
    }, 100)
  }

  const createPaymentIntent = async (method: 'stripe' | 'paypal') => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          payment_method: method,
          description,
          metadata: {
            offer_id: offerId,
            service_type: 'tattoo_service',
            client_id: clientId,
            artist_id: artistId
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const data = await response.json()
      setPaymentIntent(data.payment_intent)
      return data
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  }

  const processStripePayment = async () => {
    if (!stripe || !cardElement) {
      toast.error('Stripe no está inicializado')
      return
    }

    setLoading(true)
    try {
      // Create payment intent
      const { client_secret } = await createPaymentIntent('stripe')

      // Confirm payment
      const { error, paymentIntent: stripePaymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Cliente InkLink',
          },
        }
      })

      if (error) {
        console.error('Stripe payment error:', error)
        toast.error(error.message || 'Error en el pago')
        onPaymentError?.(error.message || 'Error en el pago')
        return
      }

      if (stripePaymentIntent.status === 'succeeded') {
        // Update payment status in database
        await updatePaymentStatus(paymentIntent!.id, 'completed')
        
        toast.success('Pago completado exitosamente')
        setShowPaymentDialog(false)
        onPaymentSuccess?.(paymentIntent!)
      }
    } catch (error) {
      console.error('Error processing Stripe payment:', error)
      toast.error('Error al procesar el pago')
      onPaymentError?.('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const processPayPalPayment = async () => {
    if (!paypalLoaded || !window.paypal) {
      toast.error('PayPal no está disponible')
      return
    }

    try {
      // Create payment intent
      const { paypal_order_id } = await createPaymentIntent('paypal')

      // Render PayPal buttons
      const paypalButtonsInstance = window.paypal.Buttons({
        createOrder: () => paypal_order_id,
        onApprove: async (data: any) => {
          setLoading(true)
          try {
            // Capture payment
            const response = await fetch('/api/payments/paypal/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: data.orderID,
                payment_intent_id: paymentIntent!.id
              })
            })

            if (!response.ok) {
              throw new Error('Failed to capture PayPal payment')
            }

            const result = await response.json()
            
            if (result.status === 'COMPLETED') {
              await updatePaymentStatus(paymentIntent!.id, 'completed')
              toast.success('Pago completado exitosamente')
              setShowPaymentDialog(false)
              onPaymentSuccess?.(paymentIntent!)
            }
          } catch (error) {
            console.error('Error capturing PayPal payment:', error)
            toast.error('Error al completar el pago')
            onPaymentError?.('Error al completar el pago')
          } finally {
            setLoading(false)
          }
        },
        onError: (error: any) => {
          console.error('PayPal error:', error)
          toast.error('Error en PayPal')
          onPaymentError?.('Error en PayPal')
        }
      })

      // Clear previous buttons and render new ones
      const paypalContainer = document.getElementById('paypal-button-container')
      if (paypalContainer) {
        paypalContainer.innerHTML = ''
        paypalButtonsInstance.render('#paypal-button-container')
      }

      setPaypalButtons(paypalButtonsInstance)
    } catch (error) {
      console.error('Error setting up PayPal payment:', error)
      toast.error('Error al configurar PayPal')
      onPaymentError?.('Error al configurar PayPal')
    }
  }

  const updatePaymentStatus = async (paymentIntentId: string, status: string) => {
    try {
      await fetch(`/api/payments/${paymentIntentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  const handlePaymentMethodChange = (method: 'stripe' | 'paypal') => {
    setPaymentMethod(method)
    
    if (method === 'stripe' && stripe && !elements) {
      initializeStripeElements()
    } else if (method === 'paypal' && paypalLoaded) {
      processPayPalPayment()
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resumen del Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servicio:</span>
              <span className="font-medium">{description}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="text-lg font-bold">{formatAmount(amount, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Comisión de plataforma (5%):</span>
              <span>{formatAmount(amount * 0.05, currency)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Total a pagar:</span>
                <span className="text-lg">{formatAmount(amount * 1.05, currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <CreditCard className="w-5 h-5 mr-2" />
            Proceder al Pago
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Completar Pago</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stripeConfig && (
                    <SelectItem value="stripe">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Tarjeta de Crédito/Débito
                      </div>
                    </SelectItem>
                  )}
                  {paypalConfig && (
                    <SelectItem value="paypal">
                      <div className="flex items-center gap-2">
                        {/* Monochromatic palette - using gray instead of blue */}
                        <div className="w-4 h-4 bg-gray-600 rounded"></div>
                        PayPal
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Stripe Payment Form */}
            {paymentMethod === 'stripe' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Información de la tarjeta</Label>
                  <div 
                    id="card-element" 
                    className="p-3 border rounded-md bg-white"
                    style={{ minHeight: '40px' }}
                  >
                    {/* Stripe Elements will mount here */}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Pago seguro procesado por Stripe</span>
                </div>
                
                <Button 
                  onClick={processStripePayment}
                  disabled={loading || !stripe || !cardElement}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar {formatAmount(amount * 1.05, currency)}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* PayPal Payment */}
            {paymentMethod === 'paypal' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Pago seguro procesado por PayPal</span>
                </div>
                
                <div id="paypal-button-container" className="min-h-[45px]">
                  {!paypalLoaded && (
                    <div className="flex items-center justify-center p-4">
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Cargando PayPal...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Status */}
            {paymentIntent && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {paymentIntent.status === 'completed' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-700">Pago completado</span>
                    </>
                  )}
                  {paymentIntent.status === 'processing' && (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
                      <span className="text-sm text-yellow-700">Procesando pago...</span>
                    </>
                  )}
                  {paymentIntent.status === 'failed' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">Pago fallido</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="text-xs text-gray-500 text-center">
              <p>🔒 Tus datos de pago están protegidos con encriptación SSL</p>
              <p>InkLink no almacena información de tarjetas de crédito</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Payment status component for displaying payment history
export function PaymentStatus({ paymentIntentId }: { paymentIntentId: string }) {
  const [payment, setPayment] = useState<PaymentIntent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentStatus()
  }, [paymentIntentId])

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentIntentId}`)
      if (response.ok) {
        const data = await response.json()
        setPayment(data.payment_intent)
      }
    } catch (error) {
      console.error('Error fetching payment status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!payment) {
    return <div className="text-sm text-gray-500">Estado de pago no disponible</div>
  }

  // Monochromatic palette - using only grayscale colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-600 text-gray-100'
      case 'processing': return 'bg-gray-300 text-gray-800'
      case 'failed': return 'bg-gray-400 text-gray-900'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado'
      case 'processing': return 'Procesando'
      case 'failed': return 'Fallido'
      case 'cancelled': return 'Cancelado'
      default: return 'Pendiente'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(payment.status)}>
          {getStatusText(payment.status)}
        </Badge>
        <span className="text-sm text-gray-600">
          {new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: payment.currency
          }).format(payment.amount / 100)}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {payment.payment_method === 'stripe' ? 'Tarjeta' : 'PayPal'} • 
        {new Date(payment.created_at).toLocaleDateString('es-ES')}
      </div>
    </div>
  )
}