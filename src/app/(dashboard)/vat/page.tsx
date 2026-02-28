import { getActiveCompanyId, getCompany } from '@/lib/auth/company'
import { calculateVatSummary, getVatReturns } from '@/lib/db/queries'
import { VatDashboardContent } from '@/components/vat/VatDashboardContent'

export default async function VatPage() {
  const companyId = await getActiveCompanyId()
  
  if (!companyId) {
    return <VatDashboardContent companyId="" company={null} vatSummary={null} vatReturns={[]} />
  }
  
  const company = await getCompany(companyId)
  
  // Calculate current quarter VAT
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const periodStart = new Date(now.getFullYear(), quarter * 3, 1)
  const periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
  
  const vatSummary = await calculateVatSummary(
    companyId,
    periodStart.toISOString().split('T')[0],
    periodEnd.toISOString().split('T')[0]
  )
  
  const vatReturns = await getVatReturns(companyId)
  
  return (
    <VatDashboardContent 
      companyId={companyId}
      company={company}
      vatSummary={vatSummary}
      vatReturns={vatReturns}
    />
  )
}
