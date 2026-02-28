import { getActiveCompanyId } from '@/lib/auth/company'
import { getEmployees } from '@/lib/db/queries'
import { PayrollRunForm } from '@/components/payroll/PayrollRunForm'

export default async function NewPayrollRunPage() {
  const companyId = await getActiveCompanyId()
  
  const employees = companyId ? await getEmployees(companyId) : []
  
  return (
    <PayrollRunForm 
      employees={employees}
      companyId={companyId || ''}
    />
  )
}
