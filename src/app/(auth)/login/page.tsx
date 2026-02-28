'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Landmark, Loader2, User, Key, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    setError(null)
    setIsLoading(true)
    
    try {
      const { error } = await signIn('superadmin', 'PassW0rd')
      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Login failed')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Demo Credentials Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Demo Credentials
            </CardTitle>
            <CardDescription>
              Click the button below to login instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-background rounded-md p-3 border">
                <div className="text-muted-foreground text-xs mb-1">Username</div>
                <code className="font-mono font-semibold text-primary">superadmin</code>
              </div>
              <div className="bg-background rounded-md p-3 border">
                <div className="text-muted-foreground text-xs mb-1">Password</div>
                <code className="font-mono font-semibold text-primary">PassW0rd</code>
              </div>
            </div>
            <Button 
              onClick={handleDemoLogin} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Login with Demo Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Main Login Card */}
        <Card>
          <CardHeader className="space-y-1 text-center">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Landmark className="h-6 w-6 text-primary-foreground" />
              </div>
            </Link>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your UAE Books account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Username / Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter username or email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
        
        {/* Features Preview */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Demo includes: Invoicing • Bills • Payroll • WPS Export • Inventory • VAT Reports</p>
        </div>
      </div>
    </div>
  )
}
