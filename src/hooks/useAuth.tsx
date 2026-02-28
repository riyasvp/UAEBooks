'use client'

import { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

// Demo user credentials
const DEMO_USER = {
  email: 'superadmin',
  password: 'PassW0rd',
  user: {
    id: 'demo-user-001',
    email: 'superadmin@uaebooks.ae',
    created_at: new Date().toISOString(),
    user_metadata: {
      full_name: 'Super Admin',
      role: 'superadmin',
    },
    app_metadata: {},
    aud: 'authenticated',
    confirmed_at: new Date().toISOString(),
  } as User,
}

// Demo company for the store
const DEMO_COMPANY = {
  id: 'demo-company-001',
  name: 'UAE Books Demo Company',
  nameAr: 'شركة يو أي إي بوكس التجريبية',
  logo: null,
  industry: 'Technology',
  vatRegistered: true,
  trn: '10001.23456.789.123',
  currency: 'AED',
}

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isConfigured] = useState(() => {
    // Check if Supabase is properly configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return !!(url && key && url.startsWith('http') && key.length > 20)
  })
  
  const {
    user,
    isAuthenticated,
    isLoading,
    setAuth,
    setLoading,
    logout,
    setCompanies,
    setActiveCompany,
  } = useAppStore()

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for demo mode in localStorage
      const storedDemoMode = localStorage.getItem('uae-books-demo-mode')
      if (storedDemoMode === 'true') {
        setIsDemoMode(true)
        setAuth(DEMO_USER.user, {} as Session)
        // Set demo company
        setCompanies([DEMO_COMPANY])
        setActiveCompany(DEMO_COMPANY)
        setLoading(false)
        return
      }

      // If Supabase is not configured, set loading to false and skip auth
      if (!isConfigured) {
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        setAuth(session?.user ?? null, session)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes only if Supabase is configured
    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setAuth(session?.user ?? null, session)
          
          if (event === 'SIGNED_IN') {
            router.push('/dashboard')
          } else if (event === 'SIGNED_OUT') {
            logout()
            router.push('/login')
          }
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [supabase, setAuth, setLoading, logout, router, isConfigured])

  const signIn = useCallback(async (email: string, password: string) => {
    // Check for demo credentials
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      localStorage.setItem('uae-books-demo-mode', 'true')
      setIsDemoMode(true)
      setAuth(DEMO_USER.user, {} as Session)
      // Set demo company
      setCompanies([DEMO_COMPANY])
      setActiveCompany(DEMO_COMPANY)
      return { error: null }
    }

    if (!isConfigured) {
      return { error: new Error('Invalid credentials. Use superadmin / PassW0rd for demo access.') }
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [supabase, isConfigured, setAuth, setCompanies, setActiveCompany])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured. Please set up your environment variables.') }
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [supabase, isConfigured])

  const signOut = useCallback(async () => {
    // Clear demo mode
    localStorage.removeItem('uae-books-demo-mode')
    localStorage.removeItem('uae-books-demo-data')
    setIsDemoMode(false)
    
    if (isConfigured) {
      await supabase.auth.signOut()
    }
    logout()
    router.push('/login')
  }, [supabase, logout, router, isConfigured])

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured. Please set up your environment variables.') }
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [supabase, isConfigured])

  const resetPassword = useCallback(async (email: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured. Please set up your environment variables.') }
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [supabase, isConfigured])

  const updatePassword = useCallback(async (password: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured. Please set up your environment variables.') }
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [supabase, isConfigured])

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        user,
        isLoading,
        isAuthenticated,
        isConfigured,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
