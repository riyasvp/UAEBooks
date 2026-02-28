'use client'

import { useDashboardLayout } from './useDashboardLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAppStore, useIsAuthenticated, useIsLoading } from '@/store/useAppStore'
import { CompanyProvider } from '@/components/providers/CompanyProvider'
import type { Company } from '@/types/database'

// Demo company data
const DEMO_COMPANY: Company = {
  id: 'demo-company-001',
  name: 'UAE Books Demo Company',
  name_ar: 'شركة يو أي إي بوكس التجريبية',
  logo: null,
  industry: 'Technology',
  vat_registered: true,
  trn: '10001.23456.789.123',
  currency: 'AED',
  address: 'Business Bay, Dubai, UAE',
  phone: '+971 4 123 4567',
  email: 'info@uaebooks.ae',
  website: 'https://uaebooks.ae',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  fiscal_year_start: 1,
  tax_year_start: 1,
  vat_reg_date: '2023-01-01',
  legal_name: 'UAE Books Demo Company LLC',
  legal_entity_type: 'LLC',
}

const DEMO_PROFILE = {
  user_id: 'demo-user-001',
  full_name: 'Super Admin',
  avatar_url: null,
  email: 'superadmin@uaebooks.ae',
}

function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useIsLoading()
  const activeCompany = useAppStore((state) => state.activeCompany)
  const { mounted } = useDashboardLayout()
  
  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Use demo company if available, otherwise use DEMO_COMPANY constant
  const companyData: Company = activeCompany ? {
    id: activeCompany.id,
    name: activeCompany.name,
    name_ar: activeCompany.nameAr,
    logo: activeCompany.logo,
    industry: activeCompany.industry,
    vat_registered: activeCompany.vatRegistered,
    trn: activeCompany.trn,
    currency: activeCompany.currency,
    address: null,
    phone: null,
    email: null,
    website: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fiscal_year_start: 1,
    tax_year_start: 1,
  } : DEMO_COMPANY
  
  const companies = [{ ...companyData, role: 'admin' }]
  const profile = DEMO_PROFILE
  
  return (
    <CompanyProvider 
      companies={companies} 
      activeCompany={companyData}
      profile={profile}
    >
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </CompanyProvider>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
}
