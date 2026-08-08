'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Box, VStack, Heading, Text, Spinner, useToast, Button } from '@chakra-ui/react'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const toast = useToast()
  
  const locale = params?.locale || 'en'
  const reference = searchParams?.get('reference') || searchParams?.get('trxref')

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      return
    }

    let pollInterval: NodeJS.Timeout

    async function verifyOrder() {
      try {
        const response = await fetch(`/api/tickets/verify-order?reference=${reference}`)
        const data = await response.json()

        if (response.ok && data.success && data.orderId) {
          // If Paystack webhook has already marked it Successful, route to ticket pass immediately!
          if (["successful", "success", "paid"].includes((data.status || "").toLowerCase())) {
            clearInterval(pollInterval)
            setStatus('success')
            
            toast({
              title: "Payment Confirmed!",
              description: "Generating your ticket pass...",
              status: "success",
              duration: 3000,
              position: "top"
            })

            router.push(`/${locale}/tickets/${data.orderId}`)
          }
        }
      } catch (err) {
        console.error("Verification error:", err)
      }
    }

    // Initial check
    verifyOrder()

    // Poll every 2 seconds for up to 10 seconds while waiting for Paystack webhook
    let attempts = 0
    pollInterval = setInterval(() => {
      attempts++
      if (attempts > 5) {
        clearInterval(pollInterval)
        setStatus('failed')
        return
      }
      verifyOrder()
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [reference, router, locale, toast])

  return (
    <Box minH="100vh" bg="#0d0d0d" color="white" display="flex" alignItems="center" justifyContent="center" px="16px">
      <VStack spacing="24px" bg="#161616" p="32px" borderRadius="24px" border="1px solid #2a2a2a" maxW="420px" w="100%" textAlign="center">
        {status === 'verifying' && (
          <>
            <Spinner size="xl" color="#22c55e" thickness="4px" />
            <Heading size="md">Confirming Payment...</Heading>
            <Text fontSize="14px" color="gray.400">
              Please wait... 
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Heading size="md" color="#22c55e">✓ Payment Confirmed!</Heading>
            <Text fontSize="14px" color="gray.400">
              Redirecting you to your ticket receipt...
            </Text>
          </>
        )}

        {status === 'failed' && (
          <>
            <Heading size="md" color="#ef4444">✕ Verification Pending</Heading>
            <Text fontSize="14px" color="gray.400">
              Your payment is still processing, please wait.
            </Text>
            <Button bg="#22c55e" color="black" fontWeight="800" w="100%" onClick={() => router.push(`/${locale}/feed`)}>
              Return to Events
            </Button>
          </>
        )}
      </VStack>
    </Box>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" bg="#0d0d0d" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="#22c55e" />
      </Box>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}