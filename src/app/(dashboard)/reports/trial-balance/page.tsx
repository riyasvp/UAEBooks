import { getActiveCompanyId } from '@/lib/auth/company'
import { getTrialBalance, getCompany } from '@/lib/db/queries'
import { TrialBalancePageContent } from '@/components/reports/TrialBalancePageContent'

export default async function TrialBalancePage({
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
    companyId ? getTrialBalance(companyId, asOfDate) : {
      items: [],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true,
    },
    companyId ? getCompany(companyId) : { name: 'Company' }
  ])
  
  return (
    <TrialBalancePageContent 
      initialData={data}
      initialAsOfDate={asOfDate}
      company={company}
    />
  )
}
