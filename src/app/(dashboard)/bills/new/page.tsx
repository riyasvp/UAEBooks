import { redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getContacts, getAccounts, getProducts } from '@/lib/db/queries'
import { BillForm } from '@/components/bills/BillForm'

export default async function NewBillPage() {
  const companyId = await getActiveCompanyId()
  
  if (!companyId) {
    redirect('/dashboard')
  }
  
  const [contacts, accounts, products] = await Promise.all([
    getContacts(companyId),
    getAccounts(companyId),
    getProducts(companyId),
  ])
  
  return (
    <BillForm 
      contacts={contacts}
      accounts={accounts}
      products={products}
      companyId={companyId}
    />
  )
}
