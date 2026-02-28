import { redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getContacts, getAccounts, getProducts } from '@/lib/db/queries'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'

export default async function NewInvoicePage() {
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
    <InvoiceForm 
      contacts={contacts}
      accounts={accounts}
      products={products}
      companyId={companyId}
    />
  )
}
