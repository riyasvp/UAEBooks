import { getActiveCompanyId } from '@/lib/auth/company'
import { getPayrollRuns } from '@/lib/db/queries'
import { PayrollRunsContent } from '@/components/payroll/PayrollRunsContent'

export default async function PayrollRunsPage() {
  const companyId = await getActiveCompanyId()
  
  const payrollRuns = companyId ? await getPayrollRuns(companyId) : []
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll Runs</h1>
        <p className="text-muted-foreground">
          View and manage your payroll runs
        </p>
      </div>
      
      <PayrollRunsContent 
        payrollRuns={payrollRuns}
        companyId={companyId || ''}
      />
    </div>
  )
}
