import { notFound } from 'next/navigation'
import { getActiveCompanyId } from '@/lib/auth/company'
import { getPayrollRun } from '@/lib/db/queries'
import { PayrollRunDetail } from '@/components/payroll/PayrollRunDetail'

async function getPayrollRunData(runId: string, companyId: string | null) {
  if (!companyId) return null
  
  try {
    const run = await getPayrollRun(runId)
    if (run.company_id !== companyId) {
      return null
    }
    return run
  } catch {
    return null
  }
}

export default async function PayrollRunDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const companyId = await getActiveCompanyId()
  
  const run = await getPayrollRunData(id, companyId)
  
  if (!run) {
    notFound()
  }
  
  return <PayrollRunDetail run={run} />
}
