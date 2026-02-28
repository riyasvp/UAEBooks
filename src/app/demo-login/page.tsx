'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Landmark } from 'lucide-react'

export default function DemoLoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [status, setStatus] = useState('Signing in as demo user...')

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const { error } = await signIn('superadmin', 'PassW0rd')
        if (error) {
          setStatus('Login failed: ' + error.message)
        } else {
          setStatus('Login successful! Redirecting to dashboard...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 500)
        }
      } catch (err) {
        setStatus('An error occurred during login')
      }
    }

    // Small delay to ensure auth provider is ready
    const timer = setTimeout(autoLogin, 300)
    return () => clearTimeout(timer)
  }, [signIn, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary animate-pulse">
          <Landmark className="h-8 w-8 text-primary-foreground" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground">{status}</p>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>Demo Credentials:</p>
          <p><code className="bg-muted px-2 py-1 rounded">superadmin</code> / <code className="bg-muted px-2 py-1 rounded">PassW0rd</code></p>
        </div>
      </div>
    </div>
  )
}
