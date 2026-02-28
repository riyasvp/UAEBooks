'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Company } from '@/types/database'

interface UserProfile {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  email?: string
}

interface CompanyContextType {
  companies: (Company & { role: string })[]
  activeCompany: Company | null
  profile: UserProfile | null
  switchCompany: (companyId: string) => void
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

interface CompanyProviderProps {
  children: ReactNode
  companies: (Company & { role: string })[]
  activeCompany: Company | null
  profile: UserProfile | null
}

export function CompanyProvider({ 
  children, 
  companies: initialCompanies,
  activeCompany: initialActiveCompany,
  profile 
}: CompanyProviderProps) {
  // For now, we don't manage state internally since switching requires a page refresh
  // In a more complex app, you'd use useState and potentially sync with localStorage
  
  const switchCompany = (companyId: string) => {
    // In a full implementation, this would:
    // 1. Update localStorage/cookie with selected company
    // 2. Refresh the page or update state
    window.location.href = `/dashboard?company=${companyId}`
  }
  
  return (
    <CompanyContext.Provider 
      value={{ 
        companies: initialCompanies, 
        activeCompany: initialActiveCompany,
        profile,
        switchCompany 
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

export function useActiveCompany() {
  const { activeCompany } = useCompany()
  return activeCompany
}

export function useCompanies() {
  const { companies } = useCompany()
  return companies
}

export function useProfile() {
  const { profile } = useCompany()
  return profile
}
