'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, Home } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  const handleRetry = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <CardTitle className="text-orange-600">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges have been made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRetry} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Try Payment Again
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}