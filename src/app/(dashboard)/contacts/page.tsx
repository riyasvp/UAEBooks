import { redirect } from 'next/navigation'
import { getActiveCompanyId, getUserCompanies } from '@/lib/auth/company'
import { getCompany, getContacts } from '@/lib/db/queries'
import { ContactsPageContent } from '@/components/contacts/ContactsPageContent'

export default async function ContactsPage() {
  // Get user's companies
  const companies = await getUserCompanies()
  
  if (companies.length === 0) {
    redirect('/onboarding')
  }
  
  // Get active company
  const activeCompanyId = await getActiveCompanyId()
  const activeCompany = activeCompanyId ? await getCompany(activeCompanyId) : null
  
  // Get contacts for the active company
  const contacts = activeCompanyId ? await getContacts(activeCompanyId) : []
  
  return (
    <ContactsPageContent 
      initialContacts={contacts} 
      company={activeCompany}
    />
  )
}
