'use client'

import { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'
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
  signOut: () => Promise<void>
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isDemoMode: boolean
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isDemoMode, setIsDemoMode] = useState(false)
  
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
      if (typeof window !== 'undefined') {
        const storedDemoMode = localStorage.getItem('uae-books-demo-mode')
        if (storedDemoMode === 'true') {
          setIsDemoMode(true)
          setAuth(DEMO_USER.user, {} as Session)
          setCompanies([DEMO_COMPANY])
          setActiveCompany(DEMO_COMPANY)
          setLoading(false)
          return
        }
      }
      
      setLoading(false)
    }

    initAuth()
  }, [setAuth, setLoading, setCompanies, setActiveCompany])

  const signIn = useCallback(async (email: string, password: string) => {
    // Check for demo credentials first
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      localStorage.setItem('uae-books-demo-mode', 'true')
      setIsDemoMode(true)
      setAuth(DEMO_USER.user, {} as Session)
      setCompanies([DEMO_COMPANY])
      setActiveCompany(DEMO_COMPANY)
      return { error: null }
    }

    return { error: new Error('Invalid credentials. Use superadmin / PassW0rd for demo access.') }
  }, [setAuth, setCompanies, setActiveCompany])

  const signOut = useCallback(async () => {
    localStorage.removeItem('uae-books-demo-mode')
    localStorage.removeItem('uae-books-demo-data')
    setIsDemoMode(false)
    logout()
    router.push('/login')
  }, [logout, router])

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        user,
        isLoading,
        isAuthenticated,
        isDemoMode,
        isConfigured: false, // Demo mode - Supabase not configured
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
