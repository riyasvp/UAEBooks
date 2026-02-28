'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useIsAuthenticated, useIsLoading, useTheme, useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Settings } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isConfigured } = useAuth()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useIsLoading()
  const theme = useTheme()
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)

  // Apply theme on mount
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Redirect to login if not authenticated (only when Supabase is configured)
  useEffect(() => {
    if (!isLoading && isConfigured && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router, isConfigured])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated and Supabase is configured
  if (isConfigured && !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">
          {/* Show setup warning if Supabase is not configured */}
          {!isConfigured && (
            <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                Supabase Not Configured
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <p className="mb-2">
                  Authentication is disabled. To enable full functionality, configure your Supabase credentials:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm mb-3">
                  <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                  <li>Copy your project URL and anon key</li>
                  <li>Add them to <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code></li>
                </ol>
                <Button size="sm" variant="outline" asChild>
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                    <Settings className="h-4 w-4 mr-2" />
                    Open Supabase Dashboard
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
