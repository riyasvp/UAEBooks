import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getActiveCompanyId, getUserCompanies, getUserProfile } from '@/lib/auth/company'
import { getCompany, getAccounts } from '@/lib/db/queries'
import { AccountsPageContent } from '@/components/accounts/AccountsPageContent'
import { Skeleton } from '@/components/ui/skeleton'

export default async function AccountsPage() {
  // Get user's companies
  const companies = await getUserCompanies()
  
  if (companies.length === 0) {
    redirect('/onboarding')
  }
  
  // Get active company
  const activeCompanyId = await getActiveCompanyId()
  const activeCompany = activeCompanyId ? await getCompany(activeCompanyId) : null
  
  // Get accounts for the active company
  const accounts = activeCompanyId ? await getAccounts(activeCompanyId) : []
  
  return (
    <AccountsPageContent 
      initialAccounts={accounts} 
      company={activeCompany}
    />
  )
}
