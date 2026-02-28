import { getActiveCompanyId } from '@/lib/auth/company'
import { getBills, getContacts } from '@/lib/db/queries'
import { BillsPageContent } from '@/components/bills/BillsPageContent'

export default async function BillsPage() {
  const companyId = await getActiveCompanyId()
  
  const [bills, contacts] = await Promise.all([
    companyId ? getBills(companyId) : [],
    companyId ? getContacts(companyId, 'supplier') : []
  ])
  
  return (
    <BillsPageContent 
      initialBills={bills}
      contacts={contacts}
    />
  )
}
