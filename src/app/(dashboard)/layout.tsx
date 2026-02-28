import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getActiveCompanyId, getUserCompanies, getUserProfile } from '@/lib/auth/company'
import { getCompany, getAccounts } from '@/lib/db/queries'
import { CompanyProvider } from '@/components/providers/CompanyProvider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user's companies
  const companies = await getUserCompanies()
  
  // If no companies, user needs to create one
  if (companies.length === 0) {
    // For now, redirect to a placeholder - in production this would be an onboarding flow
    // return redirect('/onboarding')
  }
  
  // Get active company (first one for now)
  const activeCompanyId = await getActiveCompanyId()
  let activeCompany = null
  
  if (activeCompanyId) {
    activeCompany = await getCompany(activeCompanyId)
  }
  
  // Get user profile
  const profile = await getUserProfile()
  
  return (
    <CompanyProvider 
      companies={companies} 
      activeCompany={activeCompany}
      profile={profile}
    >
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </CompanyProvider>
  )
}
