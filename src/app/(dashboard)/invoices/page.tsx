import { getActiveCompanyId } from '@/lib/auth/company'
import { getInvoices, getContacts } from '@/lib/db/queries'
import { InvoicesPageContent } from '@/components/invoices/InvoicesPageContent'

export default async function InvoicesPage() {
  const companyId = await getActiveCompanyId()
  
  const [invoices, contacts] = await Promise.all([
    companyId ? getInvoices(companyId) : [],
    companyId ? getContacts(companyId, 'customer') : []
  ])
  
  return (
    <InvoicesPageContent 
      initialInvoices={invoices}
      contacts={contacts}
    />
  )
}
