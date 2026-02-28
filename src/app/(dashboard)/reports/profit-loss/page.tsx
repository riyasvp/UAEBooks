import { getActiveCompanyId, getUserCompanies } from '@/lib/auth/company'
import { getProfitAndLoss, getCompany } from '@/lib/db/queries'
import { ProfitLossPageContent } from '@/components/reports/ProfitLossPageContent'

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}) {
  const params = await searchParams
  const companyId = await getActiveCompanyId()
  
  // Default to current year
  const now = new Date()
  const defaultStart = `${now.getFullYear()}-01-01`
  const defaultEnd = now.toISOString().split('T')[0]
  
  const startDate = params.startDate || defaultStart
  const endDate = params.endDate || defaultEnd
  
  const [data, company] = await Promise.all([
    companyId ? getProfitAndLoss(companyId, startDate, endDate) : {
      revenue: [],
      totalRevenue: 0,
      cogs: [],
      totalCogs: 0,
      grossProfit: 0,
      expenses: [],
      totalExpenses: 0,
      otherIncome: [],
      totalOtherIncome: 0,
      netProfit: 0,
    },
    companyId ? getCompany(companyId) : { name: 'Company' }
  ])
  
  return (
    <ProfitLossPageContent 
      initialData={data}
      initialStartDate={startDate}
      initialEndDate={endDate}
      company={company}
      companyId={companyId || ''}
    />
  )
}
