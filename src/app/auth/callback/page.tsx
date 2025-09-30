// app/auth/callback/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [message, setMessage] = useState('Verifying your email...')

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                setMessage('Email verified successfully! Redirecting...')
                setTimeout(() => {
                    router.push('/dashboard') // Or your preferred redirect path
                }, 2000)
            } else {
                setMessage('Verification failed. Please try again.')
            }
        }

        checkSession()
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
                <p>{message}</p>
            </div>
        </div>
    )
}