import { notFound, redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getInvoice } from '@/lib/db/queries'
import { InvoiceDetail } from '@/components/invoices/InvoiceDetail'

async function getInvoiceData(id: string, companyId: string) {
  try {
    const invoice = await getInvoice(id)
    if (!invoice || invoice.company_id !== companyId) {
      return null
    }
    return invoice
  } catch {
    return null
  }
}

export default async function InvoiceDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const companyId = await getActiveCompanyId()
  
  if (!companyId) {
    redirect('/dashboard')
  }
  
  const invoice = await getInvoiceData(params.id, companyId)
  
  if (!invoice) {
    notFound()
  }
  
  return <InvoiceDetail invoice={invoice} />
}
