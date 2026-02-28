'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export interface Company {
  id: string
  name: string
  nameAr: string | null
  logo: string | null
  industry: string
  vatRegistered: boolean
  trn: string | null
  currency: string
}

export interface AuthState {
  // Auth
  user: User | null
  session: Session | null
  profile: {
    id: string
    fullName: string | null
    avatarUrl: string | null
    role: string
  } | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Company
  companies: Company[]
  activeCompany: Company | null
  
  // UI
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'ar'
  
  // Actions
  setAuth: (user: User | null, session: Session | null) => void
  setProfile: (profile: AuthState['profile']) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  
  setCompanies: (companies: Company[]) => void
  setActiveCompany: (company: Company | null) => void
  switchCompany: (companyId: string) => void
  
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: 'en' | 'ar') => void
}

// ============================================
// STORE
// ============================================

export const useAppStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      companies: [],
      activeCompany: null,
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light',
      language: 'en',
      
      // Auth actions
      setAuth: (user, session) => set({
        user,
        session,
        isAuthenticated: !!user && !!session,
      }),
      
      setProfile: (profile) => set({ profile }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: () => set({
        user: null,
        session: null,
        profile: null,
        companies: [],
        activeCompany: null,
        isAuthenticated: false,
      }),
      
      // Company actions
      setCompanies: (companies) => {
        const { activeCompany } = get()
        set({
          companies,
          activeCompany: activeCompany && companies.find(c => c.id === activeCompany.id)
            ? activeCompany
            : companies[0] || null,
        })
      },
      
      setActiveCompany: (company) => set({ activeCompany: company }),
      
      switchCompany: (companyId) => {
        const { companies } = get()
        const company = companies.find(c => c.id === companyId)
        if (company) {
          set({ activeCompany: company })
        }
      },
      
      // UI actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      
      setTheme: (theme) => {
        set({ theme })
        if (typeof window !== 'undefined') {
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
        }
      },
      
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'uae-books-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeCompany: state.activeCompany,
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// ============================================
// SELECTORS
// ============================================

export const useUser = () => useAppStore((state) => state.user)
export const useProfile = () => useAppStore((state) => state.profile)
export const useActiveCompany = () => useAppStore((state) => state.activeCompany)
export const useCompanies = () => useAppStore((state) => state.companies)
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useIsLoading = () => useAppStore((state) => state.isLoading)
export const useTheme = () => useAppStore((state) => state.theme)
export const useLanguage = () => useAppStore((state) => state.language)
