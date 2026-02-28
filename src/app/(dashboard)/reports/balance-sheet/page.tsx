import { getActiveCompanyId } from '@/lib/auth/company'
import { getBalanceSheet, getCompany } from '@/lib/db/queries'
import { BalanceSheetPageContent } from '@/components/reports/BalanceSheetPageContent'

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ asOfDate?: string }>
}) {
  const params = await searchParams
  const companyId = await getActiveCompanyId()
  
  // Default to today
  const defaultAsOfDate = new Date().toISOString().split('T')[0]
  const asOfDate = params.asOfDate || defaultAsOfDate
  
  const [data, company] = await Promise.all([
    companyId ? getBalanceSheet(companyId, asOfDate) : {
      assets: { current: [], fixed: [], all: [], total: 0 },
      liabilities: { current: [], longTerm: [], all: [], total: 0 },
      equity: { all: [], total: 0 },
      totalLiabilitiesAndEquity: 0,
      isBalanced: true,
    },
    companyId ? getCompany(companyId) : { name: 'Company' }
  ])
  
  return (
    <BalanceSheetPageContent 
      initialData={data}
      initialAsOfDate={asOfDate}
      company={company}
    />
  )
}
